# ============================================
# Jira Notifier - 개발 모드 실행
# .\run-dev.ps1
# ============================================

Write-Host ""
Write-Host "  Jira Notifier 개발 모드 시작..." -ForegroundColor Cyan
Write-Host "  (첫 실행 시 Rust 컴파일로 3~5분 소요)" -ForegroundColor Gray
Write-Host "  종료: Ctrl+C" -ForegroundColor Gray
Write-Host ""

cargo tauri dev
