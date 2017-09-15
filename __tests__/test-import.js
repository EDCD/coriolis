jest.unmock('../src/app/stores/Persist');
jest.unmock('../src/app/components/TranslatedComponent');
jest.unmock('../src/app/components/ModalImport');
jest.unmock('prop-types');

import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import TU from 'react-testutils-additions';
import Utils from './testUtils';
import { getLanguage } from '../src/app/i18n/Language';

describe('Import Modal', function() {

  let MockRouter = require('../src/app/Router').default;
  const Persist = require('../src/app/stores/Persist').default;
  const ModalImport = require('../src/app/components/ModalImport').default;
  const mockContext = {
    language: getLanguage('en'),
    sizeRatio: 1,
    openMenu: jest.genMockFunction(),
    closeMenu: jest.genMockFunction(),
    showModal: jest.genMockFunction(),
    hideModal: jest.genMockFunction(),
    tooltip: jest.genMockFunction(),
    termtip: jest.genMockFunction(),
    onWindowResize: jest.genMockFunction()
  };

  let modal, render, ContextProvider = Utils.createContextProvider(mockContext);

  /**
   * Clear saved builds, and reset React DOM
   */
  function reset() {
    MockRouter.go.mockClear();
    Persist.deleteAll();
    render = TU.renderIntoDocument(<ContextProvider><ModalImport /></ContextProvider>);
    modal = TU.findRenderedComponentWithType(render, ModalImport);
  }

  /**
   * Simulate user import text entry / paste
   * @param  {string} text Import text / raw data
   */
  function pasteText(text) {
    let textarea = TU.findRenderedDOMComponentWithTag(render, 'textarea');
    TU.Simulate.change(textarea, { target: { value: text } });
  }

  /**
   * Simulate click on Proceed button
   */
  function clickProceed() {
    let proceedButton = TU.findRenderedDOMComponentWithId(render, 'proceed');
    TU.Simulate.click(proceedButton);
  }

  /**
   * Simulate click on Import button
   */
  function clickImport() {
    let importButton = TU.findRenderedDOMComponentWithId(render, 'import');
    TU.Simulate.click(importButton);
  }

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
      //invalidImportData.builds.asp = null;   // Remove Asp Miner build used in comparison
      delete(invalidImportData.builds.asp);

      pasteText('"this is not valid"');
      expect(modal.state.importValid).toBeFalsy();
      expect(modal.state.errorMsg).toEqual('Must be an object or array!');
      pasteText('{ "builds": "Should not be a string" }');
      expect(modal.state.importValid).toBeFalsy();
      expect(modal.state.errorMsg).toEqual('builds must be an object!');
      pasteText(JSON.stringify(importData).replace('anaconda', 'invalid_ship'));
      expect(modal.state.importValid).toBeFalsy();
      expect(modal.state.errorMsg).toEqual('"invalid_ship" is not a valid Ship Id!');
      pasteText(JSON.stringify(importData).replace('Dream', ''));
      expect(modal.state.importValid).toBeFalsy();
      expect(modal.state.errorMsg).toEqual('Imperial Clipper build "" must be a string at least 1 character long!');
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
      expect(MockRouter.go.mock.calls.length).toBe(1);
      expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/anaconda?code=A4putkFklkdzsuf52c0o0o0o1m1m0q0q0404-0l0b0100034k5n052d04---0303326b.AwRj4zNLaA%3D%3D.CwBhCYzBGW9qCTSqq5xA.&bn=Test%20My%20Ship');
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
      expect(MockRouter.go.mock.calls.length).toBe(1);
      expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/anaconda?code=A4putkFklkdzsuf52c0o0o0o1m1m0q0q0404-0l0b0100034k5n052d04---0303326b.AwRj4zNLaA%3D%3D.CwBhCYzBGW9qCTSqq5xA.H4sIAAAAAAAAA2MUe8HMwPD%2FPwMAAGvB0AkAAAA%3D&bn=Test%20My%20Ship');
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
      expect(MockRouter.go.mock.calls.length).toBe(1);
      expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/asp?code=A0pftiFflfddsnf5------020202033c044002v62f2i.AwRj4yvI.CwRgDBldHnJA.H4sIAAAAAAAAA2P858DAwPCXEUhwHPvx%2F78YG5AltB7I%2F8%2F0TwImJboDSPJ%2F%2B%2Ff%2Fv%2FKlX%2F%2F%2Fi3AwMTBIfARK%2FGf%2BJwVSxArStVAYqOjvz%2F%2F%2FJVo5GRhE2IBc4SKQSSz%2FDGEmCa398P8%2F%2F2%2BgTf%2F%2FA7kMAExxqlSAAAAA&bn=Multi-purpose%20Asp%20Explorer');
    });

    it('imports a valid v4 build with modifications', function() {
      const importData = require('./fixtures/courier-test-detailed-export-v4');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(MockRouter.go.mock.calls.length).toBe(1);
      expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/imperial_courier?code=A0patzF5l0das8f31a1a270202000e402t0101-2f.AwRj4zKA.CwRgDBldLiQ%3D.H4sIAAAAAAAAA12OPUvDYBSFT1OTfkRJjUkbbC3Yj8mlODgUISAtdOlety5ODv0Vgji7O7kJ%2FgzBQX%2BEY7Gg0NKhfY%2FnHQLFDBdynufe9%2BRMCmCb06g29oCgacjiRx6gY6oWKUT8UgLaszqQfHmSnpVFN1uSeXNsJVcj%2FA2EHlZkspIUpUc6UjTXGT85qwHuSEuVc%2F16r99kDQeSSjvSbSjpyUpNK10uJJ3aYqk6smwm1lQ9bOxw71TMm8VanEqq9JW1r3Qo%2BREOLnQHvbWmb7rZIu5VLIyGQGOukPv%2F0WQk5LeEAjPOUDwtAP6bShy2HKAz0HPO%2B5KsP25I79O2I7LvD%2Bz4Il1XAQAA&bn=Multi-purpose%20Imperial%20Courier');
    });
  });

  describe('Import Detaild Builds Array', function() {

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

    it('imports a valid companion API build', function() {
      const importData = require('./fixtures/companion-api-import-1');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(MockRouter.go.mock.calls.length).toBe(1);
      expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/federal_corvette?code=A2putsFklndzsxf50x0x7l28281919040404040402020l06p05sf63c5ifr--v66g2f.AwRj4zNaqA%3D%3D.CwRgDBldUExuBiIlUA%3D%3D.H4sIAAAAAAAAA12STy8DURTFb1szU53Ga8dg2qqqDmJDIoKFxJImumYjVrVqfAALC4lNbcUnkLCoDbEQu0bSlQVhI8JHsJBIQ73rXMkwMYuT9%2Bb87nl%2F7ovoRSL6ikD6TYNINZg5XsWUo7pfrBikr2USlRyXyDuLAhr6ZHanNLOzD5tjOiskysk5dOBvfTB7bjeRW0MNG3ohSBq1bKKxKwyLLUAjmwjpPu4wJx4xVbNI57heDfbUKUAy2xaRUQZpllHoHMHxKqjhhF4LgjtJiFHDmqbrEeVnUJOax7%2FSdRfRwBNotv9wo5kAuZMD2egKyDYcdYl1OBki6z%2BZQjaFnBPyFCM1LefF%2BcgrY0es9FKwbW8ZYj9gmBbxRVRdglMh6BNqnwsk4ouoO4HSIehNoBuBRHwR1QOmsBvHmk6IfMbd2fdCEka%2BjNSexPWGoEkcyX6CnxbxRZQtd%2BPpym%2B31xFtn0iSFPkf%2BBkttZlzB9KDFyBuFRfAGV0Ogoff8SSsCfjjD5hGWtLIwZB%2FgX5Zt%2BLHMI9My7sp6nzgZzekswTxVvCOkq%2FSXqb%2F3zfLxh6HrwIAAA%3D%3D&bn=Imported%20Federal%20Corvette');
    });

    it('imports a valid companion API build', function() {
      const importData = require('./fixtures/companion-api-import-2');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(MockRouter.go.mock.calls.length).toBe(1);
      expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/beluga?code=A0pktsFplCdpsnf70t0t2727270004040404043c4fmimlmm04mc0iv62i2f.AwRj4yukg%3D%3D%3D.CwRgDBldHi8IUA%3D%3D.H4sIAAAAAAAAA2P8Z8%2FAwPCXEUiIKTMxMPCv%2F%2Ff%2FP8cFIPGf6Z8YTEr0GjMDg%2FJWICERBOTzn%2Fn7%2F7%2FIO5Ai5n9SIEWsQEIoSxAolfbt%2F3%2BJPk4GBhE7YQYGYVmgcuVnf4Aq%2FwOVAAAyiFctbgAAAA%3D%3D&bn=Imported%20Beluga%20Liner');
    });

    it('imports a valid companion API build', function() {
      const importData = require('./fixtures/companion-api-import-3');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(MockRouter.go.mock.calls.length).toBe(1);
      expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/type_7_transport?code=A0patfFflidasdf5----0404040005050504044d2402.AwRj4yrI.CwRgDBlVK7EiA%3D%3D%3D.&bn=Imported%20Type-7%20Transporter');
    });

    it('imports a valid companion API build', function() {
      const importData = require('./fixtures/companion-api-import-4');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(MockRouter.go.mock.calls.length).toBe(1);
      expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/cobra_mk_iii?code=A0p0tdFaldd3sdf4------34---2f2i.AwRj4yKA.CwRgDMYExrezBUg%3D.&bn=Imported%20Cobra%20Mk%20III');
    });
  });

  describe('Import E:D Shipyard Builds', function() {

//    it('imports a valid build', function() {
//      const imports = require('./fixtures/ed-shipyard-import-valid');
//
//      for (let i = 0; i < imports.length; i++ ) {
//        reset();
//        let fixture = imports[i];
//        pasteText(fixture.buildText);
//        expect(modal.state.importValid).toBeTruthy();
//        expect(modal.state.errorMsg).toEqual(null);
//        clickProceed();
//        expect(MockRouter.go.mock.calls.length).toBe(1);
//        expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/' + fixture.shipId + '?code=' + encodeURIComponent(fixture.buildCode) + '&bn=' + encodeURIComponent(fixture.buildName));
//      }
//    });

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
      render = TU.renderIntoDocument(<ContextProvider><ModalImport builds={importBuilds} /></ContextProvider>);
      modal = TU.findRenderedComponentWithType(render, ModalImport);

      expect(modal.state.processed).toBe(true);
      expect(modal.state.errorMsg).toEqual(null);
      clickImport();
      expect(Persist.getBuilds()).toEqual(importBuilds);
    });
  });

});
