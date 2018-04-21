import React from 'react';
import { Modifications } from 'coriolis-data/dist';

/**
 * Generate a tooltip with details of a blueprint's effects
 * @param   {Object}  translate   The translate object
 * @param   {Object}  blueprint   The blueprint at the required grade
 * @param   {Array}   engineers   The engineers supplying this blueprint
 * @param   {string}  grp         The group of the module
 * @param   {Object}  m           The module to compare with
 * @returns {Object}              The react components
 */
export function blueprintTooltip(translate, blueprint, engineers, grp, m) {
  const effects = [];
  if (!blueprint || !blueprint.features) {
    return undefined;
  }
  for (const feature in blueprint.features) {
    const featureIsBeneficial = isBeneficial(feature, blueprint.features[feature]);
    const featureDef = Modifications.modifications[feature];
    if (!featureDef.hidden) {
      let symbol = '';
      if (feature === 'jitter') {
        symbol = '°';
      } else if (featureDef.type === 'percentage') {
        symbol = '%';
      }
      let lowerBound = blueprint.features[feature][0];
      let upperBound = blueprint.features[feature][1];
      if (featureDef.type === 'percentage') {
        lowerBound = Math.round(lowerBound * 1000) / 10;
        upperBound = Math.round(upperBound * 1000) / 10;
      }
      const lowerIsBeneficial  = isValueBeneficial(feature, lowerBound);
      const upperIsBeneficial  = isValueBeneficial(feature, upperBound);
      if (m) {
        // We have a module - add in the current value
        let current = m.getModValue(feature);
        if (featureDef.type === 'percentage' || featureDef.name === 'burst' || featureDef.name === 'burstrof') {
          current = Math.round(current / 10) / 10;
        } else if (featureDef.type === 'numeric') {
          current /= 100;
        }
        const currentIsBeneficial  = isValueBeneficial(feature, current);
        effects.push(
          <tr key={feature}>
            <td style={{ textAlign: 'left' }}>{translate(feature, grp)}</td>
            <td className={lowerBound === 0 ? '' : lowerIsBeneficial ? 'secondary' : 'warning'} style={{ textAlign: 'right' }}>{lowerBound}{symbol}</td>
            <td className={current === 0 ? '' : currentIsBeneficial ? 'secondary' : 'warning'} style={{ textAlign: 'right' }}>{current}{symbol}</td>
            <td className={upperBound === 0 ? '' : upperIsBeneficial ? 'secondary' : 'warning'} style={{ textAlign: 'right' }}>{upperBound}{symbol}</td>
          </tr>
        );
      } else {
        // We do not have a module, no value
        effects.push(
          <tr key={feature}>
            <td style={{ textAlign: 'left' }}>{translate(feature, grp)}</td>
            <td className={lowerBound === 0 ? '' : lowerIsBeneficial ? 'secondary' : 'warning'} style={{ textAlign: 'right' }}>{lowerBound}{symbol}</td>
            <td className={upperBound === 0 ? '' : upperIsBeneficial ? 'secondary' : 'warning'} style={{ textAlign: 'right' }}>{upperBound}{symbol}</td>
          </tr>
        );
      }
    }
  }
  if (m) {
    // Because we have a module add in any benefits that aren't part of the primary blueprint
    for (const feature in m.mods) {
      if (!blueprint.features[feature]) {
        const featureDef = Modifications.modifications[feature];
        if (featureDef && !featureDef.hidden) {
          let symbol = '';
          if (feature === 'jitter') {
            symbol = '°';
          } else if (featureDef.type === 'percentage') {
            symbol = '%';
          }
          let current = m.getModValue(feature);
          if (featureDef.type === 'percentage' || featureDef.name === 'burst' || featureDef.name === 'burstrof') {
            current = Math.round(current / 10) / 10;
          } else if (featureDef.type === 'numeric') {
            current /= 100;
          }
          const currentIsBeneficial  = isValueBeneficial(feature, current);
          effects.push(
            <tr key={feature}>
              <td style={{ textAlign: 'left' }}>{translate(feature, grp)}</td>
              <td>&nbsp;</td>
              <td className={current === 0 ? '' : currentIsBeneficial ? 'secondary' : 'warning'} style={{ textAlign: 'right' }}>{current}{symbol}</td>
              <td>&nbsp;</td>
            </tr>
          );
        }
      }
    }

    // We also add in any benefits from specials that aren't covered above
    if (m.blueprint && m.blueprint.special) {
      for (const feature in Modifications.modifierActions[m.blueprint.special.edname]) {
        if (!blueprint.features[feature] && !m.mods.feature) {
          const featureDef = Modifications.modifications[feature];
          if (featureDef && !featureDef.hidden) {
            let symbol = '';
            if (feature === 'jitter') {
              symbol = '°';
            } else if (featureDef.type === 'percentage') {
              symbol = '%';
            }
            let current = m.getModValue(feature);
            if (featureDef.type === 'percentage' || featureDef.name === 'burst' || featureDef.name === 'burstrof') {
              current = Math.round(current / 10) / 10;
            } else if (featureDef.type === 'numeric') {
              current /= 100;
            }
            const currentIsBeneficial  = isValueBeneficial(feature, current);
            effects.push(
              <tr key={feature}>
                <td style={{ textAlign: 'left' }}>{translate(feature, grp)}</td>
                <td>&nbsp;</td>
                <td className={current === 0 ? '' : currentIsBeneficial ? 'secondary' : 'warning'} style={{ textAlign: 'right' }}>{current}{symbol}</td>
                <td>&nbsp;</td>
              </tr>
            );
          }
        }
      }
    }
  }

  let components;
  if (!m) {
    components = [];
    for (const component in blueprint.components) {
      components.push(
        <tr key={component}>
          <td style={{ textAlign: 'left' }}>{translate(component)}</td>
          <td style={{ textAlign: 'right' }}>{blueprint.components[component]}</td>
        </tr>
      );
    }
  }

  let engineersList;
  if (engineers) {
    engineersList = [];
    for (const engineer of engineers) {
      engineersList.push(
        <tr key={engineer}>
          <td style={{ textAlign: 'left' }}>{engineer}</td>
        </tr>
      );
    }
  }

  return (
    <div>
      <table width='100%'>
        <thead>
         <tr>
           <td>{translate('feature')}</td>
           <td>{translate('worst')}</td>
            {m ? <td>{translate('current')}</td> : null }
           <td>{translate('best')}</td>
         </tr>
        </thead>
        <tbody>
          {effects}
        </tbody>
      </table>
      { components ?  <table width='100%'>
        <thead>
         <tr>
           <td>{translate('component')}</td>
           <td>{translate('amount')}</td>
         </tr>
        </thead>
        <tbody>
          {components}
        </tbody>
      </table> : null }
      { engineersList ? <table width='100%'>
        <thead>
         <tr>
           <td>{translate('engineers')}</td>
         </tr>
        </thead>
        <tbody>
          {engineersList}
        </tbody>
      </table>  : null }
    </div>
  );
}

/**
 * Is this blueprint feature beneficial?
 * @param   {string}  feature    The name of the feature
 * @param   {array}   values     The value of the feature
 * @returns {boolean}            True if this feature is beneficial
 */
export function isBeneficial(feature, values) {
  const fact = (values[0] < 0 || (values[0] === 0 && values[1] < 0));
  if (Modifications.modifications[feature].higherbetter) {
    return !fact;
  } else {
    return fact;
  }
}

/**
 * Is this feature value beneficial?
 * @param   {string}  feature    The name of the feature
 * @param   {number}  value      The value of the feature
 * @returns {boolean}            True if this value is beneficial
 */
export function isValueBeneficial(feature, value) {
  if (Modifications.modifications[feature].higherbetter) {
    return value > 0;
  } else {
    return value < 0;
  }
}

/**
 * Get a blueprint with a given name and an optional module
 * @param   {string} name    The name of the blueprint
 * @param   {Object} module  The module for which to obtain this blueprint
 * @returns {Object}         The matching blueprint
 */
export function getBlueprint(name, module) {
  // Start with a copy of the blueprint
  const findMod = val => Object.keys(Modifications.blueprints).find(elem => elem.toString().toLowerCase().search(val.toString().toLowerCase().replace(/(OutfittingFieldType_|persecond)/igm, '')) >= 0)
  const found = Modifications.blueprints[findMod(name)];
  if (!found || !found.fdname) {
    return {};
  }
  const blueprint = JSON.parse(JSON.stringify(found));
  if (module) {
    if (module.grp === 'sb') {
      // Shield boosters are treated internally as straight modifiers, so rather than (for example)
      // being a 4% boost they are a 104% multiplier.  We need to fix the values here so that they look
      // accurate as per the information in Elite
      for (const grade in blueprint.grades) {
        for (const feature in blueprint.grades[grade].features) {
          if (feature === 'shieldboost') {
            blueprint.grades[grade].features[feature][0] = ((1 + blueprint.grades[grade].features[feature][0]) * (1 + module.shieldboost) - 1) / module.shieldboost - 1;
            blueprint.grades[grade].features[feature][1] = ((1 + blueprint.grades[grade].features[feature][1]) * (1 + module.shieldboost) - 1) / module.shieldboost - 1;
          }
        }
      }
    }
  }
  return blueprint;
}

/**
 * Provide 'worst' primary modifications
 * @param {Object}      ship      The ship for which to perform the modifications
 * @param {Object}      m         The module for which to perform the modifications
 * @param {Number} percent The percent to set values to of full.
 */
export function setPercent(ship, m, percent) {
  ship.clearModifications(m);
  const features = m.blueprint.grades[m.blueprint.grade].features;
  for (const featureName in features) {
    const value = features[featureName][0];
    const featureIsBeneficial = isBeneficial(featureName, features[featureName]);
    if (featureIsBeneficial === true) {
      _setValue(ship, m, featureName, (percent / 100) * value);
    } else {
      _setValue(ship, m, featureName, value);
    }
  }
}

/**
 * Provide 'random' primary modifications
 * @param {Object}      ship      The ship for which to perform the modifications
 * @param {Object}      m         The module for which to perform the modifications
 */
export function setRandom(ship, m) {
  ship.clearModifications(m);
  // Pick a single value for our randomness
  const mult = Math.random();
  const features = m.blueprint.grades[m.blueprint.grade].features;
  for (const featureName in features) {
    let value;
    if (Modifications.modifications[featureName].higherbetter) {
      // Higher is better, but is this making it better or worse?
      if (features[featureName][0] < 0 || (features[featureName][0] === 0 && features[featureName][1] < 0)) {
        value = features[featureName][1] + ((features[featureName][0] - features[featureName][1]) * mult);
      } else {
        value = features[featureName][0] + ((features[featureName][1] - features[featureName][0]) * mult);
      }
    } else {
      // Higher is worse, but is this making it better or worse?
      if (features[featureName][0] < 0 || (features[featureName][0] === 0 && features[featureName][1] < 0)) {
        value = features[featureName][0] + ((features[featureName][1] - features[featureName][0]) * mult);
      } else {
        value = features[featureName][1] + ((features[featureName][0] - features[featureName][1]) * mult);
      }
    }

    _setValue(ship, m, featureName, value);
  }
}

/**
 * Set a modification feature value
 * @param {Object}      ship          The ship for which to perform the modifications
 * @param {Object}      m             The module for which to perform the modifications
 * @param {string}      featureName   The feature being set
 * @param {number}      value         The value being set for the feature
 */
function _setValue(ship, m, featureName, value) {
  if (Modifications.modifications[featureName].type == 'percentage') {
    ship.setModification(m, featureName, value * 10000);
  } else if (Modifications.modifications[featureName].type == 'numeric') {
    ship.setModification(m, featureName, value * 100);
  } else {
    ship.setModification(m, featureName, value);
  }
}
