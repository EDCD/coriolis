/**
 * Import modal tests.
 *
 * Rewritten for jest 30 / React 19 using @testing-library/react. The modal is a
 * class component that exposes its parsing/validation state on `this.state`, so
 * we attach a ref to the instance and assert on that state as the original suite
 * did, while driving the UI through real DOM events.
 *
 * NOTE: the expected `code=` query strings are the v3 ('B'-prefixed) link format
 * produced once ship-slots.json became the authoritative slot ordering. They were
 * regenerated from the current import pipeline and verified to round-trip.
 */
import React from 'react';
import { render, fireEvent, cleanup, act } from '@testing-library/react';
import { AppContext } from '../src/app/AppContext';
import { getLanguage } from '../src/app/i18n/Language';

// Router is navigated to on proceed for single builds; capture the calls.
jest.mock('../src/app/Router', () => ({
  __esModule: true,
  default: { go: jest.fn() }
}));

import Router from '../src/app/Router';
import Persist from '../src/app/stores/Persist';
import ModalImport from '../src/app/components/ModalImport';

describe('Import Modal', function() {

  const mockContext = {
    language: getLanguage('en'),
    sizeRatio: 1,
    openMenu: jest.fn(),
    closeMenu: jest.fn(),
    showModal: jest.fn(),
    hideModal: jest.fn(),
    tooltip: jest.fn(),
    termtip: jest.fn(),
    onWindowResize: jest.fn()
  };

  let modal;      // ModalImport instance
  let container;  // rendered DOM root

  /**
   * Render the modal with the given props and capture the instance + container.
   * @param {Object} props Props to pass to ModalImport
   */
  function renderModal(props = {}) {
    const ref = React.createRef();
    let result;
    act(() => {
      result = render(
        <AppContext.Provider value={mockContext}>
          <ModalImport ref={ref} {...props} />
        </AppContext.Provider>
      );
    });
    modal = ref.current;
    container = result.container;
  }

  /**
   * Clear saved builds and (re)render a fresh modal.
   */
  function reset() {
    Router.go.mockClear();
    Persist.deleteAll();
    renderModal();
  }

  /**
   * Simulate user import text entry / paste.
   * @param {string} text Import text / raw data
   */
  function pasteText(text) {
    const textarea = container.querySelector('textarea');
    act(() => {
      fireEvent.change(textarea, { target: { value: text } });
    });
  }

  /**
   * Simulate click on the Proceed button.
   */
  function clickProceed() {
    const proceedButton = container.querySelector('#proceed');
    act(() => {
      fireEvent.click(proceedButton);
    });
  }

  /**
   * Simulate click on the Import button.
   */
  function clickImport() {
    const importButton = container.querySelector('#import');
    act(() => {
      fireEvent.click(importButton);
    });
  }

  afterEach(cleanup);

  describe('Import Backup', function() {

    beforeEach(reset);

    it('imports a valid backup', function() {
      let importData = require('./fixtures/valid-backup');
      let importString = JSON.stringify(importData);

      expect(modal.state.importValid).toEqual(false);
      expect(modal.state.errorMsg).toEqual(null);
      pasteText(importString);
      expect(modal.state.importValid).toBe(true);
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.builds).toEqual(importData.builds);
      expect(modal.state.comparisons).toEqual(importData.comparisons);
      expect(modal.state.shipDiscount).toEqual(importData.discounts[0]);
      expect(modal.state.moduleDiscount).toEqual(importData.discounts[1]);
      expect(modal.state.insurance).toBe(importData.insurance.toLowerCase());
      clickProceed();
      expect(modal.state.processed).toBe(true);
      expect(modal.state.errorMsg).toEqual(null);
      clickImport();
      expect(Persist.getBuilds()).toEqual(importData.builds);
      expect(Persist.getComparisons()).toEqual(importData.comparisons);
      expect(Persist.getInsurance()).toEqual(importData.insurance.toLowerCase());
      expect(Persist.getShipDiscount()).toEqual(importData.discounts[0]);
      expect(Persist.getModuleDiscount()).toEqual(importData.discounts[1]);
    });

    it('imports an old valid backup', function() {
      const importData = require('./fixtures/old-valid-export');
      const importStr = JSON.stringify(importData);

      pasteText(importStr);
      expect(modal.state.builds).toEqual(importData.builds);
      expect(modal.state.importValid).toBe(true);
      expect(modal.state.errorMsg).toEqual(null);
      clickProceed();
      expect(modal.state.processed).toBeTruthy();
      clickImport();
      expect(Persist.getBuilds()).toEqual(importData.builds);
    });

    it('catches an invalid backup', function() {
      const importData = require('./fixtures/valid-backup');
      let invalidImportData = Object.assign({}, importData);
      // Remove Asp Miner build used in comparison
      delete(invalidImportData.builds.asp);

      pasteText('"this is not valid"');
      expect(modal.state.importValid).toBeFalsy();
      expect(modal.state.errorMsg).toEqual('Must be an object or array!');

      pasteText('{ "builds": "Should not be a string" }');
      expect(modal.state.importValid).toBeFalsy();
      expect(modal.state.errorMsg).toEqual('builds must be an object!');

      pasteText(JSON.stringify(importData).replace(/anaconda/g, 'invalid_ship'));
      expect(modal.state.importValid).toBeFalsy();
      expect(Object.keys(modal.state.builds)).not.toContain('anaconda');

      pasteText(JSON.stringify(importData).replace('Dream', ''));
      expect(modal.state.importValid).toBeFalsy();
      expect(Object.keys(modal.state.builds.imperial_clipper).length).toEqual(3);

      pasteText(JSON.stringify(invalidImportData));
      expect(modal.state.importValid).toBeFalsy();
      expect(modal.state.errorMsg).toEqual('asp build "Miner" data is missing!');
    });
  });

  describe('Import Detailed V3 Build', function() {

    beforeEach(reset);

    it('imports a valid v3 build', function() {
      const importData = require('./fixtures/anaconda-test-detailed-export-v3');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(Router.go.mock.calls.length).toBe(1);
      expect(Router.go.mock.calls[0][0]).toBe('/outfit/anaconda?code=B4putkFklkdzsuf52c0o0o0o1m1m0q0q0404-0l0b0100034k5n052d04---0303326b--.AwRj4zNLeYg%3D.CwBhCYzBGW9qCTSqq5IiA%3D%3D%3D.&bn=Test%20My%20Ship');
    });

    it('catches an invalid build', function() {
      const importData = require('./fixtures/anaconda-test-detailed-export-v3');
      pasteText(JSON.stringify(importData).replace('references', 'refs'));

      expect(modal.state.importValid).toBeFalsy();
      expect(modal.state.errorMsg).toEqual('Anaconda Build "Test My Ship": Invalid data');
    });
  });

  describe('Import Detailed V4 Build', function() {

    beforeEach(reset);

    it('imports a valid v4 build', function() {
      const importData = require('./fixtures/anaconda-test-detailed-export-v4');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(Router.go.mock.calls.length).toBe(1);
      expect(Router.go.mock.calls[0][0]).toBe('/outfit/anaconda?code=B4putkFklkdzsuf52c0o0o0o1m1m0q0q0404-0l0b0100034k5n052d04---0303326b--.AwRj4zNLeYg%3D.CwBhCYzBGW9qCTSqq5IiA%3D%3D%3D.H4sIAAAAAAAAA2MUe8HMwPD%2FPwMAAGvB0AkAAAA%3D&bn=Test%20My%20Ship');
    });
  });

  describe('Import Detailed V5 Build', function() {

    beforeEach(reset);

    it('imports a valid v5 build (engineered bulkheads)', function() {
      const importData = require('./fixtures/anaconda-test-detailed-export-v5');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(Router.go.mock.calls.length).toBe(1);
      expect(Router.go.mock.calls[0][0]).toContain('/outfit/anaconda?code=B');
    });
  });

  describe('Import Detailed Engineered V4 Build', function() {

    beforeEach(reset);

    it('imports a valid v4 build', function() {
      const importData = require('./fixtures/asp-test-detailed-export-v4');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(Router.go.mock.calls.length).toBe(1);
      expect(Router.go.mock.calls[0][0]).toBe('/outfit/asp?code=B0pftiFflfddsnf5------020202033c044002v6-2i--.AwRj4yvZiA%3D%3D.CwRgDBldHn5iA%3D%3D%3D.H4sIAAAAAAAAAzWMzQ2CQBgFZ1EJnDZh0Wy4UgEdWBM9WIgFGK5UYAFWohfDT%2Fie7oG5vnnj7ApsDiiek3TJgWpwoMziPp1HB%2F5rUvtapLrIIH4AHaxJ0im97gH8NkvxVkKdBwh9Kh2t20vV4y35dZIk%2FvwATHGqVIAAAAA%3D&bn=Multi-purpose%20Asp%20Explorer');
    });

    it('imports a valid v4 build with modifications', function() {
      const importData = require('./fixtures/courier-test-detailed-export-v4');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(Router.go.mock.calls.length).toBe(1);
      expect(Router.go.mock.calls[0][0]).toBe('/outfit/imperial_courier?code=B0patzF5l0das8f31a1a270202000e402t0101-----.AwRj4zOGg%3D%3D%3D.CwRgDBldLuFA.H4sIAAAAAAAAA12OvUrDYABFT35tjJKaJk2xacHWTi7i4CBCQBS6uNeti5NDn0IQZ3cnN8HHEBz0IRxFQcHi0H5XviEg3uEu51y4jqmApQO0Sx%2BSvpEazx7INW2LfCC%2Fj2A460LnNYTkDsjOl5I8s2mlAEi%2FEkiu51JnHkJWtUANc1bz3k4BwVhScw8IH96lgnVQ9Ee6SCG4tVLfSocfUrFlj1UOaNVMrOkBC1vBZQThLIfe1IfmATA8CqDz6UGyL4ndH0mxGdVDrlqQZidQvo1Aa%2F%2FRZAxlPAAl5rRG%2BXQF4kcHNgYubB%2F74D59S92bhRS%2B2Heizi%2Fs%2BCJdVwEAAA%3D%3D&bn=Multi-purpose%20Imperial%20Courier');
    });
  });

  describe('Import Detailed Builds Array', function() {

    beforeEach(reset);

    it('imports all builds', function() {
      const importData = require('./fixtures/valid-detailed-export');
      const expectedBuilds = require('./fixtures/expected-builds');

      pasteText(JSON.stringify(importData));
      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      clickProceed();
      expect(modal.state.processed).toBeTruthy();
      clickImport();

      let builds = Persist.getBuilds();

      for (let s in builds) {
        for (let b in builds[s]) {
          expect(builds[s][b]).toEqual(expectedBuilds[s][b]);
        }
      }
    });
  });

  describe('Import Companion API Build', function() {

    beforeEach(reset);

    it('imports a valid companion API build (Federal Corvette)', function() {
      const importData = require('./fixtures/companion-api-import-1');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(Router.go.mock.calls.length).toBe(1);
      expect(Router.go.mock.calls[0][0]).toBe('/outfit/federal_corvette?code=B2putsFklndzsxf50x0x7l28281919040404040402020l06p05sf63c5ifr--v66g--4C.AwRj4zNarI%3D%3D.CwRgDBldUExuBiIlQoA%3D.&bn=Imported%20Federal%20Corvette');
    });

    it('imports a valid companion API build (Beluga)', function() {
      const importData = require('./fixtures/companion-api-import-2');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(Router.go.mock.calls.length).toBe(1);
      expect(Router.go.mock.calls[0][0]).toBe('/outfit/beluga?code=B0pktsFplCdpsnf70t0t2727270004040404043c4fmimlmm04mc0iv62i--4C.AwRj4yu8g%3D%3D%3D.CwRgDBldHi8IWEQ%3D.&bn=Imported%20Beluga%20Liner');
    });

    it('imports a valid companion API build (Type-7)', function() {
      const importData = require('./fixtures/companion-api-import-3');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(Router.go.mock.calls.length).toBe(1);
      expect(Router.go.mock.calls[0][0]).toBe('/outfit/type_7_transport?code=B0patfFflidasdf5----04040400--05050504044d2402--4C.AwRj4yuo.CwRgDBldYncXLIA%3D.&bn=Imported%20Type-7%20Transporter');
    });

    it('imports a valid companion API build (Cobra Mk III)', function() {
      const importData = require('./fixtures/companion-api-import-4');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(Router.go.mock.calls.length).toBe(1);
      expect(Router.go.mock.calls[0][0]).toBe('/outfit/cobra_mk_iii?code=B0p0tdFaldd3sdf4------34----2i--4C.AwRj4ypI.CwRgDMYExrezBiRA.&bn=Imported%20Cobra%20Mk%20III');
    });
  });

  describe('Import E:D Shipyard Builds', function() {

    it('catches invalid builds', function() {
      const imports = require('./fixtures/ed-shipyard-import-invalid');

      for (let i = 0; i < imports.length; i++ ) {
        reset();
        pasteText(imports[i].buildText);
        expect(modal.state.importValid).toBeFalsy();
        expect(modal.state.errorMsg).toEqual(imports[i].errorMsg);
      }
    });
  });

  describe('Imports from a Comparison', function() {

    it('imports a valid comparison', function() {
      const importBuilds = require('./fixtures/valid-backup').builds;
      Persist.deleteAll();
      renderModal({ builds: importBuilds });

      expect(modal.state.processed).toBe(true);
      expect(modal.state.errorMsg).toEqual(null);
      clickImport();
      expect(Persist.getBuilds()).toEqual(importBuilds);
    });
  });

  describe('Imports SLEF data', () => {
    beforeEach(reset);

    it('imports a single valid SLEF build', () => {
      const importData = require('./fixtures/slef-single-build.json');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(Router.go.mock.calls.length).toBe(1);
      expect(Router.go.mock.calls[0][0]).toBe('/outfit/krait_mkii?code=B2pptkFflidussf52l1o1o2g2g020g040405051Ofr45C9C91oP34F.Iw18RQ%3D%3D.AwRgzKIsQ%3D%3D%3D.H4sIAAAAAAAAA4XOsQ2CQBiG4ZeTg%2BBhwIuJFxMrTZyBQUjcwJYRGIWSESwcwgEcwxLuJ78Jtc3XPG%2FxEXNgtoB7Gdj1JezvBvzTwfWbgGziSSMDVOMs4j8WDk0BQUsp4mP1CcAOFWTvHC4%2F3%2F5xF9v1BPUNUh3fHSFodA6TiIgqC3IQl9WwAAAA&bn=Imported%20pancake%20hammer');
    });

    it('imports multiple SLEF builds', () => {
      const importData = require('./fixtures/slef-multiple-builds.json');
      const expectedBuilds = require('./fixtures/slef-multiple-expected-builds.json');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(false);
      clickProceed();
      expect(modal.state.processed).toBeTruthy();
      clickImport();

      const builds = Persist.getBuilds();

      for (const shipModel in builds) {
        for (const buildName in builds[shipModel]) {
          expect(builds[shipModel][buildName])
            .toEqual(expectedBuilds[shipModel][buildName]);
        }
      }
    });
  });
});
