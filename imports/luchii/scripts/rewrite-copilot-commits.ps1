# Rewrite Copilot commits to Frasberg Selassie
# Windows-compatible version

param(
    [ValidateSet("", "--dry-run", "--force")]
    [string]$Mode = ""
)

$DryRun = ($Mode -ne "--force")

# Configuration
$OldName = "copilot-swe-agent[bot]"
$OldEmail = "198982749+Copilot@users.noreply.github.com"
$NewName = "Frasberg Selassie"
$NewEmail = "frasberg@frasberg.ai"

# Count commits to be rewritten
$CommitCount = $(git log --all --oneline --author="$OldName" | Measure-Object -Line).Lines
Write-Host "Found $CommitCount commits to rewrite"
Write-Host "  From: $OldName <$OldEmail>"
Write-Host "  To:   $NewName <$NewEmail>"
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY-RUN] Showing what would be changed:"
    Write-Host ""
    git log --all --pretty=format:"%h %an %ae %s" --author="$OldName" | Select-Object -First 10
    Write-Host "... (showing first 10 of $CommitCount)"
    Write-Host ""
    Write-Host "To execute the rewrite, run: powershell scripts\rewrite-copilot-commits.ps1 --force"
    exit 0
}

# Backup current branch
Write-Host "[BACKUP] Creating backup of current branch..."
$CurrentBranch = $(git rev-parse --abbrev-ref HEAD)
$BackupBranch = "backup/$CurrentBranch/$(Get-Date -Format 'yyyyMMdd-HHmmss')"
git branch "$BackupBranch"
Write-Host "✅ Backup created: $BackupBranch"
Write-Host ""

# Execute the rewrite
Write-Host "[EXECUTING] Rewriting commit history..."
$env:GIT_COMMITTER_NAME = $NewName
$env:GIT_COMMITTER_EMAIL = $NewEmail

$FilterScript = @"
    if [ "`$GIT_COMMITTER_NAME" = "$OldName" ]; then
        export GIT_COMMITTER_NAME="$NewName"
        export GIT_COMMITTER_EMAIL="$NewEmail"
    fi
    if [ "`$GIT_AUTHOR_NAME" = "$OldName" ]; then
        export GIT_AUTHOR_NAME="$NewName"
        export GIT_AUTHOR_EMAIL="$NewEmail"
    fi
"@

git filter-branch --env-filter $FilterScript -f -- --all

Write-Host ""
Write-Host "✅ Rewrite complete!"
Write-Host ""
Write-Host "Verifying new history:"
git log --all --pretty=format:"%h %an %s" --author="$NewName" | Select-Object -First 10
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Review the history: git log --all --oneline"
Write-Host "2. Force-push to all branches: git push --force --all"
Write-Host "3. Force-push tags: git push --force --tags"
Write-Host "4. (If needed) Restore from backup: git reset --hard $BackupBranch"
