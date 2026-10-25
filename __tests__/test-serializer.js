import Ship from '../src/app/shipyard/Ship';
import { Ships } from 'coriolis-data/dist';
import * as Serializer from '../src/app/shipyard/Serializer';
import jsen from 'jsen';

describe("Serializer", function() {
  const anacondaTestExport = jest.requireActual('./fixtures/anaconda-test-detailed-export-v5');
  const code = anacondaTestExport.references[0].code;
  const anaconda = Ships.anaconda;
  const validate = jsen(require('../src/schemas/ship-loadout/5'));

  describe("To Detailed Build", function() {
    let testBuild = new Ship('anaconda', anaconda.properties, anaconda.slots).buildFrom(code);
    let exportData = Serializer.toDetailedBuild('Test My Ship', testBuild);

    it("conforms to the v5 ship-loadout schema", function() {
      expect(validate(exportData)).toBe(true);
    });

    it("contains the correct components and stats", function() {
      expect(exportData.components).toEqual(anacondaTestExport.components);
      expect(exportData.stats).toEqual(anacondaTestExport.stats);
      expect(exportData.ship).toEqual(anacondaTestExport.ship);
      expect(exportData.name).toEqual(anacondaTestExport.name);
    });

  });

  describe("Export Detailed Builds", function() {
    const expectedExport = require('./fixtures/valid-detailed-export');
    const builds = require('./fixtures/expected-builds');
    const exportData = Serializer.toDetailedExport(builds);

    it("conforms to the v5 ship-loadout schema", function() {
      expect(exportData instanceof Array).toBe(true);

      for (let detailedBuild of exportData) {
        expect(validate(detailedBuild)).toBe(true);
      }
    });

  });

  describe("From Detailed Build", function() {

    it("builds the ship correctly", function() {
      let testBuildA = new Ship('anaconda', anaconda.properties, anaconda.slots);
      testBuildA.buildFrom(code);
      let testBuildB = Serializer.fromDetailedBuild(anacondaTestExport);

      for(var p in testBuildB) {
        if (p == 'availCS') {
          continue;
        }
        expect(testBuildB[p]).toEqual(testBuildA[p], p + ' does not match');
      }

    });

  });


});
