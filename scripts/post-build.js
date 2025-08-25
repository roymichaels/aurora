import fs from 'fs';

fs.mkdirSync('dist/public', { recursive: true });
fs.copyFileSync('public/tonconnect-manifest.json', 'dist/public/tonconnect-manifest.json');
