import React from 'react';
import * as EN from './en';
import * as DE from './de';
import * as ES from './es';
import * as FR from './fr';
import * as IT from './it';
import * as RU from './ru';
import * as PL from './pl';
import * as PT from './pt';
import * as CN from './cn';
import * as d3 from 'd3';

let fallbackTerms = EN.terms;

/**
 * Get the units, translation and format functions for the specified language
 * @param  {string} langCode ISO Language code
 * @return {Object}          Language units, translation and format functions
 */
export function getLanguage(langCode) {
  let lang, translate;

  switch (langCode) {
    case 'de': lang = DE; break;
    case 'es': lang = ES; break;
    case 'fr': lang = FR; break;
    case 'it': lang = IT; break;
    case 'ru': lang = RU; break;
    case 'pl': lang = PL; break;
    case 'pt': lang = PT; break;
    case 'cn': lang = CN; break;
    default:
      lang = EN;
  }

  let currentTerms = lang.terms;
  let d3Locale = d3.formatLocale(lang.formats);
  let gen = d3Locale.format('');
  const round = function(x, n) { const ten_n = Math.pow(10,n); return Math.round(x * ten_n) / ten_n; };

  if(lang === EN) {
    translate = (t, x) => { return currentTerms[t + '_' + x] || currentTerms[t] || t; };
  } else {
    translate = (t, x) => { return currentTerms[t + '_' + x] || currentTerms[t] || fallbackTerms[t + '_' + x] || fallbackTerms[t] || t; };
  }

  return {
    formats: {
      gen,                              // General number format (.e.g 1,001,001.1234)
      int: d3Locale.format(',.0f'),     // Fixed to 0 decimal places (.e.g 1,001)
      f1: d3Locale.format(',.1f'),      // Fixed to 1 decimal place (.e.g 1,001.1)
      f2: d3Locale.format(',.2f'),      // Fixed to 2 decimal places (.e.g 1,001.10)
      s2: d3Locale.format('.2s'),       // SI Format to 2 decimal places (.e.g 1.1k)
      pct: d3Locale.format('.2%'),      // % to 2 decimal places (.e.g 5.40%)
      pct1: d3Locale.format('.1%'),     // % to 1 decimal places (.e.g 5.4%)
      r1: d3Locale.format('.1r'),       // Rounded to 1 significant number (.e.g 512 => 500, 4.122 => 4)
      r2: d3Locale.format('.2r'),       // Rounded to 2 significant numbers (.e.g 512 => 510, 4.122 => 4.1)
      rPct: d3Locale.format('.0%'),                   // % to 0 decimal places (.e.g 5%)
      round1: (d) => gen(round(d, 1)),  // Round to 0-1 decimal places (e.g. 5.1, 4)
      round: (d) => gen(round(d, 2)),      // Rounded to 0-2 decimal places (.e.g 5.12, 4.1)
      time: (d) => (d < 0 ? '-' : '') + Math.floor(Math.abs(d) / 60) + ':' + ('00' + Math.floor(Math.abs(d) % 60)).substr(-2, 2)
    },
    translate,
    units: {
      ang: '°',                         // Angle
      CR: <u>{translate('CR')}</u>,     // Credits
      kg: <u>{translate('kg')}</u>,     // Kilograms
      kgs: <u>{translate('kg/s')}</u>,  // Kilograms per second
      km: <u>{translate('km')}</u>,     // Kilometers
      Ls: <u>{translate('Ls')}</u>,     // Light Seconds
      LY: <u>{translate('LY')}</u>,     // Light Years
      m: <u>{translate('m')}</u>,      // Meters
      MJ: <u>{translate('MJ')}</u>,     // Mega Joules
      'm/s': <u>{translate('m/s')}</u>, // Meters per second
      '°/s': <u>{translate('°/s')}</u>, // Degrees per second
      MW: <u>{translate('MW')}</u>,     // Mega Watts (same as Mega Joules per second)
      mps: <u>{translate('m/s')}</u>,    // Metres per second
      pct: '%',                         // Percent
      ps: <u>{translate('/s')}</u>,           // per second
      pm: <u>{translate('/min')}</u>,         // per minute
      s: <u>{translate('secs')}</u>,         // Seconds
      T: <u>{translate('T')}</u>,       // Metric Tons
    }
  };
}

/**
 * The list of available languages
 * @type {Object}
 */
export const Languages = {
  en: 'English',
  de: 'Deutsch',
  it: 'Italiano',
  es: 'Español',
  fr: 'Français',
  ru: 'ру́сский',
  pl: 'polski',
  pt: 'português',
  cn: '中文'
};
