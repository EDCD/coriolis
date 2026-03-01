/**
 * Test the actual Coriolis Module class with EPT modifications
 * to see what values are being calculated
 */

// Since we can't easily import the Module class in Node, let's simulate
// the _getMassWithRelatedModifier function to verify the fix

function getModValue_simulation(mods, name) {
  // Simulate what getModValue does
  return mods && mods[name] ? mods[name] : null;
}

function _getMassWithRelatedModifier_OLD(baseMass, name, mods) {
  let result = baseMass;
  if (result == null || isNaN(result)) {
    return null;
  }

  // Check for a direct modifier on this mass property
  let mod = getModValue_simulation(mods, name);
  if (mod == null || isNaN(mod)) {
    // No direct modifier; inherit from optmass (related modifier)
    mod = getModValue_simulation(mods, 'optmass');
  }
  // BUG: if (mod) will be false if mod is 0!
  if (mod) {
    result = result * (1 + mod / 10000);
  }

  return result;
}

function _getMassWithRelatedModifier_NEW(baseMass, name, mods) {
  let result = baseMass;
  if (result == null || isNaN(result)) {
    return null;
  }

  // Check for a direct modifier on this mass property
  let mod = getModValue_simulation(mods, name);
  if (mod == null || isNaN(mod)) {
    // No direct modifier; inherit from optmass (related modifier)
    mod = getModValue_simulation(mods, 'optmass');
  }
  // FIX: Check if mod is not null instead of truthy
  if (mod != null && !isNaN(mod)) {
    result = result * (1 + mod / 10000);
  }

  return result;
}

// EPT 3A base values
const eptBase = {
  minmass: 70,
  optmass: 90,
  maxmass: 200
};

// From your JSON export
const mods = {
  optmass: -1250,  // -12.5% from Dirty G5
  // Note: Drive Distributors adds +1000 (10%) via special effect
  // Total should be: -1250 + 1000 = -250 (-2.5%)
  // But let's test with just the blueprint mods first
};

console.log('Testing _getMassWithRelatedModifier function');
console.log('==============================================\n');

console.log('Base masses:', eptBase);
console.log('Modifications:', mods);
console.log('');

console.log('OLD VERSION (with bug):');
const oldMinMass = _getMassWithRelatedModifier_OLD(eptBase.minmass, 'minmass', mods);
const oldOptMass = _getMassWithRelatedModifier_OLD(eptBase.optmass, 'optmass', mods);
const oldMaxMass = _getMassWithRelatedModifier_OLD(eptBase.maxmass, 'maxmass', mods);
console.log(`  minmass: ${oldMinMass}`);
console.log(`  optmass: ${oldOptMass}`);
console.log(`  maxmass: ${oldMaxMass}`);
console.log('');

console.log('NEW VERSION (with fix):');
const newMinMass = _getMassWithRelatedModifier_NEW(eptBase.minmass, 'minmass', mods);
const newOptMass = _getMassWithRelatedModifier_NEW(eptBase.optmass, 'optmass', mods);
const newMaxMass = _getMassWithRelatedModifier_NEW(eptBase.maxmass, 'maxmass', mods);
console.log(`  minmass: ${newMinMass}`);
console.log(`  optmass: ${newOptMass}`);
console.log(`  maxmass: ${newMaxMass}`);
console.log('');

console.log('Expected (with Dirty G5 -12.5% + Drive Dist +10% = -2.5% total):');
const expectedMinMass = eptBase.minmass * (1 - 0.025);
const expectedOptMass = eptBase.optmass * (1 - 0.025);
const expectedMaxMass = eptBase.maxmass * (1 - 0.025);
console.log(`  minmass: ${expectedMinMass.toFixed(2)}`);
console.log(`  optmass: ${expectedOptMass.toFixed(2)}`);
console.log(`  maxmass: ${expectedMaxMass.toFixed(2)}`);
console.log('');

console.log('Does the fix work?', newMinMass === newOptMass && newMaxMass === newOptMass ? 'NO - still broken!' : 'PARTIALLY');
