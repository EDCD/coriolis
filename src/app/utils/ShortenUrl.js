import request from 'superagent';

let agent;
try {
  agent = request.agent(); // apparently this crashes somehow
} catch (e) {
  console.error(e);
}
if (!agent) {
  agent = request;
}

/**
 * Shorten a URL
 * @param  {string} url        The URL to shorten
 * @param  {function} success   Success callback
 * @param  {function} error     Failure/Error callback
 */
export default function shorternUrl(url, success, error) {
  hollowShorten(url, success, error);
}

const SHORTEN_API_GOOGLE = 'https://www.googleapis.com/urlshortener/v1/url?key=';
/**
 * Shorten a URL using Google's URL shortener API
 * @param  {string} url        The URL to shorten
 * @param  {function} success   Success callback
 * @param  {function} error     Failure/Error callback
 */
function shortenUrlGoogle(url, success, error) {
  if (window.navigator.onLine) {
    try {
      request.post(SHORTEN_API_GOOGLE + window.CORIOLIS_GAPI_KEY)
        .send({ longUrl: url })
        .end(function(err, response) {
          if (err) {
            error(response.statusText == 'OK' ? 'Bad Request' : response.statusText);
          } else {
            success(response.body.id);
          }
        });
    } catch (e) {
      error(e.message ? e.message : e);
    }
  } else {
    error('Not Online');
  }
}

const SHORTEN_API_EDDP = 'https://eddp.co/u';
/**
 * Shorten a URL using EDDP's URL shortener API
 * @param  {string} url        The URL to shorten
 * @param  {function} success   Success callback
 * @param  {function} error     Failure/Error callback
 */
function shortenUrlEddp(url, success, error) {
  if (window.navigator.onLine) {
    try {
      request.post(SHORTEN_API_EDDP)
        .send(url)
        .end(function(err, response) {
          if (err) {
            error('Bad Request');
          } else {
            success(response.header['location']);
          }
        });
    } catch (e) {
      error(e.message ? e.message : e);
    }
  } else {
    error('Not Online');
  }
}

const SHORTEN_API_HOLLOW = 'https://sh.orbis.zone/shorten/';
/**
 * Shorten a URL using Hollow's URL shortener API
 * @param  {string} url        The URL to shorten
 * @param  {function} success   Success callback
 * @param  {function} error     Failure/Error callback
 */
function hollowShorten(url, success, error) {
  if (window.navigator.onLine) {
    try {
      request.post(SHORTEN_API_HOLLOW)
        .field('url', url)
        .end(function(err, response) {
          if (err) {
            console.error(err);
            error('Bad Request');
          } else {
            success(response.body.shorturl);
          }
        });
    } catch (e) {
      console.log(e);
      error(e.message ? e.message : e);
    }
  } else {
    error('Not Online');
  }
}

const SHORTEN_API_ORBIS = 'https://s.orbis.zone/api.php';
/**
 * Shorten a URL using Orbis's URL shortener API
 * @param  {string} url        The URL to shorten
 * @param  {function} success   Success callback
 * @param  {function} error     Failure/Error callback
 */
function orbisShorten(url, success, error) {
  if (window.navigator.onLine) {
    try {
      request.post(SHORTEN_API_ORBIS)
        .field('action', 'shorturl')
        .field('url', url)
        .field('format', 'json')
        .end(function(err, response) {
          if (err) {
            console.error(err);
            error('Bad Request');
          } else {
            success(response.body.shorturl);
          }
        });
    } catch (e) {
      console.log(e);
      error(e.message ? e.message : e);
    }
  } else {
    error('Not Online');
  }
}

const API_ORBIS = 'https://api.orbis.zone/ships';
/**
 * Upload to Orbis
 * @param  {object} ship        The URL to shorten
 * @param {object} creds Orbis credentials
 * @return {Promise<any>} Either a URL or error message.
 */
export function orbisUpload(ship, creds) {
  return new Promise(async(resolve, reject) => {
    if (window.navigator.onLine) {
      try {
        agent
          .post(API_ORBIS)
          .withCredentials()
          .redirects(0)
          .set('Content-Type', 'application/json')
          .send(ship)
          .end(function(err, response) {
            if (err) {
              reject('Bad Request');
            } else {
              resolve(response.body.link);
            }
          });
      } catch (e) {
        console.log(e);
        reject(e.message ? e.message : e);
      }
    } else {
      reject('Not Online');
    }
  });
}
