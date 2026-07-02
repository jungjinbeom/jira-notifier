# ============================================
# Jira Notifier - 환경 체크 & 프로젝트 세팅
# PowerShell에서 실행: .\setup.ps1
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Jira Notifier - 환경 설정" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$hasError = $false

# ─── 1. Node.js 체크 ───
Write-Host "[1/4] Node.js 확인 중..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "  OK - Node.js $nodeVersion" -ForegroundColor Green
    } else {
        throw "not found"
    }
} catch {
    Write-Host "  MISSING - Node.js가 설치되어 있지 않습니다" -ForegroundColor Red
    Write-Host "  다운로드: https://nodejs.org (LTS 버전)" -ForegroundColor Gray
    $hasError = $true
}

# ─── 2. Rust 체크 ───
Write-Host "[2/4] Rust 확인 중..." -ForegroundColor Yellow
try {
    $rustVersion = rustc --version 2>$null
    if ($rustVersion) {
        Write-Host "  OK - $rustVersion" -ForegroundColor Green
    } else {
        throw "not found"
    }
} catch {
    Write-Host "  MISSING - Rust가 설치되어 있지 않습니다" -ForegroundColor Red
    Write-Host "  다운로드: https://rustup.rs" -ForegroundColor Gray
    $hasError = $true
}

# ─── 3. C++ Build Tools 체크 ───
Write-Host "[3/4] C++ Build Tools 확인 중..." -ForegroundColor Yellow
$vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (Test-Path $vsWhere) {
    $vsInstall = & $vsWhere -latest -products * -requires Microsoft.VisualCpp.Tools.HostX64.TargetX64 -property displayName 2>$null
    if ($vsInstall) {
        Write-Host "  OK - $vsInstall" -ForegroundColor Green
    } else {
        Write-Host "  MISSING - C++ Build Tools 워크로드가 없습니다" -ForegroundColor Red
        Write-Host "  Visual Studio Installer에서 'C++를 사용한 데스크톱 개발' 추가" -ForegroundColor Gray
        $hasError = $true
    }
} else {
    # cl.exe로 대체 확인
    $cl = Get-Command cl.exe -ErrorAction SilentlyContinue
    if ($cl) {
        Write-Host "  OK - cl.exe 발견" -ForegroundColor Green
    } else {
        Write-Host "  MISSING - Visual Studio C++ Build Tools가 필요합니다" -ForegroundColor Red
        Write-Host "  다운로드: https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Gray
        $hasError = $true
    }
}

# ─── 4. WebView2 체크 ───
Write-Host "[4/4] WebView2 확인 중..." -ForegroundColor Yellow
$webview2 = Get-ItemProperty -Path "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BEB-235B8DE587E0}" -ErrorAction SilentlyContinue
if ($webview2) {
    Write-Host "  OK - WebView2 설치됨" -ForegroundColor Green
} else {
    Write-Host "  WARNING - WebView2가 감지되지 않음 (Windows 10/11은 보통 기본 포함)" -ForegroundColor DarkYellow
}

Write-Host ""

# ─── 에러 시 중단 ───
if ($hasError) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  위 누락 항목을 먼저 설치한 후" -ForegroundColor Red
    Write-Host "  이 스크립트를 다시 실행하세요." -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# ─── 5. Tauri CLI 설치 ───
Write-Host "[설치] Tauri CLI 설치 중..." -ForegroundColor Yellow
cargo install tauri-cli --version "^2" 2>$null
Write-Host "  OK - Tauri CLI 설치 완료" -ForegroundColor Green

# ─── 6. npm 의존성 설치 ───
Write-Host "[설치] npm 패키지 설치 중..." -ForegroundColor Yellow
npm install
Write-Host "  OK - npm 패키지 설치 완료" -ForegroundColor Green

# ─── 7. 기본 아이콘 생성 ───
Write-Host "[설치] 앱 아이콘 생성 중..." -ForegroundColor Yellow
cargo tauri icon 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  SKIP - 기본 아이콘 생성 실패 (수동으로 cargo tauri icon <png파일> 실행)" -ForegroundColor DarkYellow
} else {
    Write-Host "  OK - 아이콘 생성 완료" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  세팅 완료!" -ForegroundColor Green
Write-Host "" -ForegroundColor Green
Write-Host "  개발 모드 실행:  .\run-dev.ps1" -ForegroundColor White
Write-Host "  앱 빌드:        .\build.ps1" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
