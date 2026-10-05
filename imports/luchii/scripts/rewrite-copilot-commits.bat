@echo off
REM Rewrite Copilot commits to Frasberg Selassie
REM Windows batch version

setlocal enabledelayedexpansion

if "%1"=="" (
    set DRY_RUN=1
    echo Running in DRY-RUN mode...
) else if "%1"=="--force" (
    set DRY_RUN=0
) else (
    echo Usage: %0 [--dry-run^|--force]
    echo.
    echo Default (no args): Run in dry-run mode (safe, shows what would change^)
    echo --force:           Execute the rewrite (WARNING: modifies history^)
    exit /b 1
)

setlocal
set OLD_NAME=copilot-swe-agent[bot]
set OLD_EMAIL=198982749+Copilot@users.noreply.github.com
set NEW_NAME=Frasberg Selassie
set NEW_EMAIL=frasberg@frasberg.ai

echo Counting commits to rewrite...
for /f %%A in ('git log --all --oneline --author=%OLD_NAME% ^| find /c /v ""') do set COMMIT_COUNT=%%A

echo Found %COMMIT_COUNT% commits to rewrite
echo   From: %OLD_NAME% ^<%OLD_EMAIL%^>
echo   To:   %NEW_NAME% ^<%NEW_EMAIL%^>
echo.

if %DRY_RUN%==1 (
    echo [DRY-RUN] Showing what would be changed:
    echo.
    git log --all --pretty=format:"%%h %%an %%ae %%s" --author=%OLD_NAME% -10
    echo ... (showing first 10 of %COMMIT_COUNT%^)
    echo.
    echo To execute the rewrite, run: %0 --force
    exit /b 0
)

echo [EXECUTING] Rewriting commit history...
echo This may take a few minutes...
echo.

set GIT_COMMITTER_NAME=%NEW_NAME%
set GIT_COMMITTER_EMAIL=%NEW_EMAIL%

git filter-branch --env-filter ^ 
    "if [ '^$GIT_AUTHOR_NAME' = '%OLD_NAME%' ]; then ^ 
        export GIT_AUTHOR_NAME='%NEW_NAME%'; ^ 
        export GIT_AUTHOR_EMAIL='%NEW_EMAIL%'; ^ 
    fi; ^ 
    if [ '^$GIT_COMMITTER_NAME' = '%OLD_NAME%' ]; then ^ 
        export GIT_COMMITTER_NAME='%NEW_NAME%'; ^ 
        export GIT_COMMITTER_EMAIL='%NEW_EMAIL%'; ^ 
    fi" ^ 
    -f -- --all

echo.
echo ✅ Rewrite complete!
echo.
echo Verifying new history:
git log --all --pretty=format:"%%h %%an %%s" --author=%NEW_NAME% -10
echo.
echo Next steps:
echo 1. Review the history: git log --all --oneline
echo 2. Force-push to all branches: git push --force --all
echo 3. Force-push tags: git push --force --tags
