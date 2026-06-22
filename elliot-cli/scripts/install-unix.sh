#!/bin/bash

# Elliot-AI Installation Script for macOS and Linux
# Downloads and installs the CLI, adds to PATH, and launches setup

set -e

VERSION="${1:-latest}"
GITHUB_REPO="khushishimpi-elliot/Elliot-AI"
RELEASES_URL="https://github.com/$GITHUB_REPO/releases/download"

echo "🚀 Installing Elliot-AI..."

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    INSTALL_DIR="/usr/local/bin"
    BINARY_NAME="elliot-ai-macos"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    INSTALL_DIR="/usr/local/bin"
    BINARY_NAME="elliot-ai-linux"
else
    echo "❌ Unsupported operating system: $OSTYPE"
    exit 1
fi

echo "Detected: $OS"

# Check for write permissions
if [ ! -w "$INSTALL_DIR" ]; then
    echo "⚠️  Need sudo access to install to $INSTALL_DIR"
    echo "Re-running with sudo..."
    sudo bash "$0" "$VERSION"
    exit $?
fi

# Download latest release
echo ""
echo "📥 Downloading Elliot-AI CLI..."
DOWNLOAD_URL="$RELEASES_URL/$VERSION/$BINARY_NAME"
TEMP_FILE="/tmp/$BINARY_NAME"

if ! curl -fsSL "$DOWNLOAD_URL" -o "$TEMP_FILE" 2>/dev/null; then
    echo "❌ Download failed"
    echo "Trying alternative download method..."

    # Fallback: try without version tag
    DOWNLOAD_URL="$RELEASES_URL/v1.0.0/$BINARY_NAME"
    if ! curl -fsSL "$DOWNLOAD_URL" -o "$TEMP_FILE" 2>/dev/null; then
        echo "❌ Could not download Elliot-AI"
        exit 1
    fi
fi

echo "✅ Downloaded successfully"

# Install binary
echo ""
echo "🔧 Installing to $INSTALL_DIR..."
chmod +x "$TEMP_FILE"
cp "$TEMP_FILE" "$INSTALL_DIR/elliot-ai"
rm "$TEMP_FILE"

echo "✅ Installed to $INSTALL_DIR/elliot-ai"

# Test installation
echo ""
echo "🧪 Testing installation..."
if command -v elliot-ai &> /dev/null; then
    echo "✅ Installation verified"
else
    echo "⚠️  elliot-ai not in PATH yet"
    echo "Try restarting your terminal or running: export PATH=$INSTALL_DIR:\$PATH"
fi

# Launch setup
echo ""
echo "🎉 Launching Elliot-AI setup..."
echo "A browser window will open for configuration."
echo ""

elliot-ai init

echo ""
echo "✨ Installation complete!"
echo "You can now use 'elliot-ai' from any terminal."
echo "Example: elliot-ai"
