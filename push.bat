@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   菲律賓話題週報 - 同步到 GitHub
echo ============================================
echo.

REM 取得今天日期 YYYY-MM-DD（跨地區語系穩定方式）
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set _DT=%%I
if defined _DT (
  set TODAY=%_DT:~0,4%-%_DT:~4,2%-%_DT:~6,2%
) else (
  set TODAY=%DATE%
)

echo [1/3] git add .
git add .
if errorlevel 1 (
  echo.
  echo [錯誤] git add 失敗，請檢查資料夾是否為 git repo
  echo.
  pause
  exit /b 1
)

echo.
echo [2/3] git commit -m "Weekly update %TODAY%"
git commit -m "Weekly update %TODAY%"
if errorlevel 1 (
  echo.
  echo [提示] 沒有變更可 commit
  echo 可能本週排程尚未執行，或內容已是最新狀態
  echo.
  pause
  exit /b 0
)

echo.
echo [3/3] git push
git push
if errorlevel 1 (
  echo.
  echo [錯誤] git push 失敗
  echo 常見原因：網路問題、PAT 過期、需要重新登入
  echo 請手動執行 "git push" 看完整錯誤訊息
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   完成！GitHub Pages 約 5 分鐘內更新
echo ============================================
echo.
echo 提示：可關閉此視窗
echo.
pause
