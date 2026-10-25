#!/usr/bin/env node
/**
 * generate-ship-slots.js
 *
 * Copies coriolis-data's authoritative ship slot index (ship-slots.json) into
 * src/ so CopyWebpackPlugin publishes it at  https://coriolis.io/ship-slots.json
 *
 * ship-slots.json maps each ship's Frontier internal name to the authoritative
 * ordered list of its hardpoint / internal / standard slots, each as
 * { class, name[, eligible] }. It is the single source of truth for v3 build
 * links and for migrating old-style links on ships that gained slots.
 *
 * Third-party tools (Inara, EDMarketConnector plugins, etc.) can fetch this URL
 * to stay in sync with the slot indexing Coriolis uses.
 *
 * Usage:  node generate-ship-slots.js
 *         (also called automatically by `npm run build` / `npm start`)
 */

const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'node_modules', 'coriolis-data', 'ships', 'ship-slots.json');
const outPath = path.join(__dirname, 'src', 'ship-slots.json');

if (!fs.existsSync(srcPath)) {
  console.error(`ERROR: ${srcPath} not found. Is coriolis-data installed?`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

fs.writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n');
const shipCount = Object.keys(data).filter((k) => k !== '_ShipSlots').length;
console.log(`Wrote ship-slots.json (${shipCount} ships) to ${outPath}`);
