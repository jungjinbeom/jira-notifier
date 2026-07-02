mod jira;

use chrono::Utc;
use jira::{JiraClient, JiraConfig, JiraNotification, UnassignedTicket};
use serde::{Deserialize, Serialize};

/// 미배정 티켓을 조회할 프로젝트 키
const CS_PROJECT: &str = "CS";
use std::sync::Arc;
use tauri::{
    tray::TrayIconEvent, AppHandle, Emitter, Manager, State,
};
use tokio::sync::Mutex;

// ─── 알림 이력 영속화 (중복/재알림 방지) ─────────────────────────
// 이미 알림을 보낸 항목 ID를 디스크에 저장해, 매 사이클은 물론
// 앱을 껐다 켜도 이미 확인(알림 간) 건은 다시 알림하지 않는다.

fn data_dir() -> std::path::PathBuf {
    let base = std::env::var("APPDATA")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| std::env::temp_dir());
    let dir = base.join("jira-notifier");
    let _ = std::fs::create_dir_all(&dir);
    dir
}

fn seen_store_path() -> std::path::PathBuf {
    data_dir().join("seen.json")
}

fn load_seen() -> std::collections::HashSet<String> {
    std::fs::read_to_string(seen_store_path())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_seen(set: &std::collections::HashSet<String>) {
    if let Ok(json) = serde_json::to_string(set) {
        let _ = std::fs::write(seen_store_path(), json);
    }
}

// ─── 설정 영속화 (URL/이메일/토큰 등을 재입력하지 않도록 저장) ─────
fn config_store_path() -> std::path::PathBuf {
    data_dir().join("config.json")
}

fn load_config_from_disk() -> JiraConfig {
    std::fs::read_to_string(config_store_path())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_config_to_disk(cfg: &JiraConfig) {
    if let Ok(json) = serde_json::to_string_pretty(cfg) {
        let _ = std::fs::write(config_store_path(), json);
    }
}

/// 앱 상태
pub struct AppState {
    config: Arc<Mutex<JiraConfig>>,
    notifications: Arc<Mutex<Vec<JiraNotification>>>,
    is_polling: Arc<Mutex<bool>>,
    seen_ids: Arc<Mutex<std::collections::HashSet<String>>>,
    unassigned: Arc<Mutex<Vec<UnassignedTicket>>>,
    my_tickets: Arc<Mutex<Vec<UnassignedTicket>>>,
}

/// 프론트엔드로 전송할 상태 정보
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PollingStatus {
    is_active: bool,
    last_check: Option<String>,
    notification_count: usize,
    unread_count: usize,
}

// ─── Tauri Commands ───────────────────────────────────────────

/// 설정 저장
#[tauri::command]
async fn save_config(
    state: State<'_, AppState>,
    config: JiraConfig,
) -> Result<String, String> {
    let mut current = state.config.lock().await;
    *current = config;
    save_config_to_disk(&current); // 디스크에 영속화 (다음 실행 시 자동 로드)
    Ok("설정이 저장되었습니다".to_string())
}

/// 설정 불러오기
#[tauri::command]
async fn get_config(state: State<'_, AppState>) -> Result<JiraConfig, String> {
    let config = state.config.lock().await;
    Ok(config.clone())
}

/// 연결 테스트
#[tauri::command]
async fn test_connection(config: JiraConfig) -> Result<String, String> {
    let client = JiraClient::new(config);
    let user = client.test_connection().await?;
    let display = user
        .display_name
        .unwrap_or_else(|| "Unknown".to_string());
    Ok(format!("연결 성공! 사용자: {}", display))
}

/// 폴링 시작
#[tauri::command]
async fn start_polling(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let mut is_polling = state.is_polling.lock().await;
    if *is_polling {
        return Ok("이미 실행 중입니다".to_string());
    }
    *is_polling = true;
    drop(is_polling);

    let config = state.config.lock().await.clone();
    if config.base_url.is_empty() || config.email.is_empty() || config.api_token.is_empty() {
        let mut is_polling = state.is_polling.lock().await;
        *is_polling = false;
        return Err("Jira 설정을 먼저 입력해주세요".to_string());
    }

    let poll_interval = config.poll_interval_secs;
    let config_arc = state.config.clone();
    let notifications_arc = state.notifications.clone();
    let is_polling_arc = state.is_polling.clone();
    let seen_ids_arc = state.seen_ids.clone();
    let unassigned_arc = state.unassigned.clone();
    let my_tickets_arc = state.my_tickets.clone();

    // 백그라운드 폴링 태스크
    tokio::spawn(async move {
        let mut last_check = Utc::now();
        log::info!("폴링 시작 (간격: {}초)", poll_interval);

        loop {
            // 폴링 상태 확인
            {
                let polling = is_polling_arc.lock().await;
                if !*polling {
                    log::info!("폴링 중지됨");
                    break;
                }
            }

            // 설정 읽기
            let config = {
                let c = config_arc.lock().await;
                c.clone()
            };

            log::info!(
                "── 폴링 사이클 실행 (since={}, username='{}', display_name='{}')",
                last_check.to_rfc3339(),
                config.username,
                config.display_name
            );

            let client = JiraClient::new(config);
            let mut new_notifications: Vec<JiraNotification> = Vec::new();

            // 1. 담당자 변경 확인
            match client.check_new_assignments(&last_check).await {
                Ok(assigned) => {
                    for n in assigned {
                        let mut seen = seen_ids_arc.lock().await;
                        if !seen.contains(&n.id) {
                            seen.insert(n.id.clone());
                            new_notifications.push(n);
                        }
                    }
                }
                Err(e) => log::error!("담당자 확인 실패: {}", e),
            }

            // 2. 멘션 확인
            match client.check_new_mentions(&last_check).await {
                Ok(mentions) => {
                    for n in mentions {
                        let mut seen = seen_ids_arc.lock().await;
                        if !seen.contains(&n.id) {
                            seen.insert(n.id.clone());
                            new_notifications.push(n);
                        }
                    }
                }
                Err(e) => log::error!("멘션 확인 실패: {}", e),
            }

            // 새 알림이 있으면 처리
            if !new_notifications.is_empty() {
                log::info!("새 알림 {}건 발견", new_notifications.len());

                // 저장
                {
                    let mut all = notifications_arc.lock().await;
                    for n in &new_notifications {
                        all.insert(0, n.clone());
                    }
                    // 최대 200개 유지
                    all.truncate(200);
                }

                // 프론트엔드에 이벤트 전송
                for n in &new_notifications {
                    let _ = app.emit("new-notification", n.clone());

                    // Windows 알림 발송
                    send_native_notification(&app, n);
                }

                // 알림 이력 디스크 저장 (재시작 후에도 재알림 방지)
                {
                    let seen = seen_ids_arc.lock().await;
                    save_seen(&seen);
                }
            }

            // 3. CS 미배정 티켓 갱신 (폴링 자동 갱신)
            match client.get_unassigned_tickets(CS_PROJECT).await {
                Ok(tickets) => {
                    {
                        let mut list = unassigned_arc.lock().await;
                        *list = tickets.clone();
                    }
                    let _ = app.emit("unassigned-updated", tickets);
                }
                Err(e) => log::error!("미배정 티켓 조회 실패: {}", e),
            }

            // 4. 내 담당(진행중) 티켓 갱신 (폴링 자동 갱신)
            match client.get_my_active_tickets(CS_PROJECT).await {
                Ok(tickets) => {
                    {
                        let mut list = my_tickets_arc.lock().await;
                        *list = tickets.clone();
                    }
                    let _ = app.emit("my-tickets-updated", tickets);
                }
                Err(e) => log::error!("배정 티켓 조회 실패: {}", e),
            }

            last_check = Utc::now();

            // 대기
            tokio::time::sleep(tokio::time::Duration::from_secs(poll_interval)).await;
        }
    });

    Ok("폴링이 시작되었습니다".to_string())
}

/// 폴링 중지
#[tauri::command]
async fn stop_polling(state: State<'_, AppState>) -> Result<String, String> {
    let mut is_polling = state.is_polling.lock().await;
    *is_polling = false;
    Ok("폴링이 중지되었습니다".to_string())
}

/// 현재 상태 조회
#[tauri::command]
async fn get_status(state: State<'_, AppState>) -> Result<PollingStatus, String> {
    let is_active = *state.is_polling.lock().await;
    let notifications = state.notifications.lock().await;
    let unread = notifications.iter().filter(|n| !n.read).count();

    Ok(PollingStatus {
        is_active,
        last_check: Some(Utc::now().to_rfc3339()),
        notification_count: notifications.len(),
        unread_count: unread,
    })
}

/// 알림 목록 조회
#[tauri::command]
async fn get_notifications(
    state: State<'_, AppState>,
) -> Result<Vec<JiraNotification>, String> {
    let notifications = state.notifications.lock().await;
    Ok(notifications.clone())
}

/// 미배정 티켓 조회 (캐시된 목록 반환)
#[tauri::command]
async fn get_unassigned(state: State<'_, AppState>) -> Result<Vec<UnassignedTicket>, String> {
    let list = state.unassigned.lock().await;
    Ok(list.clone())
}

/// 미배정 티켓 즉시 새로고침 (설정 저장 후 수동 호출용)
#[tauri::command]
async fn refresh_unassigned(
    state: State<'_, AppState>,
) -> Result<Vec<UnassignedTicket>, String> {
    let config = state.config.lock().await.clone();
    if config.base_url.is_empty() || config.email.is_empty() || config.api_token.is_empty() {
        return Err("Jira 설정을 먼저 입력해주세요".to_string());
    }
    let client = JiraClient::new(config);
    let tickets = client.get_unassigned_tickets(CS_PROJECT).await?;
    let mut list = state.unassigned.lock().await;
    *list = tickets.clone();
    Ok(tickets)
}

/// 내 담당(진행중) 티켓 조회 (캐시된 목록 반환)
#[tauri::command]
async fn get_my_tickets(state: State<'_, AppState>) -> Result<Vec<UnassignedTicket>, String> {
    let list = state.my_tickets.lock().await;
    Ok(list.clone())
}

/// 내 담당(진행중) 티켓 즉시 새로고침
#[tauri::command]
async fn refresh_my_tickets(
    state: State<'_, AppState>,
) -> Result<Vec<UnassignedTicket>, String> {
    let config = state.config.lock().await.clone();
    if config.base_url.is_empty() || config.email.is_empty() || config.api_token.is_empty() {
        return Err("Jira 설정을 먼저 입력해주세요".to_string());
    }
    let client = JiraClient::new(config);
    let tickets = client.get_my_active_tickets(CS_PROJECT).await?;
    let mut list = state.my_tickets.lock().await;
    *list = tickets.clone();
    Ok(tickets)
}

/// 알림 읽음 처리
#[tauri::command]
async fn mark_as_read(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    let mut notifications = state.notifications.lock().await;
    if let Some(n) = notifications.iter_mut().find(|n| n.id == id) {
        n.read = true;
    }
    Ok(())
}

/// 모든 알림 읽음 처리
#[tauri::command]
async fn mark_all_read(state: State<'_, AppState>) -> Result<(), String> {
    let mut notifications = state.notifications.lock().await;
    for n in notifications.iter_mut() {
        n.read = true;
    }
    Ok(())
}

/// 알림 전체 삭제
#[tauri::command]
async fn clear_notifications(state: State<'_, AppState>) -> Result<(), String> {
    let mut notifications = state.notifications.lock().await;
    notifications.clear();
    let mut seen = state.seen_ids.lock().await;
    seen.clear();
    save_seen(&seen); // 디스크 이력도 비움
    Ok(())
}

// ─── Native Notification ──────────────────────────────────────

fn send_native_notification(app: &AppHandle, notification: &JiraNotification) {
    use tauri_plugin_notification::NotificationExt;

    let title = match notification.notification_type {
        jira::NotificationType::Mention => format!("💬 멘션 - {}", notification.issue_key),
        jira::NotificationType::Assigned => {
            format!("👤 담당자 지정 - {}", notification.issue_key)
        }
    };

    let _ = app
        .notification()
        .builder()
        .title(&title)
        .body(&notification.message)
        .show();
}

// ─── App Entry ────────────────────────────────────────────────

pub fn run() {
    // 로그를 파일로 저장 (릴리스 빌드는 콘솔이 없으므로 파일이 유일한 확인 수단)
    let log_path = std::env::temp_dir().join("jira-notifier.log");
    let mut builder = env_logger::Builder::new();
    builder.filter_level(log::LevelFilter::Info).parse_default_env();
    match std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
    {
        Ok(file) => {
            builder.target(env_logger::Target::Pipe(Box::new(file)));
        }
        Err(_) => {}
    }
    let _ = builder.try_init();
    log::info!("=========================================");
    log::info!("Jira Notifier 시작 · 로그 파일: {}", log_path.display());

    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            // 디스크에 저장된 설정을 불러옴 (없으면 기본값)
            config: Arc::new(Mutex::new(load_config_from_disk())),
            notifications: Arc::new(Mutex::new(Vec::new())),
            is_polling: Arc::new(Mutex::new(false)),
            // 디스크에 저장된 알림 이력을 불러와 재알림 방지
            seen_ids: Arc::new(Mutex::new(load_seen())),
            unassigned: Arc::new(Mutex::new(Vec::new())),
            my_tickets: Arc::new(Mutex::new(Vec::new())),
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click { .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            save_config,
            get_config,
            test_connection,
            start_polling,
            stop_polling,
            get_status,
            get_notifications,
            get_unassigned,
            refresh_unassigned,
            get_my_tickets,
            refresh_my_tickets,
            mark_as_read,
            mark_all_read,
            clear_notifications,
        ])
        .run(tauri::generate_context!())
        .expect("Tauri 앱 실행 실패");
}
