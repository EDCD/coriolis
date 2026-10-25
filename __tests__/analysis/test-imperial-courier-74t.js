/**
 * Test Imperial Courier at 74t with EPT 3A
 * User reports: Coriolis shows 595/805, should be 571/774
 */

const ept3a = {
  minmass: 70,
  optmass: 90,
  maxmass: 200,
  minmulspeed: 0.9,
  optmulspeed: 1.25,
  maxmulspeed: 1.6,
  minmul: 0.9,
  optmul: 1.15,
  maxmul: 1.367
};

// Imperial Courier base stats
const courierBaseSpeed = 282;
const courierBaseBoost = 382;
const courierMinThrust = 78.571;

function getMassCurveMultiplier(mass, minMass, optMass, maxMass, minMul, optMul, maxMul) {
  const xnorm = Math.min(1, (maxMass - mass) / (maxMass - minMass));
  const exponent = Math.log((optMul - minMul) / (maxMul - minMul)) / Math.log(Math.min(1, (maxMass - optMass) / (maxMass - minMass)));
  const ynorm = Math.pow(xnorm, exponent);
  return minMul + ynorm * (maxMul - minMul);
}

function calculateSpeed(mass, baseSpeed, thrusters, minthrust, pips) {
  const minMul = thrusters.minmulspeed;
  const optMul = thrusters.optmulspeed;
  const maxMul = thrusters.maxmulspeed;

  const curNavSpdMul = getMassCurveMultiplier(
    mass,
    thrusters.minmass,
    thrusters.optmass,
    thrusters.maxmass,
    minMul,
    optMul,
    maxMul
  );

  const minthrust_pct = minthrust / 100;
  const powerdistEngMul = pips / 4;

  return curNavSpdMul * baseSpeed * (powerdistEngMul + minthrust_pct * (1 - powerdistEngMul));
}

function calculateBoost(mass, baseBoost, thrusters) {
  const minMul = thrusters.minmulspeed;
  const optMul = thrusters.optmulspeed;
  const maxMul = thrusters.maxmulspeed;

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

console.log('Imperial Courier with EPT 3A at 74t');
console.log('=====================================\n');

const mass = 74;
const topSpeed = calculateSpeed(mass, courierBaseSpeed, ept3a, courierMinThrust, 4);
const boostSpeed = calculateBoost(mass, courierBaseBoost, ept3a);

// Calculate the mass curve multiplier to debug
const speedMul = getMassCurveMultiplier(
  mass,
  ept3a.minmass,
  ept3a.optmass,
  ept3a.maxmass,
  ept3a.minmulspeed,
  ept3a.optmulspeed,
  ept3a.maxmulspeed
);

console.log('Ship stats:');
console.log(`  Base speed: ${courierBaseSpeed} m/s`);
console.log(`  Base boost: ${courierBaseBoost} m/s`);
console.log(`  Min thrust: ${courierMinThrust}%`);
console.log('');

console.log('Thruster stats (EPT 3A):');
console.log(`  Min mass: ${ept3a.minmass}t, Opt mass: ${ept3a.optmass}t, Max mass: ${ept3a.maxmass}t`);
console.log(`  Speed muls: ${ept3a.minmulspeed} / ${ept3a.optmulspeed} / ${ept3a.maxmulspeed}`);
console.log('');

console.log(`Current mass: ${mass}t (${mass < ept3a.optmass ? 'below' : 'above'} optimal ${ept3a.optmass}t)`);
console.log(`Speed multiplier at ${mass}t: ${speedMul.toFixed(6)}`);
console.log('');

console.log('Calculated speeds:');
console.log(`  Top speed (4 pips):  ${topSpeed.toFixed(0)} m/s`);
console.log(`  Boost speed:         ${boostSpeed.toFixed(0)} m/s`);
console.log('');

console.log('Expected (EDSY):');
console.log(`  Top speed:  571 m/s`);
console.log(`  Boost:      774 m/s`);
console.log('');

console.log('Difference:');
console.log(`  Top speed:  ${(topSpeed - 571).toFixed(0)} m/s off`);
console.log(`  Boost:      ${(boostSpeed - 774).toFixed(0)} m/s off`);
console.log('');

// Let's also check what Coriolis is showing according to the user
console.log('User reports Coriolis shows:');
console.log(`  Top speed:  595 m/s`);
console.log(`  Boost:      805 m/s`);
console.log('');

console.log('My calculation vs Coriolis:');
console.log(`  Top speed:  ${(topSpeed - 595).toFixed(0)} m/s difference`);
console.log(`  Boost:      ${(boostSpeed - 805).toFixed(0)} m/s difference`);
