#!/usr/bin/env node
/**
 * generate-ship-mappings.js
 *
 * Produces src/ship-mappings.json — a public mapping from Frontier's
 * internal ship names (as they appear in journal / CAPI data) to
 * human-readable display names sourced from coriolis-data.
 *
 * The file is copied into the build output by webpack's CopyWebpackPlugin
 * and served at  https://coriolis.io/ship-mappings.json
 *
 * Third-party tools (Coriolis CMDR, EDMC plugins, etc.) can fetch this
 * URL to stay in sync whenever new ships are added to the game.
 *
 * Usage:  node generate-ship-mappings.js
 *         (also called automatically by `npm run build`)
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// 1. Parse the FDev → Coriolis key mapping from CompanionApiUtils.js
//    (It's an ES module export, so we extract it with a regex rather than
//    requiring it directly.)
// ---------------------------------------------------------------------------
const apiUtilsPath = path.join(__dirname, 'src', 'app', 'utils', 'CompanionApiUtils.js');
const apiUtilsSrc = fs.readFileSync(apiUtilsPath, 'utf8');

const mapMatch = apiUtilsSrc.match(
  /SHIP_FD_NAME_TO_CORIOLIS_NAME\s*=\s*\{([\s\S]*?)\};/
);
if (!mapMatch) {
  console.error('ERROR: Could not find SHIP_FD_NAME_TO_CORIOLIS_NAME in CompanionApiUtils.js');
  process.exit(1);
}

const fdToCoriolisKey = {};
const lineRe = /['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g;
let m;
while ((m = lineRe.exec(mapMatch[1])) !== null) {
  fdToCoriolisKey[m[1]] = m[2];
}

console.log(`Parsed ${Object.keys(fdToCoriolisKey).length} FDev→Coriolis key mappings`);

// ---------------------------------------------------------------------------
// 2. Load friendly names from coriolis-data ship JSONs
// ---------------------------------------------------------------------------
const shipsDir = path.join(__dirname, 'node_modules', 'coriolis-data', 'ships');
const coriolisKeyToProps = {};

for (const file of fs.readdirSync(shipsDir).filter(f => f.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(shipsDir, file), 'utf8'));
  for (const [key, val] of Object.entries(data)) {
    if (val && val.properties && val.properties.name) {
      coriolisKeyToProps[key] = {
        name: val.properties.name,
        manufacturer: val.properties.manufacturer || '',
        shipClass: val.properties.class || null,
      };
    }
  }
}

console.log(`Found ${Object.keys(coriolisKeyToProps).length} ships in coriolis-data`);

// ---------------------------------------------------------------------------
// 3. Build the final mapping:  fdName (lower-cased) → ship info
// ---------------------------------------------------------------------------
const mappings = {};

for (const [fdName, coriolisKey] of Object.entries(fdToCoriolisKey)) {
  const props = coriolisKeyToProps[coriolisKey];
  if (!props) {
    console.warn(`  WARNING: no coriolis-data entry for "${coriolisKey}" (FDev: "${fdName}")`);
    continue;
  }

  mappings[fdName.toLowerCase()] = {
    name: props.name,
    manufacturer: props.manufacturer,
    shipClass: props.shipClass,
    coriolisId: coriolisKey,
  };
}

// ---------------------------------------------------------------------------
// 4. Write to src/ so CopyWebpackPlugin picks it up during build
// ---------------------------------------------------------------------------
const outPath = path.join(__dirname, 'src', 'ship-mappings.json');
const output = {
  description:
    'Mapping from Frontier Developments internal ship names to human-readable names. ' +
    'Auto-generated from coriolis-data. Do not edit by hand.',
  generated: new Date().toISOString(),
  ships: mappings,
};

fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');
console.log(`Wrote ${Object.keys(mappings).length} ship mappings to ${outPath}`);
