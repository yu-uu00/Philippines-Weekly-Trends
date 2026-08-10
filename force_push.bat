@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   強制同步本機版本到 GitHub
echo ============================================
echo.
echo [1/3] git add .
git add .

echo.
echo [2/3] git commit (如已是最新則略過)
git commit -m "Force sync W25 2026-06-15"

echo.
echo [3/3] git push --force
git push --force
if errorlevel 1 (
  echo.
  echo [錯誤] push 失敗，請截圖此視窗給 Claude 看
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   完成！GitHub Pages 約 5 分鐘內更新
echo ============================================
echo.
pause
