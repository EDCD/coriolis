/**
 * Helper script to regenerate agility test fixture values.
 *
 * Run from the coriolis root:
 *   npx babel-node __tests__/generate-agility-data.js
 *
 * OR add to package.json scripts:
 *   "generate-fixtures": "babel-node __tests__/generate-agility-data.js"
 *
 * Then copy the output JSON into __tests__/fixtures/agility-data.json
 */
import Ship from '../src/app/shipyard/Ship';
import { Ships } from 'coriolis-data/dist';
import * as ModuleUtils from '../src/app/shipyard/ModuleUtils';

// The current fixture data defines which ships/thrusters to test
const currentFixtures = require('./fixtures/agility-data.json');

const newFixtures = {};

for (let shipId in currentFixtures) {
  newFixtures[shipId] = {};
  for (let thrusterId in currentFixtures[shipId]) {
    let shipData = Ships[shipId];
    let ship = new Ship(shipId, shipData.properties, shipData.slots);
    ship.buildWith(shipData.defaults);
    // Turn off internals to ensure boost is available (matching boost test)
    for (let internal in ship.internal) {
      ship.internal[internal].enabled = 0;
    }
    ship.use(ship.standard[1], ModuleUtils.findModule('t', thrusterId));

    newFixtures[shipId][thrusterId] = {
      speed: Math.round(ship.topSpeed),
      boost: Math.round(ship.topBoost),
      pitch: Math.round(ship.pitches[4] * 100) / 100,
      roll: Math.round(ship.rolls[4] * 100) / 100,
      yaw: Math.round(ship.yaws[4] * 100) / 100,
    };
  }
}

console.log(JSON.stringify(newFixtures, null, 2));
