jest.unmock('../src/app/stores/Persist');

let origAddEventListener = window.addEventListener;
let storageListener;
let ls = {};

// Mock localStorage. Persist reads the GLOBAL `localStorage` (not window.localStorage
// specifically), so we install this mock as the global. Under the jsdom test
// environment a real (empty) localStorage otherwise shadows any window.localStorage
// swap, which is why these tests previously read defaults. setItem coerces to string
// to mirror real localStorage semantics.
let mockLocalStorage = {
  getItem: function(key) {
    return key in ls ? ls[key] : null;
  },
  setItem: function(key, value) {
    ls[key] = String(value);
  },
  removeItem: function(key) {
    delete ls[key];
  },
  clear: function() {
    ls = {};
  }
};

function installLocalStorage(store) {
  ls = store || {};
  Object.defineProperty(global, 'localStorage', { value: mockLocalStorage, configurable: true, writable: true });
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, configurable: true, writable: true });
}

function removeLocalStorage() {
  ls = {};
  Object.defineProperty(global, 'localStorage', { value: null, configurable: true, writable: true });
  Object.defineProperty(window, 'localStorage', { value: null, configurable: true, writable: true });
}

window.addEventListener = function(eventName, listener) {

  if(eventName == 'storage') {
    storageListener = listener; // Keep track of latest storage listener
  } else {
    origAddEventListener.apply(arguments);
  }
}

describe('Persist', function() {

  const Persist = require('../src/app/stores/Persist').Persist;

  describe('Multi tab/window', function() {
    it("syncs builds", function() {
      installLocalStorage();
      let p = new Persist();
      let newBuilds = {
        anaconda: { test: '1234' }
      };

      storageListener({ key: 'builds', newValue: JSON.stringify(newBuilds) });
      expect(p.getBuild('anaconda', 'test')).toBe('1234');
    });
  });

  describe('General and Settings', function() {
    it("has defaults", function() {
      installLocalStorage();
      let p = new Persist();
      expect(p.getLangCode()).toBe('en');
      expect(p.showTooltips()).toBe(true);
      expect(p.getInsurance()).toBe('standard');
      expect(p.getShipDiscount()).toBe(0);
      expect(p.getModuleDiscount()).toBe(0);
      expect(p.getSizeRatio()).toBe(1);
    });

    it("loads from localStorage correctly", function() {
      let savedData = require('./fixtures/valid-backup');
      installLocalStorage({
        builds: JSON.stringify(savedData.builds),
        NG_TRANSLATE_LANG_KEY: 'de',
        insurance: 'Standard',
        shipDiscount: '0.25',
        moduleDiscount: '0.15',
      });
      let p = new Persist();

      expect(p.getInsurance()).toBe('standard');
      expect(p.getShipDiscount()).toBe(0.25);
      expect(p.getModuleDiscount()).toBe(0.15);
      expect(p.getLangCode()).toEqual('de');
      expect(p.getBuilds('anaconda')).toEqual(savedData.builds.anaconda);
      expect(p.getBuilds('python')).toEqual(savedData.builds.python);
      expect(p.getBuildsNamesFor('imperial_clipper')).toEqual(['Cargo', 'Current', 'Dream', 'Multi-purpose']);
      expect(p.getBuild('type_7_transport', 'Cargo')).toEqual('02A5D5A4D3D3D5C--------0505040403480101');
    });

    it("uses defaults from a corrupted localStorage", function() {
      installLocalStorage({
        builds: 'not valid json',
        comparisons: '1, 3, 4',
        insurance: 'this insurance does not exist',
        shipDiscount: 'this is not a number',
        moduleDiscount: '10', // Way to big
      });

      let p = new Persist();
      expect(p.getLangCode()).toBe('en');
      expect(p.showTooltips()).toBe(true);
      expect(p.getInsurance()).toBe('standard');
      expect(p.getShipDiscount()).toBe(0);
      expect(p.getModuleDiscount()).toBe(0);
      expect(p.getBuilds()).toEqual({});
      expect(p.getComparisons()).toEqual({});
    });

    it("works without localStorage", function() {
      removeLocalStorage();
      let p = new Persist();
      expect(p.getLangCode()).toBe('en');
      expect(p.showTooltips()).toBe(true);
      expect(p.getInsurance()).toBe('standard');
      expect(p.getShipDiscount()).toBe(0);
      expect(p.getModuleDiscount()).toBe(0);
      expect(p.getSizeRatio()).toBe(1);

      p.saveBuild('anaconda', 'test', '12345');
      expect(p.getBuild('anaconda', 'test')).toBe('12345');

      p.deleteBuild('anaconda', 'test');
      expect(p.hasBuilds()).toBe(false);
    });

    it("generates the backup", function() {
      let savedData = require('./fixtures/valid-backup');
      installLocalStorage({
        builds: JSON.stringify(savedData.builds),
        insurance: 'Beta',
        shipDiscount: '0.25',
        moduleDiscount: '0.15',
      });

      let p = new Persist();
      let backup = p.getAll();

      expect(backup.insurance).toBe('beta');
      expect(backup.shipDiscount).toBe(0.25);
      expect(backup.moduleDiscount).toBe(0.15);
      expect(backup.builds).toEqual(savedData.builds);
      expect(backup.comparisons).toEqual({});
    });
  });
})
