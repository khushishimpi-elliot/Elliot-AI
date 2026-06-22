# Elliot-AI Installation Script for Windows
# Downloads and installs the CLI, adds to PATH, and launches setup

param(
    [string]$Version = "latest",
    [string]$DownloadUrl = "https://github.com/khushishimpi-elliot/Elliot-AI/releases/download"
)

Write-Host "🚀 Installing Elliot-AI..." -ForegroundColor Green

# Ensure running as admin
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "⚠️  This script requires administrator privileges." -ForegroundColor Yellow
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

# Setup directories
$installDir = "C:\Program Files\elliot-ai"
$exePath = "$installDir\elliot-ai.exe"

# Create install directory
if (-NOT (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# Download latest release
Write-Host "`n📥 Downloading Elliot-AI CLI..." -ForegroundColor Cyan
$downloadUrl = "$DownloadUrl/$Version/elliot-ai-windows.exe"

try {
    (New-Object Net.ServicePointManager).SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $downloadUrl -OutFile $exePath -ErrorAction Stop
    Write-Host "✅ Downloaded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Download failed: $_" -ForegroundColor Red
    exit 1
}

# Add to PATH if not already there
Write-Host "`n🔧 Adding to PATH..." -ForegroundColor Cyan
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

if ($currentPath -notlike "*$installDir*") {
    $newPath = "$currentPath;$installDir"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    Write-Host "✅ Added to PATH" -ForegroundColor Green

    # Refresh PATH in current session
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
} else {
    Write-Host "✅ Already in PATH" -ForegroundColor Green
}

# Test installation
Write-Host "`n🧪 Testing installation..." -ForegroundColor Cyan
if (Test-Path $exePath) {
    Write-Host "✅ Installation verified" -ForegroundColor Green
} else {
    Write-Host "❌ Installation failed" -ForegroundColor Red
    exit 1
}

# Launch setup
Write-Host "`n🎉 Launching Elliot-AI setup..." -ForegroundColor Green
Write-Host "A browser window will open for configuration." -ForegroundColor Cyan

Start-Process -FilePath $exePath -ArgumentList "init"

Write-Host "`n✨ Installation complete!" -ForegroundColor Green
Write-Host "You can now use 'elliot-ai' from any PowerShell terminal." -ForegroundColor Cyan
Write-Host "Example: elliot-ai" -ForegroundColor Gray
