@echo off
chcp 65001 >nul 2>&1
title Jira Notifier - 프로덕션 빌드

echo.
echo   Jira Notifier 프로덕션 빌드 시작...
echo   (5-10분 소요될 수 있습니다)
echo.

cargo tauri build

if %ERRORLEVEL%==0 (
    echo.
    echo ========================================
    echo   빌드 완료!
    echo ========================================
    echo.
    echo   설치파일 위치:
    echo   src-tauri\target\release\bundle\msi\  (.msi)
    echo   src-tauri\target\release\bundle\nsis\ (.exe)
    echo.

    set /p OPEN_FOLDER=설치파일 폴더를 여시겠습니까? (Y/N): 
    if /i "%OPEN_FOLDER%"=="Y" (
        explorer src-tauri\target\release\bundle
    )
) else (
    echo.
    echo   빌드 실패. 위 에러 메시지를 확인하세요.
    echo.
)

pause
