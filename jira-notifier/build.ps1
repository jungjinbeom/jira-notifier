# ============================================
# Jira Notifier - 프로덕션 빌드
# .\build.ps1
# ============================================

Write-Host ""
Write-Host "  Jira Notifier 프로덕션 빌드 시작..." -ForegroundColor Cyan
Write-Host "  (5~10분 소요될 수 있습니다)" -ForegroundColor Gray
Write-Host ""

cargo tauri build

if ($LASTEXITCODE -eq 0) {
    $bundlePath = "src-tauri\target\release\bundle"
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  빌드 완료!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""

    # MSI 파일 찾기
    $msi = Get-ChildItem "$bundlePath\msi\*.msi" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($msi) {
        Write-Host "  MSI 설치파일:" -ForegroundColor White
        Write-Host "  $($msi.FullName)" -ForegroundColor Yellow
        Write-Host ""
    }

    # NSIS exe 파일 찾기
    $nsis = Get-ChildItem "$bundlePath\nsis\*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($nsis) {
        Write-Host "  EXE 설치파일:" -ForegroundColor White
        Write-Host "  $($nsis.FullName)" -ForegroundColor Yellow
        Write-Host ""
    }

    # 빌드 폴더 열기
    Write-Host "  설치파일 폴더를 여시겠습니까? (Y/N)" -ForegroundColor Gray
    $answer = Read-Host
    if ($answer -eq "Y" -or $answer -eq "y") {
        explorer $bundlePath
    }
} else {
    Write-Host ""
    Write-Host "  빌드 실패. 위 에러 메시지를 확인하세요." -ForegroundColor Red
    Write-Host ""
}
