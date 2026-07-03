@echo off
chcp 65001 >nul 2>&1
title Jira Notifier - 환경 설정

echo.
echo ========================================
echo   Jira Notifier - 환경 설정
echo ========================================
echo.

set HAS_ERROR=0

:: ─── 1. Node.js 체크 ───
echo [1/4] Node.js 확인 중...
where node >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "tokens=*" %%i in ('node --version') do echo   OK - Node.js %%i
) else (
    echo   MISSING - Node.js가 설치되어 있지 않습니다
    echo   다운로드: https://nodejs.org
    set HAS_ERROR=1
)

:: ─── 2. Rust 체크 ───
echo [2/4] Rust 확인 중...
where rustc >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "tokens=*" %%i in ('rustc --version') do echo   OK - %%i
) else (
    echo   MISSING - Rust가 설치되어 있지 않습니다
    echo   다운로드: https://rustup.rs
    set HAS_ERROR=1
)

:: ─── 3. Cargo 체크 ───
echo [3/4] Cargo 확인 중...
where cargo >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "tokens=*" %%i in ('cargo --version') do echo   OK - %%i
) else (
    echo   MISSING - Cargo가 설치되어 있지 않습니다
    echo   Rust 설치 시 함께 설치됩니다
    set HAS_ERROR=1
)

:: ─── 4. npm 체크 ───
echo [4/4] npm 확인 중...
where npm >nul 2>&1
if %ERRORLEVEL%==0 (
    for /f "tokens=*" %%i in ('npm --version') do echo   OK - npm %%i
) else (
    echo   MISSING - npm이 설치되어 있지 않습니다
    echo   Node.js 설치 시 함께 설치됩니다
    set HAS_ERROR=1
)

echo.

:: ─── 에러 시 중단 ───
if %HAS_ERROR%==1 (
    echo ========================================
    echo   위 누락 항목을 먼저 설치한 후
    echo   이 스크립트를 다시 실행하세요.
    echo ========================================
    echo.
    pause
    exit /b 1
)

:: ─── 5. Tauri CLI 설치 ───
echo [설치] Tauri CLI 설치 중... (최초 실행 시 3-5분 소요)
cargo install tauri-cli --version "^2"

:: ─── 6. npm 의존성 설치 ───
echo.
echo [설치] npm 패키지 설치 중...
call npm install

:: ─── 7. 기본 아이콘 생성 ───
echo.
echo [설치] 앱 아이콘 생성 중...
cargo tauri icon 2>nul
if %ERRORLEVEL%==0 (
    echo   OK - 아이콘 생성 완료
) else (
    echo   SKIP - 아이콘은 나중에 수동 생성 가능
    echo   사용법: cargo tauri icon 아이콘파일.png
)

echo.
echo ========================================
echo   세팅 완료!
echo.
echo   개발 모드 실행:  run-dev.bat
echo   앱 빌드:        build.bat
echo ========================================
echo.
pause
