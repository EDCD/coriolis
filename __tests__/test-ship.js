import Ship from '../src/app/shipyard/Ship';
import { Ships } from 'coriolis-data/dist';
import * as ModuleUtils from '../src/app/shipyard/ModuleUtils';

describe("Ship", function() {

  it("can build all ships", function() {
    for (let s in Ships) {
      let shipData = Ships[s];
      let ship = new Ship(s, shipData.properties, shipData.slots);

      for (let p in shipData.properties) {
        expect(ship[p]).toEqual(shipData.properties[p], s + ' property [' + p + '] does not match when built');
      }

      ship.buildWith(shipData.defaults);

      expect(ship.cargoCapacity).toBeDefined();
      expect(ship.priorityBands[0].retracted).toBeGreaterThan(0, s + ' priorityBands');
      expect(ship.powerAvailable).toBeGreaterThan(0, s + ' powerAvailable');
      expect(ship.unladenRange).toBeGreaterThan(0, s + ' unladenRange');
      expect(ship.ladenRange).toBeGreaterThan(0, s + ' ladenRange');
      expect(ship.fuelCapacity).toBeGreaterThan(0, s + ' fuelCapacity');
      expect(ship.unladenFastestRange).toBeGreaterThan(0, s + ' unladenFastestRange');
      expect(ship.ladenFastestRange).toBeGreaterThan(0, s + ' ladenFastestRange');
      expect(ship.shield).toBeGreaterThan(0, s + ' shield');
      expect(ship.armour).toBeGreaterThan(0, s + ' armour');
      expect(ship.topSpeed).toBeGreaterThan(0, s + ' topSpeed');
    }
  });

  it("resets and rebuilds properly", function() {
    var id = 'cobra_mk_iii';
    var cobra = Ships[id];
    var shipA = new Ship(id, cobra.properties, cobra.slots);
    var shipB = new Ship(id, cobra.properties, cobra.slots);
    var testShip = new Ship(id, cobra.properties, cobra.slots);

    var buildA = cobra.defaults;
    var buildB = {
      standard:['4A', '4A', '4A', '3D', '3A', '3A', '4C'],
      hardpoints: ['0s', '0s', '2d', '2d', 0, '04'],
      internal: ['45', '03', '2b', '2o', '27', '53']
    };

    shipA.buildWith(buildA); // Build A
    shipB.buildWith(buildB);// Build B
    testShip.buildWith(buildA);

    for(var p in testShip) {
      if (p == 'availCS') {
        continue;
      }
      expect(testShip[p]).toEqual(shipA[p], p + ' does not match');
    }

    testShip.buildWith(buildB);

    for(var p in testShip) {
      if (p == 'availCS') {
        continue;
      }
      expect(testShip[p]).toEqual(shipB[p], p + ' does not match');
    }

    testShip.buildWith(buildA);

    for(var p in testShip) {
      if (p == 'availCS') {
        continue;
      }
      expect(testShip[p]).toEqual(shipA[p], p + ' does not match');
    }
  });

  it("enforces a single shield generator", function() {
    var id = 'anaconda';
    var anacondaData = Ships[id];
    var anaconda = new Ship(id, anacondaData.properties, anacondaData.slots);
    anaconda.buildWith(anacondaData.defaults);

    expect(anaconda.internal[2].m.grp).toEqual('sg', 'Anaconda default shield generator slot');

    anaconda.use(anaconda.internal[1], ModuleUtils.internal('4j'));  // 6E Shield Generator

    expect(anaconda.internal[2].m).toEqual(null, 'Anaconda default shield generator slot is empty');
    expect(anaconda.internal[1].m.id).toEqual('4j', 'Slot 1 should have SG 4j in it');
    expect(anaconda.internal[1].m.grp).toEqual('sg','Slot 1 should have SG 4j in it');

  });

  it("enforces a single shield fuel scoop", function() {
    var id = 'anaconda';
    var anacondaData = Ships[id];
    var anaconda = new Ship(id, anacondaData.properties, anacondaData.slots);
    anaconda.buildWith(anacondaData.defaults);

    anaconda.use(anaconda.internal[4], ModuleUtils.internal('32')); // 4A Fuel Scoop
    expect(anaconda.internal[4].m.grp).toEqual('fs', 'Anaconda fuel scoop slot');

    anaconda.use(anaconda.internal[3], ModuleUtils.internal('32'));

    expect(anaconda.internal[4].m).toEqual(null, 'Anaconda original fuel scoop slot is empty');
    expect(anaconda.internal[3].m.id).toEqual('32', 'Slot 1 should have FS 32 in it');
    expect(anaconda.internal[3].m.grp).toEqual('fs','Slot 1 should have FS 32 in it');
  });

  it("enforces a single refinery", function() {
    var id = 'anaconda';
    var anacondaData = Ships[id];
    var anaconda = new Ship(id, anacondaData.properties, anacondaData.slots);
    anaconda.buildWith(anacondaData.defaults);

    anaconda.use(anaconda.internal[4], ModuleUtils.internal('23')); // 4E Refinery
    expect(anaconda.internal[4].m.grp).toEqual('rf', 'Anaconda refinery slot');

    anaconda.use(anaconda.internal[3], ModuleUtils.internal('23'));

    expect(anaconda.internal[4].m).toEqual(null, 'Anaconda original refinery slot is empty');
    expect(anaconda.internal[3].m.id).toEqual('23', 'Slot 1 should have RF 23 in it');
    expect(anaconda.internal[3].m.grp).toEqual('rf','Slot 1 should have RF 23 in it');
  });

});
