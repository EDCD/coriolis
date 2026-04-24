/**
 * BuildSync utility — syncs local Coriolis builds to cmdr.coriolis.io.
 *
 * Provides two entry points:
 *   syncAllBuilds(link)                          – push every local build
 *   syncSingleBuild(link, shipId, buildName, code) – push one build
 *
 * Both are fire-and-forget; errors are logged to the console but never
 * surface to the user.
 */

import { Ships } from 'coriolis-data/dist';
import Persist from '../stores/Persist';
import { saveBuild } from './CmdrApi';
import { outfitURL } from './UrlGenerators';

/**
 * Push a single build to cmdr.coriolis.io.
 *
 * @param {Object} link      { host, apiKey }
 * @param {String} shipId    Coriolis ship key (e.g. 'fer_de_lance')
 * @param {String} buildName User-facing build name
 * @param {String} code      Serialised ship code string
 */
export function syncSingleBuild(link, shipId, buildName, code) {
  if (!link || !shipId || !buildName || !code) return;

  const shipData = Ships[shipId];
  const displayName = shipData ? shipData.properties.name : shipId;
  const url = window.location.origin + outfitURL(shipId, code, buildName);

  saveBuild(link, {
    shipType: shipId,
    shipDisplayName: displayName,
    buildName,
    code,
    url,
  }).then(() => {
    console.log('[BuildSync] synced', displayName, '–', buildName);
  }).catch(err => {
    console.warn('[BuildSync] failed to sync', displayName, '–', buildName, err);
  });
}

/**
 * Push every locally-stored build to cmdr.coriolis.io.
 * Requests are sent in parallel; failures are logged individually.
 *
 * @param {Object} link  { host, apiKey }
 */
export function syncAllBuilds(link) {
  if (!link) return;

  const builds = Persist.getBuilds(); // { shipId: { buildName: code, ... }, ... }
  if (!builds) return;

  const shipIds = Object.keys(builds);
  let count = 0;

  for (const shipId of shipIds) {
    const shipBuilds = builds[shipId];
    if (!shipBuilds) continue;
    for (const buildName of Object.keys(shipBuilds)) {
      const code = shipBuilds[buildName];
      if (!code) continue;
      syncSingleBuild(link, shipId, buildName, code);
      count++;
    }
  }

  console.log('[BuildSync] queued', count, 'build(s) for sync');
}
