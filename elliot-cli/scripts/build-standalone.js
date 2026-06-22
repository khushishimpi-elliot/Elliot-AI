#!/usr/bin/env node

/**
 * Build standalone executables for all platforms
 * Uses esbuild + node bundling to create platform-specific binaries
 *
 * Outputs:
 * - dist/elliot-ai-windows.exe
 * - dist/elliot-ai-macos
 * - dist/elliot-ai-linux
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '../dist-standalone');

// Create dist directory
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

console.log('🔨 Building standalone executables...\n');

// Build for each platform
const platforms = [
  {
    name: 'windows',
    target: 'win-x64',
    output: path.join(DIST_DIR, 'elliot-ai.exe'),
  },
  {
    name: 'macos',
    target: 'macos-x64',
    output: path.join(DIST_DIR, 'elliot-ai-macos'),
  },
  {
    name: 'linux',
    target: 'linux-x64',
    output: path.join(DIST_DIR, 'elliot-ai-linux'),
  },
];

try {
  // First, build TypeScript
  console.log('📦 Compiling TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });

  // Build for each platform
  for (const platform of platforms) {
    console.log(`\n🏗️  Building for ${platform.name}...`);
    const cmd = `npx pkg dist/index.js --targets node18-${platform.target} --output ${platform.output}`;
    execSync(cmd, { stdio: 'inherit' });
    console.log(`✅ Built: ${platform.output}`);
  }

  console.log('\n✨ All platforms built successfully!\n');
  console.log('Executables:');
  console.log(`  Windows: ${path.join(DIST_DIR, 'elliot-ai.exe')}`);
  console.log(`  macOS:   ${path.join(DIST_DIR, 'elliot-ai-macos')}`);
  console.log(`  Linux:   ${path.join(DIST_DIR, 'elliot-ai-linux')}`);
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}
