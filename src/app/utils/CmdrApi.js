/**
 * Client for fetching CMDR data from cmdr.coriolis.io.
 *
 * All endpoints require an API key sent via X-Api-Key header.
 * The host and key are stored per-CMDR link in Persist.
 */

/**
 * Make an authenticated GET request to the CMDR API
 * @param  {String} host    API host (e.g. 'https://cmdr.coriolis.io')
 * @param  {String} apiKey  API key
 * @param  {String} path    API path (e.g. '/api/ships/')
 * @return {Promise}        Resolves with parsed JSON
 */
function _fetch(host, apiKey, path) {
  return fetch(host + path, {
    method: 'GET',
    headers: {
      'X-Api-Key': apiKey,
    },
  }).then(resp => {
    if (!resp.ok) {
      throw new Error(`CMDR API ${resp.status}: ${resp.statusText}`);
    }
    return resp.json();
  });
}

/**
 * Make an authenticated request with a body to the CMDR API
 * @param  {String} host    API host
 * @param  {String} apiKey  API key
 * @param  {String} method  HTTP method (POST, PUT, DELETE)
 * @param  {String} path    API path
 * @param  {Object} body    Request body (will be JSON-stringified)
 * @return {Promise}        Resolves with parsed JSON
 */
function _send(host, apiKey, method, path, body) {
  return fetch(host + path, {
    method,
    headers: {
      'X-Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then(resp => {
    if (!resp.ok) {
      throw new Error(`CMDR API ${resp.status}: ${resp.statusText}`);
    }
    return resp.json();
  });
}

/**
 * Fetch the CMDR profile (name, credits, location, ranks)
 * @param  {Object} link  { host, apiKey }
 * @return {Promise<Object>}
 */
export function fetchProfile(link) {
  return _fetch(link.host, link.apiKey, '/api/profile/');
}

/**
 * Fetch all ships owned by the CMDR
 * @param  {Object} link  { host, apiKey }
 * @return {Promise<Object>}  { ships: [...] }
 */
export function fetchShips(link) {
  return _fetch(link.host, link.apiKey, '/api/ships/');
}

/**
 * Fetch the CMDR's material inventory
 * @param  {Object} link  { host, apiKey }
 * @return {Promise<Object>}  { materials: { raw: {}, manufactured: {}, encoded: {} } }
 */
export function fetchMaterials(link) {
  return _fetch(link.host, link.apiKey, '/api/materials/');
}

/**
 * Fetch the CMDR's stored modules
 * @param  {Object} link  { host, apiKey }
 * @return {Promise<Object>}  { modules: [...] }
 */
export function fetchModules(link) {
  return _fetch(link.host, link.apiKey, '/api/modules/');
}

/**
 * Fetch all saved builds
 * @param  {Object} link  { host, apiKey }
 * @return {Promise<Object>}  { builds: [...] }
 */
export function fetchBuilds(link) {
  return _fetch(link.host, link.apiKey, '/api/builds/');
}

/**
 * Save (create or update) a build
 * @param  {Object} link  { host, apiKey }
 * @param  {Object} buildData  { shipType, shipDisplayName, buildName, code, url, description }
 * @return {Promise<Object>}  { ok, created, id }
 */
export function saveBuild(link, buildData) {
  return _send(link.host, link.apiKey, 'POST', '/api/builds/', buildData);
}

/**
 * Update a build's description and/or linked ship
 * @param  {Object} link     { host, apiKey }
 * @param  {Number} buildId  Build primary key
 * @param  {Object} data     { description?, linkedShipId? }
 * @return {Promise<Object>}  { ok }
 */
export function updateBuild(link, buildId, data) {
  return _send(link.host, link.apiKey, 'PUT', `/api/builds/${buildId}/`, data);
}

/**
 * Unlink a ship from a build
 * @param  {Object} link     { host, apiKey }
 * @param  {Number} buildId  Build primary key
 * @return {Promise<Object>}  { ok }
 */
export function unlinkBuild(link, buildId) {
  return _send(link.host, link.apiKey, 'POST', `/api/builds/${buildId}/unlink/`);
}
