# Run this script as Administrator
$ErrorActionPreference = "Stop"

# Define paths
$projectPath = $PSScriptRoot
$tempPath = "$env:LOCALAPPDATA\Temp\eas-cli-nodejs"
$username = $env:USERNAME

Write-Host "Cleaning up and setting permissions..." -ForegroundColor Yellow

# 1. Kill any processes that might be locking files
Get-Process | Where-Object {$_.Path -like "*\node.exe" -or $_.Path -like "*\npm*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Remove problematic directories
$dirsToRemove = @(
    "$projectPath\.expo",
    "$projectPath\.eas",
    "$projectPath\node_modules",
    "$projectPath\android",
    "$projectPath\ios",
    "$tempPath"
)

foreach ($dir in $dirsToRemove) {
    if (Test-Path $dir) {
        Write-Host "Removing $dir"
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 3. Create fresh directories
$dirsToCreate = @(
    "$projectPath\.expo",
    "$projectPath\.eas",
    "$tempPath"
)

foreach ($dir in $dirsToCreate) {
    if (-not (Test-Path $dir)) {
        Write-Host "Creating $dir"
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# 4. Set full permissions
$dirsToSetPermissions = @(
    $projectPath,
    "$projectPath\.expo",
    "$projectPath\.eas",
    "$env:LOCALAPPDATA\Temp",
    $tempPath
)

foreach ($dir in $dirsToSetPermissions) {
    Write-Host "Setting permissions for $dir"
    $acl = Get-Acl $dir
    $permission = "$env:USERDOMAIN\$username","FullControl","ContainerInherit,ObjectInherit","None","Allow"
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
    $acl.SetAccessRule($accessRule)
    Set-Acl $dir $acl
}

# 5. Clean npm cache
Write-Host "Cleaning npm cache"
npm cache clean --force

Write-Host "Done! All permissions have been set." -ForegroundColor Green
Write-Host "Now you can run: 'npm install' followed by 'eas build --platform android --profile preview'" -ForegroundColor Cyan
