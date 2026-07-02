@echo off
chcp 65001 >nul 2>&1
title Jira Notifier - 개발 모드

echo.
echo   Jira Notifier 개발 모드 시작...
echo   (첫 실행 시 Rust 컴파일로 3-5분 소요)
echo   종료: Ctrl+C
echo.

cargo tauri dev
