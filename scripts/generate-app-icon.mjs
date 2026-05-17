#!/usr/bin/env node
// Regenerate Knyazeva Team brand PNG assets from inline SVG strings.
// Outputs to assets/brand/ — committed to repo (Expo bundler needs them at build time).
//
// Usage:
//   node scripts/generate-app-icon.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'assets/brand');

const SHADOW = 'rgba(0,0,0,0.34)';
const RIM = 'rgba(0,0,0,0.45)';

function bellSvg(color) {
  return `
    <rect x="5" y="28" width="24" height="40" rx="7" fill="${color}" />
    <rect x="5" y="28" width="24" height="40" rx="7" fill="${SHADOW}" />
    <rect x="2" y="33" width="24" height="40" rx="7" fill="${color}" />
    <line x1="22" y1="37" x2="22" y2="69" stroke="${RIM}" stroke-width="0.7" opacity="0.55" />
    <rect x="29" y="41" width="46" height="12" rx="6" fill="${color}" />
    <rect x="29" y="41" width="46" height="12" rx="6" fill="${SHADOW}" />
    <rect x="26" y="46" width="46" height="12" rx="6" fill="${color}" />
    <rect x="75" y="28" width="24" height="40" rx="7" fill="${color}" />
    <rect x="75" y="28" width="24" height="40" rx="7" fill="${SHADOW}" />
    <rect x="72" y="33" width="24" height="40" rx="7" fill="${color}" />
    <line x1="76" y1="37" x2="76" y2="69" stroke="${RIM}" stroke-width="0.7" opacity="0.55" />
  `;
}

function dumbbellSvg(color) {
  return `
    <g transform="rotate(-32 50 50)" opacity="0.55">${bellSvg(color)}</g>
    <g transform="rotate(32 50 50)">${bellSvg(color)}</g>
  `;
}

function iconLayers(idSuffix, rxPct) {
  const bgId = `bg-${idSuffix}`;
  const glowId = `glow-${idSuffix}`;
  const hlId = `hl-${idSuffix}`;
  const sqId = `sq-${idSuffix}`;
  return {
    defs: `
      <radialGradient id="${bgId}" cx="0.3" cy="0.2" r="0.8" fx="0.3" fy="0.2">
        <stop offset="0" stop-color="#1D1925" />
        <stop offset="1" stop-color="#0A0910" />
      </radialGradient>
      <radialGradient id="${glowId}" cx="0.7" cy="0.9" r="0.5" fx="0.7" fy="0.9">
        <stop offset="0" stop-color="#FF2D87" stop-opacity="0.4" />
        <stop offset="0.7" stop-color="#FF2D87" stop-opacity="0" />
        <stop offset="1" stop-color="#FF2D87" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="${hlId}" cx="0.2" cy="0.1" r="0.3" fx="0.2" fy="0.1">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.08" />
        <stop offset="0.7" stop-color="#FFFFFF" stop-opacity="0" />
        <stop offset="1" stop-color="#FFFFFF" stop-opacity="0" />
      </radialGradient>
      <clipPath id="${sqId}"><rect width="100" height="100" rx="${rxPct}" ry="${rxPct}" /></clipPath>
    `,
    body: `
      <g clip-path="url(#${sqId})">
        <rect width="100" height="100" fill="url(#${bgId})" />
        <rect width="100" height="100" fill="url(#${glowId})" />
        <rect width="100" height="100" fill="url(#${hlId})" />
        <g transform="translate(19, 19) scale(0.62)">
          ${dumbbellSvg('#FF2D87')}
        </g>
      </g>
    `,
  };
}

function iconSvg() {
  const { defs, body } = iconLayers('icon', 22);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 100 100">
    <defs>${defs}</defs>
    ${body}
  </svg>`;
}

function splashSvg() {
  const { defs, body } = iconLayers('splash', 22);
  // iPhone X+ portrait: 1242×2436. Icon 320×320 centred → translate (461, 1058), scale 3.2.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1242" height="2436" viewBox="0 0 1242 2436">
    <defs>
      <radialGradient id="splashBg" cx="0.5" cy="0.4" r="0.7" fx="0.5" fy="0.4">
        <stop offset="0" stop-color="#1D1925" />
        <stop offset="1" stop-color="#0A0910" />
      </radialGradient>
      ${defs}
    </defs>
    <rect width="1242" height="2436" fill="url(#splashBg)" />
    <g transform="translate(461, 1058) scale(3.2)">${body}</g>
  </svg>`;
}

function adaptiveIconSvg() {
  // Android adaptive icon foreground, transparent background, Material safe zone ~66%.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 100 100">
    <g transform="translate(19, 19) scale(0.62)">
      ${dumbbellSvg('#FF2D87')}
    </g>
  </svg>`;
}

function renderPng(svg, outPath, label) {
  const resvg = new Resvg(svg);
  const png = resvg.render().asPng();
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  // eslint-disable-next-line no-console
  console.log(`  ${label}  →  ${outPath.replace(ROOT + '/', '')}  (${(png.length / 1024).toFixed(1)} KB)`);
}

// eslint-disable-next-line no-console
console.log('Generating Knyazeva Team brand PNG assets...');
renderPng(iconSvg(), resolve(OUT_DIR, 'icon.png'), 'icon         1024×1024');
renderPng(splashSvg(), resolve(OUT_DIR, 'splash.png'), 'splash       1242×2436');
renderPng(adaptiveIconSvg(), resolve(OUT_DIR, 'adaptive-icon.png'), 'adaptive-fg  1024×1024');
// eslint-disable-next-line no-console
console.log('Done.');
