import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_PATH = join(__dirname, 'dist');

// Check if dist folder exists
if (!fs.existsSync(DIST_PATH)) {
  console.error(`ERROR: dist folder not found at ${DIST_PATH}`);
  process.exit(1);
}

console.log(`✓ Starting from: ${__dirname}`);
console.log(`✓ Serving static files from: ${DIST_PATH}`);
console.log(`✓ Files in dist: ${fs.readdirSync(DIST_PATH).join(', ')}`);

// Serve static files from dist
app.use(express.static(DIST_PATH));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', dir: __dirname });
});

// SPA fallback: serve index.html for all non-file routes
app.get('*', (req, res) => {
  const indexPath = join(DIST_PATH, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error(`ERROR: index.html not found at ${indexPath}`);
    res.status(404).send('index.html not found');
    return;
  }
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`✓ Elliot-AI Terminal running on port ${PORT}`);
});
