use base64::Engine;
use chrono::{DateTime, Utc};
use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};

/// Jira 타임스탬프 파싱. Jira는 "2026-07-02T11:31:39.829+0900"처럼
/// 콜론 없는 오프셋을 사용해 표준 rfc3339 파서가 실패하므로 %z 포맷으로 재시도한다.
fn parse_jira_datetime(s: &str) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(s)
        .or_else(|_| DateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S%.f%z"))
        .map(|dt| dt.with_timezone(&Utc))
        .ok()
}

/// Jira 연결 설정
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JiraConfig {
    pub base_url: String,       // e.g. "https://your-domain.atlassian.net"
    pub email: String,           // Jira 계정 이메일
    pub api_token: String,       // Jira API 토큰
    pub username: String,        // Jira 사용자명 (멘션 감지용)
    pub display_name: String,    // 표시 이름 (멘션 감지용)
    pub poll_interval_secs: u64, // 폴링 간격 (초)
}

impl Default for JiraConfig {
    fn default() -> Self {
        Self {
            base_url: String::new(),
            email: String::new(),
            api_token: String::new(),
            username: String::new(),
            display_name: String::new(),
            poll_interval_secs: 60,
        }
    }
}

/// Jira 이슈 검색 결과
#[derive(Debug, Deserialize)]
pub struct SearchResult {
    #[serde(default)]
    pub issues: Vec<JiraIssue>,
    // 새 /search/jql 엔드포인트는 total을 반환하지 않으므로 Optional
    #[serde(rename = "total", default)]
    pub _total: Option<i32>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JiraIssue {
    pub key: String,
    pub fields: IssueFields,
    #[serde(rename = "self")]
    pub self_url: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct IssueFields {
    pub summary: Option<String>,
    pub assignee: Option<JiraUser>,
    pub reporter: Option<JiraUser>,
    pub updated: Option<String>,
    pub comment: Option<CommentContainer>,
    pub status: Option<IssueStatus>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct IssueStatus {
    pub name: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct JiraUser {
    #[serde(rename = "displayName")]
    pub display_name: Option<String>,
    #[serde(rename = "accountId")]
    pub account_id: Option<String>,
    #[serde(rename = "emailAddress")]
    pub email_address: Option<String>,
    pub name: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CommentContainer {
    pub comments: Vec<Comment>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Comment {
    pub id: Option<String>,
    pub body: Option<String>,
    pub author: Option<JiraUser>,
    pub updated: Option<String>,
    pub created: Option<String>,
}

/// 알림 항목
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JiraNotification {
    pub id: String,
    pub issue_key: String,
    pub summary: String,
    pub notification_type: NotificationType,
    pub message: String,
    pub timestamp: String,
    pub url: String,
    pub read: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NotificationType {
    Mention,
    Assigned,
}

/// 미배정 티켓 (담당자 없는 이슈)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnassignedTicket {
    pub key: String,
    pub summary: String,
    pub status: String,
    pub reporter: String,
    pub updated: String,
    pub url: String,
}

/// Jira API 클라이언트
pub struct JiraClient {
    client: reqwest::Client,
    config: JiraConfig,
}

impl JiraClient {
    pub fn new(config: JiraConfig) -> Self {
        let client = reqwest::Client::builder()
            .danger_accept_invalid_certs(false)
            .build()
            .unwrap_or_default();

        Self { client, config }
    }

    /// 인증 헤더 생성
    fn auth_headers(&self) -> HeaderMap {
        let mut headers = HeaderMap::new();
        let credentials = format!("{}:{}", self.config.email, self.config.api_token);
        let encoded = base64::engine::general_purpose::STANDARD.encode(credentials);
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Basic {}", encoded)).unwrap(),
        );
        headers.insert(ACCEPT, HeaderValue::from_static("application/json"));
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        headers
    }

    /// 나에게 할당된 새 이슈 검색
    pub async fn check_new_assignments(
        &self,
        since: &DateTime<Utc>,
    ) -> Result<Vec<JiraNotification>, String> {
        let since_str = since.format("%Y-%m-%d %H:%M").to_string();

        // JQL: 나에게 할당되었고, 최근에 업데이트된 이슈
        // (Jira Cloud는 이메일로 assignee 조회가 제한되므로 currentUser() 사용)
        let jql = format!(
            "assignee = currentUser() AND updated >= '{}' ORDER BY updated DESC",
            since_str
        );
        log::info!("[담당자] JQL: {}", jql);

        let issues = self.search_issues(&jql).await?;
        log::info!("[담당자] JQL 반환 이슈 수: {}", issues.len());
        let mut notifications = Vec::new();

        for issue in &issues {
            let summary = issue
                .fields
                .summary
                .clone()
                .unwrap_or_else(|| "(제목 없음)".to_string());
            let status = issue
                .fields
                .status
                .as_ref()
                .and_then(|s| s.name.clone())
                .unwrap_or_default();

            notifications.push(JiraNotification {
                // 이슈당 안정적인 ID (매 사이클 중복 알림 방지)
                id: format!("assign-{}", issue.key),
                issue_key: issue.key.clone(),
                summary: summary.clone(),
                notification_type: NotificationType::Assigned,
                message: format!("[{}] {} ({})", issue.key, summary, status),
                timestamp: Utc::now().to_rfc3339(),
                url: format!("{}/browse/{}", self.config.base_url, issue.key),
                read: false,
            });
        }

        Ok(notifications)
    }

    /// 멘션된 새 코멘트 검색
    pub async fn check_new_mentions(
        &self,
        since: &DateTime<Utc>,
    ) -> Result<Vec<JiraNotification>, String> {
        let since_str = since.format("%Y-%m-%d %H:%M").to_string();

        // JQL: 최근 코멘트가 달린 이슈 검색
        let jql = format!(
            "comment ~ '{}' AND updated >= '{}' ORDER BY updated DESC",
            self.config.username, since_str
        );
        log::info!("[멘션] JQL: {}", jql);

        let issues = self.search_issues_with_comments(&jql).await?;
        log::info!("[멘션] JQL 반환 이슈 수: {}", issues.len());
        let mut notifications = Vec::new();

        for issue in &issues {
            if let Some(ref comment_container) = issue.fields.comment {
                for comment in &comment_container.comments {
                    let body = comment.body.clone().unwrap_or_default();
                    let comment_time = comment
                        .created
                        .as_ref()
                        .or(comment.updated.as_ref())
                        .cloned()
                        .unwrap_or_default();

                    // 멘션 포함 여부 확인 (@username 또는 displayName)
                    let is_mentioned = body.contains(&format!("@{}", self.config.username))
                        || body.contains(&self.config.display_name)
                        || body.contains(&format!("[~{}]", self.config.username))
                        || body.contains(&format!("[~accountid:", ));

                    // 시간 비교: since 이후의 코멘트만
                    // (Jira는 '+0900'처럼 콜론 없는 오프셋을 쓰므로 rfc3339 파싱이 실패 →
                    //  %z 포맷으로 재시도. 파싱 실패 시 새 것으로 취급하지 않음)
                    let is_new = parse_jira_datetime(&comment_time)
                        .map(|ct| ct > *since)
                        .unwrap_or(false);

                    // 자기 자신의 코멘트 제외
                    let is_self = comment
                        .author
                        .as_ref()
                        .map(|a| {
                            a.email_address
                                .as_ref()
                                .map(|e| e == &self.config.email)
                                .unwrap_or(false)
                                || a.name
                                    .as_ref()
                                    .map(|n| n == &self.config.username)
                                    .unwrap_or(false)
                        })
                        .unwrap_or(false);

                    log::info!(
                        "[멘션] {} 코멘트 id={} 작성자='{}' created='{}' | is_mentioned={} is_new={} is_self={} | body(앞120자)='{}'",
                        issue.key,
                        comment.id.clone().unwrap_or_default(),
                        comment.author.as_ref().and_then(|a| a.display_name.clone()).unwrap_or_default(),
                        comment_time,
                        is_mentioned,
                        is_new,
                        is_self,
                        body.chars().take(120).collect::<String>()
                    );

                    if is_mentioned && is_new && !is_self {
                        let author_name = comment
                            .author
                            .as_ref()
                            .and_then(|a| a.display_name.clone())
                            .unwrap_or_else(|| "알 수 없음".to_string());

                        let summary = issue
                            .fields
                            .summary
                            .clone()
                            .unwrap_or_else(|| "(제목 없음)".to_string());

                        let comment_id = comment.id.clone().unwrap_or_default();

                        notifications.push(JiraNotification {
                            id: format!("mention-{}-{}", issue.key, comment_id),
                            issue_key: issue.key.clone(),
                            summary: summary.clone(),
                            notification_type: NotificationType::Mention,
                            message: format!(
                                "{}님이 [{}] {}에서 멘션했습니다",
                                author_name, issue.key, summary
                            ),
                            timestamp: comment_time,
                            url: format!("{}/browse/{}", self.config.base_url, issue.key),
                            read: false,
                        });
                    }
                }
            }
        }

        Ok(notifications)
    }

    /// 이슈 목록을 티켓 요약으로 변환
    fn to_tickets(&self, issues: &[JiraIssue]) -> Vec<UnassignedTicket> {
        issues
            .iter()
            .map(|issue| UnassignedTicket {
                key: issue.key.clone(),
                summary: issue
                    .fields
                    .summary
                    .clone()
                    .unwrap_or_else(|| "(제목 없음)".to_string()),
                status: issue
                    .fields
                    .status
                    .as_ref()
                    .and_then(|s| s.name.clone())
                    .unwrap_or_default(),
                reporter: issue
                    .fields
                    .reporter
                    .as_ref()
                    .and_then(|r| r.display_name.clone())
                    .unwrap_or_default(),
                updated: issue.fields.updated.clone().unwrap_or_default(),
                url: format!("{}/browse/{}", self.config.base_url, issue.key),
            })
            .collect()
    }

    /// 특정 프로젝트의 미배정(담당자 없는) 티켓 목록 조회
    pub async fn get_unassigned_tickets(
        &self,
        project: &str,
    ) -> Result<Vec<UnassignedTicket>, String> {
        let jql = format!(
            "project = {} AND assignee IS EMPTY ORDER BY updated DESC",
            project
        );
        log::info!("[미배정] JQL: {}", jql);

        let issues = self.search_issues(&jql).await?;
        log::info!("[미배정] 반환 티켓 수: {}", issues.len());
        Ok(self.to_tickets(&issues))
    }

    /// 특정 프로젝트에서 본인이 담당자이고 "해야 할 일/진행 중" 상태인 티켓 조회
    /// (statusCategory 사용 → 워크플로 상태명/언어에 무관하게 완료 제외)
    pub async fn get_my_active_tickets(
        &self,
        project: &str,
    ) -> Result<Vec<UnassignedTicket>, String> {
        let jql = format!(
            "project = {} AND assignee = currentUser() AND statusCategory IN (\"To Do\", \"In Progress\") ORDER BY updated DESC",
            project
        );
        log::info!("[배정] JQL: {}", jql);

        let issues = self.search_issues(&jql).await?;
        log::info!("[배정] 반환 티켓 수: {}", issues.len());
        Ok(self.to_tickets(&issues))
    }

    /// JQL로 이슈 검색
    async fn search_issues(&self, jql: &str) -> Result<Vec<JiraIssue>, String> {
        // 구 /rest/api/2/search 는 폐기(410). 신규 /search/jql 사용 (CHANGE-2046)
        let url = format!("{}/rest/api/2/search/jql", self.config.base_url);

        let response = self
            .client
            .get(&url)
            .headers(self.auth_headers())
            .query(&[
                ("jql", jql),
                ("maxResults", "50"),
                ("fields", "summary,assignee,reporter,updated,status"),
            ])
            .send()
            .await
            .map_err(|e| format!("Jira API 요청 실패: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("Jira API 에러 ({}): {}", status, body));
        }

        let result: SearchResult = response
            .json()
            .await
            .map_err(|e| format!("응답 파싱 실패: {}", e))?;

        Ok(result.issues)
    }

    /// JQL로 이슈 검색 (코멘트 포함)
    async fn search_issues_with_comments(&self, jql: &str) -> Result<Vec<JiraIssue>, String> {
        // 구 /rest/api/2/search 는 폐기(410). 신규 /search/jql 사용 (CHANGE-2046)
        let url = format!("{}/rest/api/2/search/jql", self.config.base_url);

        let response = self
            .client
            .get(&url)
            .headers(self.auth_headers())
            .query(&[
                ("jql", jql),
                ("maxResults", "20"),
                ("fields", "summary,assignee,updated,status,comment"),
            ])
            .send()
            .await
            .map_err(|e| format!("Jira API 요청 실패: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("Jira API 에러 ({}): {}", status, body));
        }

        let result: SearchResult = response
            .json()
            .await
            .map_err(|e| format!("응답 파싱 실패: {}", e))?;

        Ok(result.issues)
    }

    /// 연결 테스트
    pub async fn test_connection(&self) -> Result<JiraUser, String> {
        let url = format!("{}/rest/api/2/myself", self.config.base_url);

        let response = self
            .client
            .get(&url)
            .headers(self.auth_headers())
            .send()
            .await
            .map_err(|e| format!("연결 실패: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("인증 실패 ({}): {}", status, body));
        }

        let user: JiraUser = response
            .json()
            .await
            .map_err(|e| format!("응답 파싱 실패: {}", e))?;

        Ok(user)
    }
}
