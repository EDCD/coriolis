import Module from './Module';

/**
 * Calculate the maximum single jump range based on mass and a specific FSD
 *
 * @param  {number} mass Mass of a ship: laden, unlanden, partially laden, etc
 * @param  {object} fsd  The FDS object/component with maxfuel, fuelmul, fuelpower, optmass
 * @param  {number} fuel Optional - The fuel consumed during the jump
 * @return {number}      Distance in Light Years
 * @param {object} ship Ship instance
 */
export function jumpRange(mass, fsd, fuel, ship) {
  const fsdMaxFuelPerJump = fsd instanceof Module ? fsd.getMaxFuelPerJump() : fsd.maxfuel;
  const fsdOptimalMass = fsd instanceof Module ? fsd.getOptMass() : fsd.optmass;
  let jumpAddition = 0;
  if (ship) {
    mass += ship.reserveFuelCapacity || 0;
    for (const module of ship.internal) {
      if (module && module.m && module.m.grp === 'gfsb' && ship.getSlotStatus(module) == 3) {
        jumpAddition += module.m.getJumpBoost();
      }
    }
  }
  return (Math.pow(Math.min(fuel === undefined ? fsdMaxFuelPerJump : fuel, fsdMaxFuelPerJump) / fsd.fuelmul, 1 / fsd.fuelpower) * fsdOptimalMass / mass) + jumpAddition;
}

/**
 * Calculate the total jump range based on mass and a specific FSD, and all fuel available
 *
 * @param  {number} mass Mass of a ship: laden, unlanden, partially laden, etc
 * @param  {object} fsd  The FDS object/component with maxfuel, fuelmul, fuelpower, optmass
 * @param  {number} fuel The total fuel available
 * @return {number}      Distance in Light Years
 * @param {object} ship Ship instance
 */
export function totalJumpRange(mass, fsd, fuel, ship) {
  const fsdMaxFuelPerJump = fsd instanceof Module ? fsd.getMaxFuelPerJump() : fsd.maxfuel;
  const fsdOptimalMass = fsd instanceof Module ? fsd.getOptMass() : fsd.optmass;

  let fuelRemaining = fuel;
  let totalRange = 0;
  while (fuelRemaining > 0) {
    const fuelForThisJump = Math.min(fuelRemaining, fsdMaxFuelPerJump);
    totalRange += this.jumpRange(mass, fsd, fuelForThisJump, ship);
    // Mass is reduced
    mass -= fuelForThisJump;
    fuelRemaining -= fuelForThisJump;
  }
  return totalRange;
};

/**
 * Calculate the a ships shield strength based on mass, shield generator and shield boosters used.
 *
 * @param  {number} mass        Current mass of the ship
 * @param  {number} baseShield  Base Shield strength MJ for ship
 * @param  {object} sg          The shield generator used
 * @param  {number} multiplier  Shield multiplier for ship (1 + shield boosters if any)
 * @return {number} Approximate shield strengh in MJ
 */
export function shieldStrength(mass, baseShield, sg, multiplier) {
  // sg might be a module or a template; handle either here
  let minMass = sg instanceof Module ? sg.getMinMass() : sg.minmass;
  let optMass = sg instanceof Module ? sg.getOptMass() : sg.optmass;
  let maxMass = sg instanceof Module ? sg.getMaxMass() : sg.maxmass;
  let minMul = sg instanceof Module ? sg.getMinMul() : sg.minmul;
  let optMul = sg instanceof Module ? sg.getOptMul() : sg.optmul;
  let maxMul = sg instanceof Module ? sg.getMaxMul() : sg.maxmul;
  let xnorm = Math.min(1, (maxMass - mass) / (maxMass - minMass));
  let exponent = Math.log((optMul - minMul) / (maxMul - minMul)) / Math.log(Math.min(1, (maxMass - optMass) / (maxMass - minMass)));
  let ynorm = Math.pow(xnorm, exponent);
  let mul = minMul + ynorm * (maxMul - minMul);

  return (baseShield * mul * multiplier);
}

/**
 * Calculate the a ships speed based on mass, and thrusters.
 *
 * @param {number}   mass       the mass of the ship
 * @param {number}   baseSpeed  base speed m/s for ship
 * @param {object}   thrusters  The ship's thrusters
 * @param {number}   engpip     the multiplier per pip to engines
 * @return {array}             Speed by pips
 */
export function speed(mass, baseSpeed, thrusters, engpip) {
  // thrusters might be a module or a template; handle either here
  const minMass = thrusters instanceof Module ? thrusters.getMinMass() : thrusters.minmass;
  const optMass = thrusters instanceof Module ? thrusters.getOptMass() : thrusters.optmass;
  const maxMass = thrusters instanceof Module ? thrusters.getMaxMass() : thrusters.maxmass;
  const minMul = thrusters instanceof Module ? thrusters.getMinMul('speed') : (thrusters.minmulspeed ? thrusters.minmulspeed : thrusters.minmul);
  const optMul = thrusters instanceof Module ? thrusters.getOptMul('speed') : (thrusters.optmulspeed ? thrusters.minmulspeed : thrusters.minmul);
  const maxMul = thrusters instanceof Module ? thrusters.getMaxMul('speed') : (thrusters.maxmulspeed ? thrusters.minmulspeed : thrusters.minmul);

  let results = normValues(minMass, optMass, maxMass, minMul, optMul, maxMul, mass, baseSpeed, engpip);

  return results;
}

/**
 * Calculate pip multiplier for speed.
 * @param {number} baseSpeed The base speed of ship in data
 * @param {number} topSpeed The top speed of ship in data
 * @return {number} The multiplier that pips affect speed.
 */
export function calcPipSpeed(baseSpeed, topSpeed) {
  return (topSpeed - baseSpeed) / (4 * topSpeed);
}

/**
 * Calculate pitch of a ship based on mass and thrusters
 * @param {number}   mass       the mass of the ship
 * @param {number}   basePitch  base pitch of the ship
 * @param {object}   thrusters  the ship's thrusters
 * @param {number}   engpip     the multiplier per pip to engines
 * @return {array}             Pitch by pips
 */
export function pitch(mass, basePitch, thrusters, engpip) {
  // thrusters might be a module or a template; handle either here
  let minMass = thrusters instanceof Module ? thrusters.getMinMass() : thrusters.minmass;
  let optMass = thrusters instanceof Module ? thrusters.getOptMass() : thrusters.optmass;
  let maxMass = thrusters instanceof Module ? thrusters.getMaxMass() : thrusters.maxmass;
  let minMul = thrusters instanceof Module ? thrusters.getMinMul('rotation') : (thrusters.minmulrotation ? thrusters.minmulrotation : thrusters.minmul);
  let optMul = thrusters instanceof Module ? thrusters.getOptMul('rotation') : (thrusters.optmulrotation ? thrusters.optmulrotation : thrusters.optmul);
  let maxMul = thrusters instanceof Module ? thrusters.getMaxMul('rotation') : (thrusters.maxmulrotation ? thrusters.maxmulrotation : thrusters.maxmul);

  return normValues(minMass, optMass, maxMass, minMul, optMul, maxMul, mass, basePitch, engpip);
}

/**
 * Calculate yaw of a ship based on mass and thrusters
 * @param {number}   mass       the mass of the ship
 * @param {number}   baseYaw    base yaw of the ship
 * @param {object}   thrusters  the ship's thrusters
 * @param {number}   engpip     the multiplier per pip to engines
 * @return {array}             Yaw by pips
 */
export function yaw(mass, baseYaw, thrusters, engpip) {
  // thrusters might be a module or a template; handle either here
  let minMass = thrusters instanceof Module ? thrusters.getMinMass() : thrusters.minmass;
  let optMass = thrusters instanceof Module ? thrusters.getOptMass() : thrusters.optmass;
  let maxMass = thrusters instanceof Module ? thrusters.getMaxMass() : thrusters.maxmass;
  let minMul = thrusters instanceof Module ? thrusters.getMinMul('rotation') : (thrusters.minmulrotation ? thrusters.minmulrotation : thrusters.minmul);
  let optMul = thrusters instanceof Module ? thrusters.getOptMul('rotation') : (thrusters.optmulrotation ? thrusters.optmulrotation : thrusters.optmul);
  let maxMul = thrusters instanceof Module ? thrusters.getMaxMul('rotation') : (thrusters.maxmulrotation ? thrusters.maxmulrotation : thrusters.maxmul);

  return normValues(minMass, optMass, maxMass, minMul, optMul, maxMul, mass, baseYaw, engpip);
}

/**
 * Calculate roll of a ship based on mass and thrusters
 * @param {number}   mass       the mass of the ship
 * @param {number}   baseRoll   base roll of the ship
 * @param {object}   thrusters  the ship's thrusters
 * @param {number}   engpip     the multiplier per pip to engines
 * @return {array}             Roll by pips
 */
export function roll(mass, baseRoll, thrusters, engpip) {
  // thrusters might be a module or a template; handle either here
  let minMass = thrusters instanceof Module ? thrusters.getMinMass() : thrusters.minmass;
  let optMass = thrusters instanceof Module ? thrusters.getOptMass() : thrusters.optmass;
  let maxMass = thrusters instanceof Module ? thrusters.getMaxMass() : thrusters.maxmass;
  let minMul = thrusters instanceof Module ? thrusters.getMinMul('rotation') : (thrusters.minmulrotation ? thrusters.minmulrotation : thrusters.minmul);
  let optMul = thrusters instanceof Module ? thrusters.getOptMul('rotation') : (thrusters.optmulrotation ? thrusters.optmulrotation : thrusters.optmul);
  let maxMul = thrusters instanceof Module ? thrusters.getMaxMul('rotation') : (thrusters.maxmulrotation ? thrusters.maxmulrotation : thrusters.maxmul);

  return normValues(minMass, optMass, maxMass, minMul, optMul, maxMul, mass, baseRoll, engpip);
}

/**
 * Normalise according to FD's calculations and return suitable values
 * @param {number}   minMass  the minimum mass of the thrusters
 * @param {number}   optMass  the optimum mass of the thrusters
 * @param {number}   maxMass  the maximum mass of the thrusters
 * @param {number}   minMul   the minimum multiplier of the thrusters
 * @param {number}   optMul   the optimum multiplier of the thrusters
 * @param {number}   maxMul   the maximum multiplier of the thrusters
 * @param {number}   mass     the mass of the ship
 * @param {base}     base     the base value from which to calculate
 * @param {number}   engpip   the multiplier per pip to engines
 * @return {array}            values by pips
 */
function normValues(minMass, optMass, maxMass, minMul, optMul, maxMul, mass, base, engpip) {
  const xnorm = Math.min(1, (maxMass - mass) / (maxMass - minMass));
  const exponent = Math.log((optMul - minMul) / (maxMul - minMul)) / Math.log(Math.min(1, (maxMass - optMass) / (maxMass - minMass)));
  const ynorm = Math.pow(xnorm, exponent);
  const mul = minMul + ynorm * (maxMul - minMul);
  const res = base * mul;

  return [res * (1 - (engpip * 4)),
    res * (1 - (engpip * 3)),
    res * (1 - (engpip * 2)),
    res * (1 - (engpip * 1)),
    res];
}

/**
 * Calculate a single value
 * @param {number}   minMass  the minimum mass of the thrusters
 * @param {number}   optMass  the optimum mass of the thrusters
 * @param {number}   maxMass  the maximum mass of the thrusters
 * @param {number}   minMul   the minimum multiplier of the thrusters
 * @param {number}   optMul   the optimum multiplier of the thrusters
 * @param {number}   maxMul   the maximum multiplier of the thrusters
 * @param {number}   mass     the mass of the ship
 * @param {base}     base     the base value from which to calculate
 * @param {number}   engpip   the multiplier per pip to engines
 * @param {number}   eng      the pips to engines
 * @returns {number}           the resultant value
 */
function calcValue(minMass, optMass, maxMass, minMul, optMul, maxMul, mass, base, engpip, eng) {
  const xnorm = Math.min(1, (maxMass - mass) / (maxMass - minMass));
  const exponent = Math.log((optMul - minMul) / (maxMul - minMul)) / Math.log(Math.min(1, (maxMass - optMass) / (maxMass - minMass)));
  const ynorm = Math.pow(xnorm, exponent);
  const mul = minMul + ynorm * (maxMul - minMul);
  const res = base * mul;

  return res * (1 - (engpip * (4 - eng)));
}

/**
 * Calculate speed for a given setup
 * @param {number}   mass         the mass of the ship
 * @param {number}   baseSpeed    the base speed of the ship
 * @param {object}   thrusters    the thrusters of the ship
 * @param {number}   engpip       the multiplier per pip to engines
 * @param {number}   eng          the pips to engines
 * @param {number}   boostFactor  the boost factor for ths ship
 * @param {boolean}  boost        true if the boost is activated
 * @returns {number}              the resultant speed
 */
export function calcSpeed(mass, baseSpeed, thrusters, engpip, eng, boostFactor, boost) {
  // thrusters might be a module or a template; handle either here
  const minMass = thrusters instanceof Module ? thrusters.getMinMass() : thrusters.minmass;
  const optMass = thrusters instanceof Module ? thrusters.getOptMass() : thrusters.optmass;
  const maxMass = thrusters instanceof Module ? thrusters.getMaxMass() : thrusters.maxmass;
  const minMul = thrusters instanceof Module ? thrusters.getMinMul('speed') : (thrusters.minmulspeed ? thrusters.minmulspeed : thrusters.minmul);
  const optMul = thrusters instanceof Module ? thrusters.getOptMul('speed') : (thrusters.optmulspeed ? thrusters.minmulspeed : thrusters.minmul);
  const maxMul = thrusters instanceof Module ? thrusters.getMaxMul('speed') : (thrusters.maxmulspeed ? thrusters.minmulspeed : thrusters.minmul);

  let result = calcValue(minMass, optMass, maxMass, minMul, optMul, maxMul, mass, baseSpeed, engpip, eng);
  if (boost == true) {
    result *= boostFactor;
  }

  return result;
}

/**
 * Calculate pitch for a given setup
 * @param {number}   mass         the mass of the ship
 * @param {number}   basePitch    the base pitch of the ship
 * @param {object}   thrusters    the thrusters of the ship
 * @param {number}   engpip       the multiplier per pip to engines
 * @param {number}   eng          the pips to engines
 * @param {number}   boostFactor  the boost factor for ths ship
 * @param {boolean}  boost        true if the boost is activated
 * @returns {number}              the resultant pitch
 */
export function calcPitch(mass, basePitch, thrusters, engpip, eng, boostFactor, boost) {
  // thrusters might be a module or a template; handle either here
  let minMass = thrusters instanceof Module ? thrusters.getMinMass() : thrusters.minmass;
  let optMass = thrusters instanceof Module ? thrusters.getOptMass() : thrusters.optmass;
  let maxMass = thrusters instanceof Module ? thrusters.getMaxMass() : thrusters.maxmass;
  let minMul = thrusters instanceof Module ? thrusters.getMinMul('rotation') : (thrusters.minmulrotation ? thrusters.minmulrotation : thrusters.minmul);
  let optMul = thrusters instanceof Module ? thrusters.getOptMul('rotation') : (thrusters.optmulrotation ? thrusters.optmulrotation : thrusters.optmul);
  let maxMul = thrusters instanceof Module ? thrusters.getMaxMul('rotation') : (thrusters.maxmulrotation ? thrusters.maxmulrotation : thrusters.maxmul);

  let result = calcValue(minMass, optMass, maxMass, minMul, optMul, maxMul, mass, basePitch, engpip, eng);
  if (boost == true) {
    result *= boostFactor;
  }

  return result;
}

/**
 * Calculate roll for a given setup
 * @param {number}   mass         the mass of the ship
 * @param {number}   baseRoll     the base roll of the ship
 * @param {ojbect}   thrusters    the thrusters of the ship
 * @param {number}   engpip       the multiplier per pip to engines
 * @param {number}   eng          the pips to engines
 * @param {number}   boostFactor  the boost factor for ths ship
 * @param {boolean}  boost        true if the boost is activated
 * @returns {number}              the resultant roll
 */
export function calcRoll(mass, baseRoll, thrusters, engpip, eng, boostFactor, boost) {
  // thrusters might be a module or a template; handle either here
  let minMass = thrusters instanceof Module ? thrusters.getMinMass() : thrusters.minmass;
  let optMass = thrusters instanceof Module ? thrusters.getOptMass() : thrusters.optmass;
  let maxMass = thrusters instanceof Module ? thrusters.getMaxMass() : thrusters.maxmass;
  let minMul = thrusters instanceof Module ? thrusters.getMinMul('rotation') : (thrusters.minmulrotation ? thrusters.minmulrotation : thrusters.minmul);
  let optMul = thrusters instanceof Module ? thrusters.getOptMul('rotation') : (thrusters.optmulrotation ? thrusters.optmulrotation : thrusters.optmul);
  let maxMul = thrusters instanceof Module ? thrusters.getMaxMul('rotation') : (thrusters.maxmulrotation ? thrusters.maxmulrotation : thrusters.maxmul);

  let result = calcValue(minMass, optMass, maxMass, minMul, optMul, maxMul, mass, baseRoll, engpip, eng);
  if (boost == true) {
    result *= boostFactor;
  }

  return result;
}

/**
 * Calculate yaw for a given setup
 * @param {number}   mass         the mass of the ship
 * @param {number}   baseYaw      the base yaw of the ship
 * @param {ojbect}   thrusters    the thrusters of the ship
 * @param {number}   engpip       the multiplier per pip to engines
 * @param {number}   eng          the pips to engines
 * @param {number}   boostFactor  the boost factor for ths ship
 * @param {boolean}  boost        true if the boost is activated
 * @returns {number}              the resultant yaw
 */
export function calcYaw(mass, baseYaw, thrusters, engpip, eng, boostFactor, boost) {
  // thrusters might be a module or a template; handle either here
  let minMass = thrusters instanceof Module ? thrusters.getMinMass() : thrusters.minmass;
  let optMass = thrusters instanceof Module ? thrusters.getOptMass() : thrusters.optmass;
  let maxMass = thrusters instanceof Module ? thrusters.getMaxMass() : thrusters.maxmass;
  let minMul = thrusters instanceof Module ? thrusters.getMinMul('rotation') : (thrusters.minmulrotation ? thrusters.minmulrotation : thrusters.minmul);
  let optMul = thrusters instanceof Module ? thrusters.getOptMul('rotation') : (thrusters.optmulrotation ? thrusters.optmulrotation : thrusters.optmul);
  let maxMul = thrusters instanceof Module ? thrusters.getMaxMul('rotation') : (thrusters.maxmulrotation ? thrusters.maxmulrotation : thrusters.maxmul);

  let result = calcValue(minMass, optMass, maxMass, minMul, optMul, maxMul, mass, baseYaw, engpip, eng);
  if (boost == true) {
    result *= boostFactor;
  }

  return result;
}

/**
 * Calculate shield metrics
 * @param   {Object}  ship            The ship
 * @param   {int}     sys             The pips to SYS
 * @returns {Object}                  Shield metrics
 */
export function shieldMetrics(ship, sys) {
  const sysResistance = this.sysResistance(sys);
  const maxSysResistance = this.sysResistance(4);

  let shield = {};

  const shieldGeneratorSlot = ship.findInternalByGroup('sg');
  if (shieldGeneratorSlot && shieldGeneratorSlot.enabled && shieldGeneratorSlot.m) {
    const shieldGenerator = shieldGeneratorSlot.m;
    // Boosters
    let boost = 1;
    let boosterExplDmg = 1;
    let boosterKinDmg = 1;
    let boosterThermDmg = 1;
    for (let slot of ship.hardpoints) {
      if (slot.enabled && slot.m && slot.m.grp == 'sb') {
        boost += slot.m.getShieldBoost();
        boosterExplDmg = boosterExplDmg * (1 - slot.m.getExplosiveResistance());
        boosterKinDmg = boosterKinDmg * (1 - slot.m.getKineticResistance());
        boosterThermDmg = boosterThermDmg * (1 - slot.m.getThermalResistance());
      }
    }
    // Calculate diminishing returns for boosters
    // Diminishing returns not currently in-game
    // boost = Math.min(boost, (1 - Math.pow(Math.E, -0.7 * boost)) * 2.5);

    // Remove base shield generator strength
    boost -= 1;

    let shieldAddition = 0;
    if (ship) {
      for (const module of ship.internal) {
        if (module && module.m && module.m.grp === 'gsrp' && module.enabled) {
          shieldAddition += module.m.getShieldAddition();
        }
      }
    }
    let generatorStrength = this.shieldStrength(ship.hullMass, ship.baseShieldStrength, shieldGenerator, 1);
    const boostersStrength = generatorStrength * boost;

    // Recover time is the time taken to go from 0 to 50%.  It includes a 16-second wait before shields start to recover
    const shieldToRecover = (generatorStrength + boostersStrength + shieldAddition) / 2;
    const powerDistributor = ship.standard[4].m;
    const sysRechargeRate = this.sysRechargeRate(powerDistributor, sys);

    // Our initial regeneration comes from the SYS capacitor store, which is replenished as it goes
    // 0.6 is a magic number from FD: each 0.6 MW of energy from the power distributor recharges 1 MJ/s of regeneration
    let capacitorDrain = (shieldGenerator.getBrokenRegenerationRate() * 0.6) - sysRechargeRate;
    let capacitorLifetime = powerDistributor.getSystemsCapacity() / capacitorDrain;

    let recover = 16;
    if (capacitorDrain <= 0 || shieldToRecover < capacitorLifetime * shieldGenerator.getBrokenRegenerationRate()) {
      // We can recover the entire shield from the capacitor store
      recover += shieldToRecover / shieldGenerator.getBrokenRegenerationRate();
    } else {
      // We can recover some of the shield from the capacitor store
      recover += capacitorLifetime;
      const remainingShieldToRecover = shieldToRecover - capacitorLifetime * shieldGenerator.getBrokenRegenerationRate();
      if (sys === 0) {
        // No system pips so will never recover shields
        recover = Math.Infinity;
      } else {
        // Recover remaining shields at the rate of the power distributor's recharge
        recover += remainingShieldToRecover / (sysRechargeRate / 0.6);
      }
    }

    // Recharge time is the time taken to go from 50% to 100%
    const shieldToRecharge = (generatorStrength + boostersStrength + shieldAddition) / 2;

    // Our initial regeneration comes from the SYS capacitor store, which is replenished as it goes
    // 0.6 is a magic number from FD: each 0.6 MW of energy from the power distributor recharges 1 MJ/s of regeneration
    capacitorDrain = (shieldGenerator.getRegenerationRate() * 0.6) - sysRechargeRate;
    capacitorLifetime = powerDistributor.getSystemsCapacity() / capacitorDrain;

    let recharge = 0;
    if (capacitorDrain <= 0 || shieldToRecharge < capacitorLifetime * shieldGenerator.getRegenerationRate()) {
      // We can recharge the entire shield from the capacitor store
      recharge += shieldToRecharge / shieldGenerator.getRegenerationRate();
    } else {
      // We can recharge some of the shield from the capacitor store
      recharge += capacitorLifetime;
      const remainingShieldToRecharge = shieldToRecharge - capacitorLifetime * shieldGenerator.getRegenerationRate();
      if (sys === 0) {
        // No system pips so will never recharge shields
        recharge = Math.Inf;
      } else {
        // Recharge remaining shields at the rate of the power distributor's recharge
        recharge += remainingShieldToRecharge / (sysRechargeRate / 0.6);
      }
    }

    shield = {
      generator: generatorStrength,
      boosters: boostersStrength,
      addition: shieldAddition,
      cells: ship.shieldCells,
      summary: generatorStrength + boostersStrength + shieldAddition,
      total: generatorStrength + boostersStrength + ship.shieldCells + shieldAddition,
      recover,
      recharge,
    };

    // Shield resistances have three components: the shield generator, the shield boosters and the SYS pips.
    // We re-cast these as damage percentages
    shield.absolute = {
      generator: 1,
      boosters: 1,
      sys: 1 - sysResistance,
      total: 1 - sysResistance,
      max: 1 - maxSysResistance
    };

    /**
     * An object that stores a selection of difference damage multipliers that
     * deal with a ship's shield strength.
     * @typedef {Object} ShieldDamageMults
     * @property {number} generator Base damage multiplier of the shield
     * contributing it's base resistance.
     * @property {number} boosters Damage multiplier contributed by all
     * boosters, i.e. `rawMj / (generator * boosters)` equals shield strength
     * with 0 pips to sys.
     * @property {number} sys Damage multiplier contributed by pips to sys.
     * @property {number} base Damage multiplier with 0 pips to sys; just
     * boosters and shield generator. Equals `generator * boosters`.
     * @property {number} total Damage multiplier with current pip settings.
     * @property {number} max Damage multiplier with 4 pips to sys.
     */

    let sgExplosiveDmg = 1 - shieldGenerator.getExplosiveResistance();
    let sgSbExplosiveDmg = diminishingReturnsShields(sgExplosiveDmg, sgExplosiveDmg * boosterExplDmg);
    /** @type {ShieldDamageMults} */
    shield.explosive = {
      generator: sgExplosiveDmg,
      boosters: sgSbExplosiveDmg / sgExplosiveDmg,
      sys: (1 - sysResistance),
      base: sgSbExplosiveDmg,
      total: sgSbExplosiveDmg * (1 - sysResistance),
      max: sgSbExplosiveDmg * (1 - maxSysResistance),
    };

    let sgKineticDmg = 1 - shieldGenerator.getKineticResistance();
    let sgSbKineticDmg = diminishingReturnsShields(sgKineticDmg, sgKineticDmg * boosterKinDmg);
    /** @type {ShieldDamageMults} */
    shield.kinetic = {
      generator: sgKineticDmg,
      boosters: sgSbKineticDmg / sgKineticDmg,
      sys: (1 - sysResistance),
      base: sgSbKineticDmg,
      total: sgSbKineticDmg * (1 - sysResistance),
      max: sgSbKineticDmg * (1 - maxSysResistance),
    };

    let sgThermalDmg = 1 - shieldGenerator.getThermalResistance();
    let sgSbThermalDmg = diminishingReturnsShields(sgThermalDmg , sgThermalDmg * boosterThermDmg);
    /** @type {ShieldDamageMults} */
    shield.thermal = {
      generator: sgThermalDmg,
      boosters: sgSbThermalDmg / sgThermalDmg,
      sys: (1 - sysResistance),
      base: sgSbThermalDmg,
      total: sgSbThermalDmg * (1 - sysResistance),
      max: sgSbThermalDmg * (1 - maxSysResistance),
    };
  }
  return shield;
}

/**
 * Calculate time from one boost to another
 * @return {number} Boost frequency in seconds
 * @param {Ship} ship Ship object
 */
export function calcBoost(ship) {
  if (!ship.boostEnergy || !ship.standard[4] || !ship.standard[4].m) {
    return undefined;
  }
  return ship.boostEnergy / ship.standard[4].m.getEnginesRechargeRate();
}


/**
 * Calculate armour metrics
 * @param   {Object}  ship            The ship
 * @returns {Object}                  Armour metrics
 */
export function armourMetrics(ship) {
  // Armour from bulkheads
  const armourBulkheads = ship.baseArmour + (ship.baseArmour * ship.bulkheads.m.getHullBoost());
  let armourReinforcement = 0;

  let moduleArmour = 0;
  let moduleProtection = 1;
  const bulkheads = ship.bulkheads.m;
  let hullExplDmgs = [];
  let hullKinDmgs = [];
  let hullThermDmgs = [];
  let hullCausDmgs = [];
  // Armour from HRPs and module armour from MRPs
  for (let slot of ship.internal) {
    if (slot.m && slot.enabled && (slot.m.grp === 'hr' || slot.m.grp === 'ghrp' || slot.m.grp == 'mahr')) {
      armourReinforcement += slot.m.getHullReinforcement();
      // Hull boost for HRPs is applied against the ship's base armour
      armourReinforcement += ship.baseArmour * slot.m.getModValue('hullboost') / 10000;
      hullExplDmgs.push(1 - slot.m.getExplosiveResistance());
      hullKinDmgs.push(1 - slot.m.getKineticResistance());
      hullThermDmgs.push(1 - slot.m.getThermalResistance());
      hullCausDmgs.push(1 - slot.m.getCausticResistance());
    }
    if (slot.m && slot.enabled && (slot.m.grp == 'mrp' || slot.m.grp == 'gmrp')) {
      moduleArmour += slot.m.getIntegrity();
      moduleProtection = moduleProtection * (1 - slot.m.getProtection());
    }
  }
  moduleProtection = 1 - moduleProtection;

  const armour = {
    bulkheads: armourBulkheads,
    reinforcement: armourReinforcement,
    modulearmour: moduleArmour,
    moduleprotection: moduleProtection,
    total: armourBulkheads + armourReinforcement
  };

  // Armour resistances have two components: bulkheads and HRPs
  // We re-cast these as damage percentages
  armour.absolute = {
    bulkheads: 1,
    reinforcement: 1,
    total: 1
  };

  let armourExplDmg = 1 - ship.bulkheads.m.getExplosiveResistance();
  let armourReinforcedExplDmg = diminishingReturnsArmour(armourExplDmg, ...hullExplDmgs);
  armour.explosive = {
    bulkheads: armourExplDmg,
    reinforcement: armourReinforcedExplDmg / armourExplDmg,
    total: armourReinforcedExplDmg,
    res: 1 - armourReinforcedExplDmg
  };

  let armourKinDmg = 1 - ship.bulkheads.m.getKineticResistance();
  let armourReinforcedKinDmg = diminishingReturnsArmour(armourKinDmg, ...hullKinDmgs);
  armour.kinetic = {
    bulkheads: armourKinDmg,
    reinforcement: armourReinforcedKinDmg / armourKinDmg,
    total: armourReinforcedKinDmg,
    res: 1 - armourReinforcedKinDmg
  };

  let armourThermDmg = 1 - ship.bulkheads.m.getThermalResistance();
  let armourReinforcedThermDmg = diminishingReturnsArmour(armourThermDmg, ...hullThermDmgs);
  armour.thermal = {
    bulkheads: armourThermDmg,
    reinforcement: armourReinforcedThermDmg / armourThermDmg,
    total: armourReinforcedThermDmg,
    res: 1 - armourReinforcedThermDmg
  };

  let armourCausDmg = 1 - ship.bulkheads.m.getCausticResistance();
  let armourReinforcedCausDmg = diminishingReturnsArmour(armourCausDmg, ...hullCausDmgs);
  armour.caustic = {
    bulkheads: armourCausDmg,
    reinforcement: armourReinforcedCausDmg / armourCausDmg,
    total: armourReinforcedCausDmg,
    res: 1 - armourReinforcedCausDmg,
  };
  return armour;
}

/**
 * Calculate defence metrics for a ship
 * @param   {Object}  ship            The ship
 * @param   {Object}  opponent        The opponent ship
 * @param   {int}     sys             The pips to SYS
 * @param   {int}     opponentWep     The pips to pponent's WEP
 * @param   {int}     engagementrange The range between the ship and opponent
 * @returns {Object}                  Defence metrics
 */
export function defenceMetrics(ship, opponent, sys, opponentWep, engagementrange) {
  // Obtain the shield metrics
  const shield = this.shieldMetrics(ship, sys);

  // Obtain the armour metrics
  const armour = this.armourMetrics(ship);

  // Obtain the opponent's sustained DPS on us
  const sustainedDps = this.sustainedDps(opponent, ship, sys, engagementrange);

  const shielddamage = shield.generator ? {
    absolutesdps: sustainedDps.shieldsdps.absolute,
    explosivesdps: sustainedDps.shieldsdps.explosive,
    kineticsdps: sustainedDps.shieldsdps.kinetic,
    thermalsdps: sustainedDps.shieldsdps.thermal,
    totalsdps: sustainedDps.shieldsdps.absolute + sustainedDps.shieldsdps.explosive + sustainedDps.shieldsdps.kinetic + sustainedDps.shieldsdps.thermal,
    totalseps: sustainedDps.eps
  } : {};

  const armourdamage = {
    absolutesdps: sustainedDps.armoursdps.absolute,
    explosivesdps: sustainedDps.armoursdps.explosive,
    kineticsdps: sustainedDps.armoursdps.kinetic,
    thermalsdps: sustainedDps.armoursdps.thermal,
    totalsdps: sustainedDps.armoursdps.absolute + sustainedDps.armoursdps.explosive + sustainedDps.armoursdps.kinetic + sustainedDps.armoursdps.thermal,
    totalseps: sustainedDps.eps
  };

  return { shield, armour, shielddamage, armourdamage };
}

/**
 * Calculate offence metrics for a ship
 * @param   {Object}  ship            The ship
 * @param   {Object}  opponent        The opponent ship
 * @param   {int}     wep             The pips to WEP
 * @param   {int}     opponentSys     The pips to opponent's SYS
 * @param   {int}     engagementrange The range between the ship and opponent
 * @returns {array}                   Offence metrics
 */
export function offenceMetrics(ship, opponent, wep, opponentSys, engagementrange) {
  // Per-weapon and total damage
  const damage = [];

  // Obtain the opponent's shield and armour metrics
  const opponentShields = this.shieldMetrics(opponent, opponentSys);
  const opponentArmour = this.armourMetrics(opponent);

  // Per-weapon and total damage to shields
  for (let i = 0; i < ship.hardpoints.length; i++) {
    if (ship.hardpoints[i].maxClass > 0 && ship.hardpoints[i].m && ship.hardpoints[i].enabled) {
      const m = ship.hardpoints[i].m;

      const classRating = `${m.class}${m.rating}${m.missile ? '/' + m.missile : ''}`;
      let engineering;
      if (m.blueprint && m.blueprint.name) {
        engineering = m.blueprint.name + ' ' + 'grade' + ' ' + m.blueprint.grade;
        if (m.blueprint.special && m.blueprint.special.id >= 0) {
          engineering += ', ' + m.blueprint.special.name;
        }
      }

      const weaponSustainedDps = this._weaponSustainedDps(m, opponent, opponentShields, opponentArmour, engagementrange);
      damage.push({
        id: i,
        mount: m.mount,
        name: m.name || m.grp,
        classRating,
        engineering,
        sdps: weaponSustainedDps.damage,
        seps: weaponSustainedDps.eps,
        effectiveness: weaponSustainedDps.effectiveness
      });
    }
  }

  return damage;
}

/**
 * Calculate the resistance provided by SYS pips
 * @param {integer} sys  the value of the SYS pips
 * @returns {integer}    the resistance for the given pips
 */
export function sysResistance(sys) {
  return Math.pow(sys, 0.85) * 0.6 / Math.pow(4, 0.85);
}

/**
 * Obtain the recharge rate of the SYS capacitor of a power distributor given pips
 * @param {Object}   pd   The power distributor
 * @param {number}   sys  The number of pips to SYS
 * @returns {number}      The recharge rate in MJ/s
 */
export function sysRechargeRate(pd, sys) {
  return pd.getSystemsRechargeRate() * Math.pow(sys, 1.1) / Math.pow(4, 1.1);
}

/**
 * Calculate the sustained DPS for a ship against an opponent at a given range
 * @param   {Object}  ship            The ship
 * @param   {Object}  opponent        The opponent ship
 * @param   {number}  sys             Pips to opponent's SYS
 * @param   {int}     engagementrange The range between the ship and opponent
 * @returns {Object}                  Sustained DPS for shield and armour
 */
export function sustainedDps(ship, opponent, sys, engagementrange) {
  // Obtain the opponent's shield and armour metrics
  const opponentShields = this.shieldMetrics(opponent, sys);
  const opponentArmour = this.armourMetrics(opponent);

  return this._sustainedDps(ship, opponent, opponentShields, opponentArmour, engagementrange);
}

/**
 * Calculate the sustained DPS for a ship against an opponent at a given range
 * @param   {Object}  ship            The ship
 * @param   {Object}  opponent        The opponent ship
 * @param   {Object}  opponentShields   The opponent's shield resistances
 * @param   {Object}  opponentArmour    The opponent's armour resistances
 * @param   {int}     engagementrange The range between the ship and opponent
 * @returns {Object}                  Sustained DPS for shield and armour
 */
export function _sustainedDps(ship, opponent, opponentShields, opponentArmour, engagementrange) {
  const shieldsdps = {
    absolute: 0,
    explosive: 0,
    kinetic: 0,
    thermal: 0
  };

  const armoursdps = {
    absolute: 0,
    explosive: 0,
    kinetic: 0,
    thermal: 0
  };

  let eps = 0;

  for (let i = 0; i < ship.hardpoints.length; i++) {
    if (ship.hardpoints[i].m && ship.hardpoints[i].enabled && ship.hardpoints[i].maxClass > 0) {
      const m = ship.hardpoints[i].m;
      const sustainedDps = this._weaponSustainedDps(m, opponent, opponentShields, opponentArmour, engagementrange);
      shieldsdps.absolute += sustainedDps.damage.shields.absolute;
      shieldsdps.explosive += sustainedDps.damage.shields.explosive;
      shieldsdps.kinetic += sustainedDps.damage.shields.kinetic;
      shieldsdps.thermal += sustainedDps.damage.shields.thermal;
      armoursdps.absolute += sustainedDps.damage.armour.absolute;
      armoursdps.explosive += sustainedDps.damage.armour.explosive;
      armoursdps.kinetic += sustainedDps.damage.armour.kinetic;
      armoursdps.thermal += sustainedDps.damage.armour.thermal;
      eps += sustainedDps.eps;
    }
  }

  return { shieldsdps, armoursdps, eps };
}

/**
 * Stores SDPS split up by type.
 * @typedef {Object} SDps
 * @property {number} absolute  Damage of type absolute
 * @property {number} explosive Damage of type explosive
 * @property {number} kinetic   Damage of type kinetic
 * @property {number} thermal   Damage of type thermal
 * @property {number} [total]   Sum of all damage types
 */

/**
 * An object that holds information about SDPS for a given weapon and opponent.
 * @typedef {Object} WeaponDamage
 * @property {number} eps           Energy per second
 * @property {Object} damage        An object that stores damage inflicted by
 *                                  the weapon.
 * @property {Object} effectiveness An object that stores the effectiveness of
 *                                  the weapon against the opponent given.
 */

/**
 * Stores overall SDPS and against a given opponent's shields and armour.
 * @typedef {Object} WeaponDamage~damage
 * @property {SDps} base    Overall SDPS.
 * @property {SDps} shields SDPS against the given opponent's shields.
 * @property {SDps} armour  SDPS against the given opponent's armour.
 */

/**
 * Calculate the sustained DPS for a weapon at a given range
 * @param   {Object}  m                 The weapon
 * @param   {Object}  opponent          The opponent ship
 * @param   {Object}  opponentShields   The opponent's shield resistances
 * @param   {Object}  opponentArmour    The opponent's armour resistances
 * @param   {int}     engagementrange   The range between the ship and opponent
 * @returns {WeaponDamage}              Sustained DPS for shield and armour
 */
export function _weaponSustainedDps(m, opponent, opponentShields, opponentArmour, engagementrange) {
  const opponentHasShields = opponentShields.generator ? true : false;
  const weapon = {
    eps: 0,
    damage: {
      base: {
        absolute: 0,
        explosive: 0,
        kinetic: 0,
        thermal: 0,
        total: 0,
      },
      shields: {
        absolute: 0,
        explosive: 0,
        kinetic: 0,
        thermal: 0,
        total: 0
      },
      armour: {
        absolute: 0,
        explosive: 0,
        kinetic: 0,
        thermal: 0,
        total: 0
      },
    },
    effectiveness: {
      shields: {
        range: 1,
        sys: opponentHasShields ? opponentShields.absolute.sys : 1,
        resistance: 1,
        dpe: 1
      },
      armour: {
        range: 1,
        hardness: 1,
        resistance: 1,
        dpe: 1
      }
    }
  };

  // EPS
  weapon.eps = m.getClip() ?  (m.getClip() * m.getEps() / m.getRoF()) / ((m.getClip() / m.getRoF()) + m.getReload()) : m.getEps();

  // Initial sustained DPS
  let sDps = m.getSDps();

  // Take fall-off in to account
  const falloff = m.getFalloff();
  if (falloff && engagementrange > falloff) {
    const dropoffRange = m.getRange() - falloff;
    const dropoff = 1 - Math.min((engagementrange - falloff) / dropoffRange, 1);
    weapon.effectiveness.shields.range = weapon.effectiveness.armour.range = dropoff;
    sDps *= dropoff;
  }

  weapon.damage.base.absolute = sDps * m.getDamageDist().A;
  weapon.damage.base.explosive = sDps * m.getDamageDist().E;
  weapon.damage.base.kinetic = sDps * m.getDamageDist().K;
  weapon.damage.base.thermal = sDps * m.getDamageDist().T;
  weapon.damage.base.total = sDps;

  // Piercing/hardness modifier (for armour only)
  const armourMultiple = m.getPiercing() >= opponent.hardness ? 1 : m.getPiercing() / opponent.hardness;
  weapon.effectiveness.armour.hardness = armourMultiple;

  // Break out the damage according to type
  let shieldsResistance = 0;
  let armourResistance = 0;
  if (m.getDamageDist().A) {
    weapon.damage.shields.absolute += sDps * m.getDamageDist().A * (opponentHasShields ? opponentShields.absolute.total : 1);
    weapon.damage.armour.absolute += sDps * m.getDamageDist().A * armourMultiple * opponentArmour.absolute.total;
    shieldsResistance += m.getDamageDist().A * (opponentHasShields ? opponentShields.absolute.generator * opponentShields.absolute.boosters : 1);
    armourResistance += m.getDamageDist().A * opponentArmour.absolute.bulkheads * opponentArmour.absolute.reinforcement;
  }
  if (m.getDamageDist().E) {
    weapon.damage.shields.explosive += sDps * m.getDamageDist().E * (opponentHasShields ? opponentShields.explosive.total : 1);
    weapon.damage.armour.explosive += sDps * m.getDamageDist().E * armourMultiple * opponentArmour.explosive.total;
    shieldsResistance += m.getDamageDist().E * (opponentHasShields ? opponentShields.explosive.generator * opponentShields.explosive.boosters : 1);
    armourResistance += m.getDamageDist().E * opponentArmour.explosive.bulkheads * opponentArmour.explosive.reinforcement;
  }
  if (m.getDamageDist().K) {
    weapon.damage.shields.kinetic += sDps * m.getDamageDist().K * (opponentHasShields ? opponentShields.kinetic.total : 1);
    weapon.damage.armour.kinetic += sDps * m.getDamageDist().K * armourMultiple * opponentArmour.kinetic.total;
    shieldsResistance += m.getDamageDist().K * (opponentHasShields ? opponentShields.kinetic.generator * opponentShields.kinetic.boosters : 1);
    armourResistance += m.getDamageDist().K * opponentArmour.kinetic.bulkheads * opponentArmour.kinetic.reinforcement;
  }
  if (m.getDamageDist().T) {
    weapon.damage.shields.thermal += sDps * m.getDamageDist().T * (opponentHasShields ? opponentShields.thermal.total : 1);
    weapon.damage.armour.thermal += sDps * m.getDamageDist().T * armourMultiple * opponentArmour.thermal.total;
    shieldsResistance += m.getDamageDist().T * (opponentHasShields ? opponentShields.thermal.generator * opponentShields.thermal.boosters : 1);
    armourResistance += m.getDamageDist().T * opponentArmour.thermal.bulkheads * opponentArmour.thermal.reinforcement;
  }
  weapon.damage.shields.total = weapon.damage.shields.absolute + weapon.damage.shields.explosive + weapon.damage.shields.kinetic + weapon.damage.shields.thermal;
  weapon.damage.armour.total = weapon.damage.armour.absolute + weapon.damage.armour.explosive + weapon.damage.armour.kinetic + weapon.damage.armour.thermal;



  weapon.effectiveness.shields.resistance *= shieldsResistance;
  weapon.effectiveness.armour.resistance *= armourResistance;


  weapon.effectiveness.shields.total = weapon.effectiveness.shields.range * weapon.effectiveness.shields.sys * weapon.effectiveness.shields.resistance;
  weapon.effectiveness.armour.total = weapon.effectiveness.armour.range * weapon.effectiveness.armour.resistance * weapon.effectiveness.armour.hardness;

  weapon.effectiveness.shields.dpe = weapon.damage.shields.total / m.getEps() / m.getSustainedFactor();
  weapon.effectiveness.armour.dpe =  weapon.damage.armour.total / m.getEps() / m.getSustainedFactor();


  return weapon;
}

/**
  * Calculate time to drain WEP capacitor
  * @param   {object} ship  The ship
  * @param   {number} wep   Pips to WEP
  * @returns {number}       The time to drain the WEP capacitor, in seconds
  */
export function timeToDrainWep(ship, wep) {
  let totalSEps = 0;

  for (let slotNum in ship.hardpoints) {
    const slot = ship.hardpoints[slotNum];
    if (slot.maxClass > 0 && slot.m && slot.enabled && slot.type === 'WEP' && slot.m.getDps()) {
      totalSEps += slot.m.getClip() ? (slot.m.getClip() * slot.m.getEps() / slot.m.getRoF()) / ((slot.m.getClip() / slot.m.getRoF()) + slot.m.getReload()) : slot.m.getEps();
    }
  }

  // Calculate the drain time
  const drainPerSecond = totalSEps - ship.standard[4].m.getWeaponsRechargeRate() * wep / 4;
  if (drainPerSecond <= 0) {
    // Can fire forever
    return Infinity;
  } else {
    const initialCharge = ship.standard[4].m.getWeaponsCapacity();
    return initialCharge / drainPerSecond;
  }
}

/**
 * Calculate the time to deplete an amount of shields or armour
 * @param   {number} amount          The amount to be depleted
 * @param   {number} dps             The depletion per second
 * @param   {number} eps             The energy drained per second
 * @param   {number} capacity        The initial energy capacity
 * @param   {number} recharge        The energy recharged per second
 * @returns {number}                 The number of seconds to deplete to 0
 */
export function timeToDeplete(amount, dps, eps, capacity, recharge) {
  const drainPerSecond = eps - recharge;
  // If there is nothing to remove, we're don instantly
  if (!amount) {
    return 0;
  } if (drainPerSecond <= 0) {
    // Simple result
    return amount / dps;
  } else {
    // We are draining the capacitor, but can we deplete before we run out
    const timeToDrain = capacity / drainPerSecond;
    const depletedBeforeDrained = dps * timeToDrain;
    if (depletedBeforeDrained >= amount) {
      return amount / dps;
    } else {
      const restToDeplete = amount - depletedBeforeDrained;
      // We delete the rest at the reduced rate
      const reducedDps = dps * (recharge / eps);
      return timeToDrain + (restToDeplete / reducedDps);
    }
  }
}

/**
 * Checks whether diminishing returns should be applied to shield damage
 * multipliers and does so if necessary.
 * @param {number} shieldMult Damage multiplier of shield generator
 * @param {number} combinedMult Damage multiplier of shields and shield boosters
 * @returns {number} Overall damage multiplier
 */
export function diminishingReturnsShields(shieldMult, combinedMult) {
  let max = shieldMult * 0.7;
  if (combinedMult < max) {
    return mapIntoDiminishingRange(max / 2, max, combinedMult);
  } else {
    return combinedMult;
  }
}

/**
 * Checks whether diminishing returns should be applied to armour damage
 * multipliers and does so if necessary.
 * @param  {...any} mults Damage multipliers of alloys and hull reinforcement
 * packages
 * @returns {number} Overall damage multiplier
 */
export function diminishingReturnsArmour(...mults) {
  let max = Math.min(0.7, ...mults);
  let combined = mults.reduce((aggr, v) => aggr * v);
  let diminished = mapIntoDiminishingRange(0.35, max, combined);
  if (diminished < 0.7) {
    return diminished;
  } else {
    return combined;
  }
}

/**
 * Applies diminishing returns to a damage multiplier. Effictively, the range
 * [`0`, `max`]` is mapped into the range [`min`, `max`] for the value `now`.
 * It can also happen, that `now` is outside of the range [`min`, `max`], then
 * `now` is actually improved, i.e. enlarged.
 * @param {number} min Best theoretical damage multiplier
 * @param {number} max Damage multiplier from which diminishing returns start to
 * be applied
 * @param {number} now The current damage multiplier
 * @returns {number} Remapped damage multiplier
 */
export function mapIntoDiminishingRange(min, max, now) {
  return min + (max - min) * (now / max);
}
