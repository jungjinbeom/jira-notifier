mod jira;

use chrono::Utc;
use jira::{JiraClient, JiraConfig, JiraNotification, UnassignedTicket};
use serde::{Deserialize, Serialize};

/// 미배정 티켓을 조회할 프로젝트 키
const CS_PROJECT: &str = "CS";
use std::sync::Arc;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, State, WindowEvent,
};
use tauri_plugin_shell::ShellExt;
use tokio::sync::Mutex;

/// 자동 실행(부팅)으로 켜졌을 때 창을 띄우지 않기 위한 인자.
const MINIMIZED_FLAG: &str = "--minimized";

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

// ─── 알림 목록 영속화 ────────────────────────────────────────────
// 읽음 처리는 "삭제"가 아니라 "표시"이므로, 목록 자체가 이력이 된다.
// 메모리에만 두면 앱을 껐다 켤 때 이력이 날아가므로 디스크에 저장한다.

fn notifications_store_path() -> std::path::PathBuf {
    data_dir().join("notifications.json")
}

fn load_notifications() -> Vec<JiraNotification> {
    std::fs::read_to_string(notifications_store_path())
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_notifications(list: &[JiraNotification]) {
    if let Ok(json) = serde_json::to_string(list) {
        let _ = std::fs::write(notifications_store_path(), json);
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

/// 폴링 태스크가 필요로 하는 공유 핸들 묶음.
/// `State<AppState>`는 커맨드 안에서만 얻을 수 있으므로, setup(앱 시작)에서도
/// 같은 폴링 로직을 재사용할 수 있도록 Arc만 따로 복제해 넘긴다.
#[derive(Clone)]
struct PollingHandles {
    config: Arc<Mutex<JiraConfig>>,
    notifications: Arc<Mutex<Vec<JiraNotification>>>,
    is_polling: Arc<Mutex<bool>>,
    seen_ids: Arc<Mutex<std::collections::HashSet<String>>>,
    unassigned: Arc<Mutex<Vec<UnassignedTicket>>>,
    my_tickets: Arc<Mutex<Vec<UnassignedTicket>>>,
}

impl AppState {
    fn handles(&self) -> PollingHandles {
        PollingHandles {
            config: self.config.clone(),
            notifications: self.notifications.clone(),
            is_polling: self.is_polling.clone(),
            seen_ids: self.seen_ids.clone(),
            unassigned: self.unassigned.clone(),
            my_tickets: self.my_tickets.clone(),
        }
    }
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

/// 폴링 시작 (커맨드) — 헤더의 ▶ 버튼용.
#[tauri::command]
async fn start_polling(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    begin_polling(app, state.handles()).await
}

/// 폴링 시작 (내부) — 커맨드와 앱 시작 시 자동 실행이 공유한다.
async fn begin_polling(app: AppHandle, state: PollingHandles) -> Result<String, String> {
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
    let handles = state.clone(); // 트레이 갱신용

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
                    // 읽음 이력이 재시작 후에도 남도록 디스크에 저장
                    save_notifications(&all);
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

            // 5. 트레이 아이콘/툴팁/바로가기 메뉴에 현황 반영
            refresh_tray(&app, &handles).await;

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

/// 알림 읽음 처리: 목록에서 지우지 않고 read 플래그만 세운다.
/// 나중에 "아까 그 티켓 뭐였지?"를 다시 찾아볼 수 있어야 하기 때문이다.
/// 목록을 비우는 것은 사용자가 명시적으로 누르는 "전체 삭제"의 몫이다.
#[tauri::command]
async fn mark_as_read(
    app: AppHandle,
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    {
        let mut notifications = state.notifications.lock().await;
        if let Some(n) = notifications.iter_mut().find(|n| n.id == id) {
            n.read = true;
            log::info!("[읽음] {} ({})", n.issue_key, n.id);
        }
        save_notifications(&notifications);
    }
    refresh_tray(&app, &state.handles()).await;
    Ok(())
}

/// 모든 알림 읽음 처리: 마찬가지로 목록은 유지하고 표시만 바꾼다.
#[tauri::command]
async fn mark_all_read(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    {
        let mut notifications = state.notifications.lock().await;
        let unread = notifications.iter().filter(|n| !n.read).count();
        log::info!("[모두 읽음] {}건 처리", unread);
        for n in notifications.iter_mut() {
            n.read = true;
        }
        save_notifications(&notifications);
    }
    refresh_tray(&app, &state.handles()).await;
    Ok(())
}

/// 알림 전체 삭제: 보이는 목록만 비운다.
///
/// seen_ids(재알림 방지 이력)는 절대 비우지 않는다. 여기를 비우면 이미 확인하고
/// 지운 티켓이 다음 폴링에서 다시 새 알림으로 잡혀 되살아난다
/// (알림 id가 `assign-{issue_key}`처럼 이슈당 고정이고, 티켓이 한 번만 더
/// updated 되면 JQL에 다시 걸리기 때문).
#[tauri::command]
async fn clear_notifications(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let cleared_ids: Vec<String> = {
        let mut notifications = state.notifications.lock().await;
        let ids = notifications.iter().map(|n| n.id.clone()).collect();
        log::info!("[전체 삭제] {}건 삭제 (재알림 이력은 유지)", notifications.len());
        notifications.clear();
        save_notifications(&notifications);
        ids
    };
    {
        // 지운 알림의 id를 이력에 확실히 남겨 다시 뜨지 않게 한다.
        let mut seen = state.seen_ids.lock().await;
        seen.extend(cleared_ids);
        save_seen(&seen);
    }
    refresh_tray(&app, &state.handles()).await;
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

// ─── System Tray ──────────────────────────────────────────────

/// 트레이에 숨어 있던 창을 다시 띄운다.
fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

const TRAY_ID: &str = "main-tray";
const MENU_OPEN: &str = "open";
const MENU_QUIT: &str = "quit";
/// 알림 바로가기 메뉴 항목의 id 접두사. 뒤에 이슈 URL이 붙는다.
const MENU_ISSUE_PREFIX: &str = "issue:";
/// 트레이 메뉴에 노출할 최근 미확인 알림 개수.
const TRAY_RECENT_LIMIT: usize = 5;

/// 트레이에 표시할 현황.
struct TrayView {
    unread: usize,
    unassigned: usize,
    my_tickets: usize,
    /// 최근 미확인 알림 (라벨, URL)
    recent: Vec<(String, String)>,
}

/// 기본 아이콘 우하단에 빨간 점을 찍은 "미확인 있음" 아이콘.
/// Windows 트레이는 숫자 배지를 지원하지 않아 아이콘 자체를 바꿔야 한다.
/// 매 폴링마다 다시 그릴 필요가 없으므로 최초 1회만 계산한다.
fn badged_icon(app: &AppHandle) -> Option<Image<'static>> {
    static CACHE: std::sync::OnceLock<Option<(Vec<u8>, u32, u32)>> = std::sync::OnceLock::new();

    let cached = CACHE.get_or_init(|| {
        let base = app.default_window_icon()?;
        let (w, h) = (base.width(), base.height());
        let mut rgba = base.rgba().to_vec();

        let radius = (w.min(h) as f32 * 0.26).max(3.0);
        let (cx, cy) = (w as f32 - radius - 1.0, h as f32 - radius - 1.0);

        for y in 0..h {
            for x in 0..w {
                let (dx, dy) = (x as f32 - cx, y as f32 - cy);
                if dx * dx + dy * dy <= radius * radius {
                    let i = ((y * w + x) * 4) as usize;
                    // 가장자리는 흰 테두리를 둬 어두운 배경에서도 보이게 한다
                    let edge = dx * dx + dy * dy > (radius - 1.5).max(0.0).powi(2);
                    let (r, g, b) = if edge { (255, 255, 255) } else { (229, 57, 53) };
                    rgba[i] = r;
                    rgba[i + 1] = g;
                    rgba[i + 2] = b;
                    rgba[i + 3] = 255;
                }
            }
        }
        Some((rgba, w, h))
    });

    cached
        .as_ref()
        .map(|(rgba, w, h)| Image::new_owned(rgba.clone(), *w, *h))
}

/// 현황을 트레이(아이콘/툴팁/메뉴)에 반영한다.
/// 메뉴 조작은 Windows에서 메인 스레드를 요구하므로 run_on_main_thread로 넘긴다.
fn apply_tray_view(app: &AppHandle, view: TrayView) {
    let app = app.clone();
    let _ = app.clone().run_on_main_thread(move || {
        let Some(tray) = app.tray_by_id(TRAY_ID) else {
            return;
        };

        let tooltip = if view.unread == 0 && view.unassigned == 0 && view.my_tickets == 0 {
            "Jira Notifier".to_string()
        } else {
            format!(
                "Jira Notifier — 미확인 {} · 미배정 {} · 내 담당 {}",
                view.unread, view.unassigned, view.my_tickets
            )
        };
        let _ = tray.set_tooltip(Some(&tooltip));

        let icon = if view.unread > 0 {
            badged_icon(&app)
        } else {
            app.default_window_icon().cloned()
        };
        let _ = tray.set_icon(icon);

        // 데스크톱에서는 OS 알림 클릭을 가로챌 수 없으므로(플러그인 미지원),
        // 트레이 메뉴에 최근 미확인 알림을 직접 걸어 최단 경로를 만든다.
        match build_tray_menu(&app, &view.recent) {
            Ok(menu) => {
                let _ = tray.set_menu(Some(menu));
                log::info!("[트레이] {} (바로가기 {}건)", tooltip, view.recent.len());
            }
            Err(e) => log::error!("[트레이] 메뉴 구성 실패: {}", e),
        }
    });
}

/// 트레이 우클릭 메뉴 구성: [최근 알림…] / 열기 / 종료
fn build_tray_menu(
    app: &AppHandle,
    recent: &[(String, String)],
) -> tauri::Result<tauri::menu::Menu<tauri::Wry>> {
    let menu = Menu::new(app)?;

    if !recent.is_empty() {
        for (label, url) in recent {
            let item = MenuItem::with_id(
                app,
                format!("{MENU_ISSUE_PREFIX}{url}"),
                label,
                true,
                None::<&str>,
            )?;
            menu.append(&item)?;
        }
        menu.append(&PredefinedMenuItem::separator(app)?)?;
    }

    menu.append(&MenuItem::with_id(app, MENU_OPEN, "열기", true, None::<&str>)?)?;
    menu.append(&MenuItem::with_id(app, MENU_QUIT, "종료", true, None::<&str>)?)?;
    Ok(menu)
}

/// 현재 상태를 읽어 트레이를 갱신한다.
async fn refresh_tray(app: &AppHandle, state: &PollingHandles) {
    let (unread, recent) = {
        let notifications = state.notifications.lock().await;
        let unread = notifications.iter().filter(|n| !n.read).count();
        let recent = notifications
            .iter()
            .filter(|n| !n.read)
            .take(TRAY_RECENT_LIMIT)
            .map(|n| {
                let icon = match n.notification_type {
                    jira::NotificationType::Mention => "💬",
                    jira::NotificationType::Assigned => "👤",
                };
                // 메뉴 한 줄에 들어가도록 요약을 자른다
                let summary: String = n.summary.chars().take(40).collect();
                (format!("{icon} {} — {}", n.issue_key, summary), n.url.clone())
            })
            .collect();
        (unread, recent)
    };

    apply_tray_view(
        app,
        TrayView {
            unread,
            unassigned: state.unassigned.lock().await.len(),
            my_tickets: state.my_tickets.lock().await.len(),
            recent,
        },
    );
}

/// 트레이 아이콘 + 우클릭 메뉴를 구성한다.
/// 창을 닫아도 앱이 살아있으므로, 종료 수단은 이 메뉴가 유일하다.
fn setup_tray(app: &AppHandle) -> tauri::Result<()> {
    let menu = build_tray_menu(app, &[])?;

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(app.default_window_icon().cloned().ok_or_else(|| {
            tauri::Error::AssetNotFound("default window icon".to_string())
        })?)
        .tooltip("Jira Notifier")
        .menu(&menu)
        // 좌클릭은 메뉴가 아니라 창 열기로 동작해야 한다.
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            match id {
                MENU_OPEN => show_main_window(app),
                MENU_QUIT => app.exit(0),
                // 알림 바로가기: 브라우저에서 해당 이슈를 연다
                _ if id.starts_with(MENU_ISSUE_PREFIX) => {
                    let url = &id[MENU_ISSUE_PREFIX.len()..];
                    // shell().open은 deprecated(→ tauri-plugin-opener)이지만,
                    // 프론트엔드(utils/url.ts)도 plugin-shell을 쓰고 있어 일관성을 위해 유지한다.
                    // 옮길 때는 FE/BE를 함께 opener로 바꿀 것.
                    #[allow(deprecated)]
                    if let Err(e) = app.shell().open(url, None) {
                        log::error!("이슈 열기 실패 ({}): {}", url, e);
                    }
                }
                _ => {}
            }
        })
        // 좌클릭을 뗄 때만 창을 연다. `Click { .. }`로 전부 받으면 우클릭에서도
        // 창이 떠올라 포커스를 뺏고, 그 순간 OS 컨텍스트 메뉴가 닫혀버린다.
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
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
        // 부팅 시 자동 실행. --minimized 인자로 켜지면 창 없이 트레이에만 상주한다.
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![MINIMIZED_FLAG]),
        ))
        .manage(AppState {
            // 디스크에 저장된 설정을 불러옴 (없으면 기본값)
            config: Arc::new(Mutex::new(load_config_from_disk())),
            // 디스크에 저장된 알림 이력을 복원 (읽음 상태 포함)
            notifications: Arc::new(Mutex::new(load_notifications())),
            is_polling: Arc::new(Mutex::new(false)),
            // 디스크에 저장된 알림 이력을 불러와 재알림 방지
            seen_ids: Arc::new(Mutex::new(load_seen())),
            unassigned: Arc::new(Mutex::new(Vec::new())),
            my_tickets: Arc::new(Mutex::new(Vec::new())),
        })
        // 창의 X 버튼은 앱을 종료하지 않고 트레이로 숨긴다.
        // (알림 앱이므로 창을 닫았다고 감시가 멈추면 안 된다. 종료는 트레이 메뉴로만.)
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .setup(|app| {
            setup_tray(app.handle())?;

            // 부팅 자동 실행 등록 (이미 등록돼 있으면 무시된다).
            // dev 빌드는 target/debug의 임시 exe가 부팅에 등록되므로 제외한다.
            #[cfg(not(debug_assertions))]
            {
                use tauri_plugin_autostart::ManagerExt;
                let autostart = app.autolaunch();
                match autostart.is_enabled() {
                    Ok(false) => {
                        if let Err(e) = autostart.enable() {
                            log::error!("자동 실행 등록 실패: {}", e);
                        } else {
                            log::info!("자동 실행 등록 완료");
                        }
                    }
                    Ok(true) => log::info!("자동 실행 이미 등록됨"),
                    Err(e) => log::error!("자동 실행 상태 확인 실패: {}", e),
                }
            }

            // --minimized(부팅 자동 실행)로 켜졌으면 창을 띄우지 않는다.
            // 창은 visible:true로 생성한 뒤, 자동 실행일 때만 즉시 숨긴다.
            // (visible:false로 만들면 Windows에서 최소화 상태로 잡혀 show()로도 복구되지 않는다.)
            let launched_minimized = std::env::args().any(|a| a == MINIMIZED_FLAG);
            if launched_minimized {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
                log::info!("자동 실행 감지 · 트레이 상주로 시작");
            }

            // 저장된 설정이 유효하면 ▶ 버튼을 누르지 않아도 바로 감시를 시작한다.
            let handles = app.state::<AppState>().handles();
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                // 복원된 알림 이력을 먼저 트레이에 반영 (첫 폴링 전에도 현황이 보이도록)
                refresh_tray(&app_handle, &handles).await;
                match begin_polling(app_handle, handles).await {
                    Ok(msg) => log::info!("자동 폴링 시작: {}", msg),
                    Err(e) => log::info!("자동 폴링 미시작: {}", e),
                }
            });

            Ok(())
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
