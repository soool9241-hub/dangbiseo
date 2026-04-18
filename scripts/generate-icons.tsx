// This script generates PWA icons as static files
// Run: npx tsx scripts/generate-icons.tsx

import { writeFileSync } from 'fs';
import { join } from 'path';

// Generate SVG icon
function generateSVG(size: number): string {
  const r = size * 0.22; // border radius
  const faceR = size * 0.28;
  const cx = size / 2;
  const cy = size * 0.42;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d9488"/>
      <stop offset="50%" stop-color="#14b8a6"/>
      <stop offset="100%" stop-color="#5eead4"/>
    </linearGradient>
    <linearGradient id="face" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#fff7ed"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
  <!-- Face -->
  <circle cx="${cx}" cy="${cy}" r="${faceR}" fill="url(#face)" stroke="rgba(255,255,255,0.8)" stroke-width="${size * 0.015}"/>
  <!-- Nurse cap -->
  <rect x="${cx - size * 0.1}" y="${cy - faceR - size * 0.06}" width="${size * 0.2}" height="${size * 0.12}" rx="${size * 0.02}" fill="white" stroke="#0d9488" stroke-width="${size * 0.01}"/>
  <text x="${cx}" y="${cy - faceR + size * 0.03}" text-anchor="middle" fill="#ef4444" font-size="${size * 0.09}" font-weight="bold">+</text>
  <!-- Eyes -->
  <ellipse cx="${cx - size * 0.07}" cy="${cy - size * 0.02}" rx="${size * 0.028}" ry="${size * 0.035}" fill="#1e293b"/>
  <ellipse cx="${cx + size * 0.07}" cy="${cy - size * 0.02}" rx="${size * 0.028}" ry="${size * 0.035}" fill="#1e293b"/>
  <!-- Eye sparkles -->
  <circle cx="${cx - size * 0.08}" cy="${cy - size * 0.04}" r="${size * 0.01}" fill="white"/>
  <circle cx="${cx + size * 0.06}" cy="${cy - size * 0.04}" r="${size * 0.01}" fill="white"/>
  <!-- Blush -->
  <ellipse cx="${cx - size * 0.1}" cy="${cy + size * 0.04}" rx="${size * 0.035}" ry="${size * 0.02}" fill="#fca5a5" opacity="0.5"/>
  <ellipse cx="${cx + size * 0.1}" cy="${cy + size * 0.04}" rx="${size * 0.035}" ry="${size * 0.02}" fill="#fca5a5" opacity="0.5"/>
  <!-- Smile -->
  <path d="M${cx - size * 0.04} ${cy + size * 0.05} Q${cx} ${cy + size * 0.1} ${cx + size * 0.04} ${cy + size * 0.05}" fill="#f97316"/>
  <!-- Text -->
  <text x="${cx}" y="${size * 0.85}" text-anchor="middle" fill="white" font-size="${size * 0.16}" font-weight="900" font-family="sans-serif">당비서</text>
</svg>`;
}

const publicDir = join(__dirname, '..', 'public');

// Write SVG icons
writeFileSync(join(publicDir, 'icon-192.svg'), generateSVG(192));
writeFileSync(join(publicDir, 'icon-512.svg'), generateSVG(512));

console.log('SVG icons generated! Convert to PNG using any tool or use the SVG directly.');
console.log('Files: public/icon-192.svg, public/icon-512.svg');
