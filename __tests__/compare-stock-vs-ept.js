/**
 * Compare stock 3A thrusters vs Enhanced Performance 3A thrusters
 */

// Stock 3A thruster from thrusters.json
const stock3a = {
  minmass: 60,
  optmass: 120,
  maxmass: 180,
  minmul: 0.96,
  optmul: 1,
  maxmul: 1.16
};

// EPT 3A data
const ept3a = {
  minmass: 70,
  optmass: 90,
  maxmass: 200,
  minmul: 0.9,
  optmul: 1.15,
  maxmul: 1.367,
  minmulspeed: 0.9,
  optmulspeed: 1.25,
  maxmulspeed: 1.6
};

// Eagle ship data
const eagleBaseSpeed = 240;
const eagleBaseBoost = 350;
const eagleMinThrust = 75.0;

function getMassCurveMultiplier(mass, minMass, optMass, maxMass, minMul, optMul, maxMul) {
  const xnorm = Math.min(1, (maxMass - mass) / (maxMass - minMass));
  const exponent = Math.log((optMul - minMul) / (maxMul - minMul)) / Math.log(Math.min(1, (maxMass - optMass) / (maxMass - minMass)));
  const ynorm = Math.pow(xnorm, exponent);
  return minMul + ynorm * (maxMul - minMul);
}

function calculateSpeed(mass, baseSpeed, thrusters, minthrust, useSpeedMul = true) {
  const minMul = (useSpeedMul && thrusters.minmulspeed) ? thrusters.minmulspeed : thrusters.minmul;
  const optMul = (useSpeedMul && thrusters.optmulspeed) ? thrusters.optmulspeed : thrusters.optmul;
  const maxMul = (useSpeedMul && thrusters.maxmulspeed) ? thrusters.maxmulspeed : thrusters.maxmul;

  const curNavSpdMul = getMassCurveMultiplier(
    mass,
    thrusters.minmass,
    thrusters.optmass,
    thrusters.maxmass,
    minMul,
    optMul,
    maxMul
  );

  const minthrust_pct = (minthrust || 0) / 100;
  const powerdistEngMul = 1; // 4 pips = 1.0

  return curNavSpdMul * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
}

function calculateBoost(mass, baseBoost, thrusters, useSpeedMul = true) {
  const minMul = (useSpeedMul && thrusters.minmulspeed) ? thrusters.minmulspeed : thrusters.minmul;
  const optMul = (useSpeedMul && thrusters.optmulspeed) ? thrusters.optmulspeed : thrusters.optmul;
  const maxMul = (useSpeedMul && thrusters.maxmulspeed) ? thrusters.maxmulspeed : thrusters.maxmul;

  const curNavSpdMul = getMassCurveMultiplier(
    mass,
    thrusters.minmass,
    thrusters.optmass,
    thrusters.maxmass,
    minMul,
    optMul,
    maxMul
  );

  return curNavSpdMul * baseBoost;
}

// Test data from your table
const testCases = [
  { mass: 65,  expectedEPTSpeed: 384, expectedEPTBoost: 560, expectedIncrease: 42 },
  { mass: 68,  expectedEPTSpeed: 372, expectedEPTBoost: 543, expectedIncrease: 39 },
  { mass: 76,  expectedEPTSpeed: 338, expectedEPTBoost: 493, expectedIncrease: 29 },
  { mass: 90,  expectedEPTSpeed: 289, expectedEPTBoost: 422, expectedIncrease: 14 },
  { mass: 98,  expectedEPTSpeed: 268, expectedEPTBoost: 391, expectedIncrease: 8 },
  { mass: 126, expectedEPTSpeed: 229, expectedEPTBoost: 333, expectedIncrease: -3.5 }
];

console.log('Stock 3A Thrusters vs Enhanced Performance 3A Thrusters');
console.log('========================================================\n');
console.log('Stock 3A stats: min=' + stock3a.minmass + 't, opt=' + stock3a.optmass + 't, max=' + stock3a.maxmass + 't');
console.log('EPT 3A stats:   min=' + ept3a.minmass + 't, opt=' + ept3a.optmass + 't, max=' + ept3a.maxmass + 't\n');

testCases.forEach(({ mass, expectedEPTSpeed, expectedEPTBoost, expectedIncrease }) => {
  const stockSpeed = calculateSpeed(mass, eagleBaseSpeed, stock3a, eagleMinThrust, false);
  const stockBoost = calculateBoost(mass, eagleBaseBoost, stock3a, false);

  const eptSpeed = calculateSpeed(mass, eagleBaseSpeed, ept3a, eagleMinThrust, true);
  const eptBoost = calculateBoost(mass, eagleBaseBoost, ept3a, true);

  const actualIncrease = ((eptSpeed / stockSpeed - 1) * 100);

  console.log(`Mass: ${mass}t`);
  console.log(`  Stock 3A:  ${stockSpeed.toFixed(0)} m/s top, ${stockBoost.toFixed(0)} m/s boost`);
  console.log(`  EPT 3A:    ${eptSpeed.toFixed(0)} m/s top, ${eptBoost.toFixed(0)} m/s boost`);
  console.log(`  Expected:  ${expectedEPTSpeed} m/s top, ${expectedEPTBoost} m/s boost`);
  console.log(`  Increase:  ${actualIncrease.toFixed(1)}% (expected: ${expectedIncrease}%)`);
  console.log('');
});
