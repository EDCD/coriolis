import React from 'react';
import Page from './Page';
import Router from '../Router';
import cn from 'classnames';
import { Ships } from 'coriolis-data/dist';
import Ship from '../shipyard/Ship';
import { fromComparison, toComparison } from '../shipyard/Serializer';
import Persist from '../stores/Persist';
import { SizeMap, ShipFacets } from '../shipyard/Constants';
import ComparisonTable from '../components/ComparisonTable';
import BarChart from '../components/BarChart';
import ModalCompare from '../components/ModalCompare';
import ModalExport from '../components/ModalExport';
import ModalPermalink from '../components/ModalPermalink';
import ModalImport from '../components/ModalImport';
import {
  FloppyDisk,
  Bin,
  Download,
  Embed,
  Rocket,
  LinkIcon
} from '../components/SvgIcons';
import ShortenUrl from '../utils/ShortenUrl';
import { comparisonBBCode } from '../utils/BBCode';
const browser = require('detect-browser');

/**
 * Creates a comparator based on the specified predicate
 * @param  {string} predicate Predicate / propterty name
 * @return {Function}         Comparator
 */
function sortBy(predicate) {
  return (a, b) => {
    if (a[predicate] === b[predicate]) {
      if (a.name == b.name) {
        a.buildName.toLowerCase() > b.buildName.toLowerCase() ? 1 : -1;
      }
      return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
    }
    if (typeof a[predicate] == 'string') {
      return a[predicate].toLowerCase() > b[predicate].toLowerCase() ? 1 : -1;
    }
    return a[predicate] > b[predicate] ? 1 : -1;
  };
}

/**
 * Comparison Page
 */
export default class ComparisonPage extends Page {
  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props, context);
    this._sortShips = this._sortShips.bind(this);
    this._buildsSelected = this._buildsSelected.bind(this);
    this._updateDiscounts = this._updateDiscounts.bind(this);
    this.state = this._initState(context);
  }

  /**
   * [Re]Create initial state from context
   * @param  {context} context React component context
   * @return {Object}          New state object
   */
  _initState(context) {
    let defaultFacets = [13, 12, 11, 9, 6, 4, 1, 3, 2]; // Reverse order of Armour, Shields, Speed, Jump Range, Cargo Capacity, Cost, DPS, EPS, HPS
    let params = context.route.params;
    let code = params.code;
    let name = params.name ? decodeURIComponent(params.name) : null;
    let newName = '';
    let compareMode = !code;
    let builds = [];
    let saved = false;
    let predicate = 'name';
    let desc = false;
    let importObj = {};

    if (compareMode) {
      if (name == 'all') {
        let allBuilds = Persist.getBuilds();
        newName = name;
        for (let shipId in allBuilds) {
          for (let buildName in allBuilds[shipId]) {
            if (buildName && allBuilds[shipId][buildName]) {
              builds.push(
                this._createBuild(
                  shipId,
                  buildName,
                  allBuilds[shipId][buildName]
                )
              );
            }
          }
        }
      } else {
        let comparisonData = Persist.getComparison(name);
        if (comparisonData) {
          defaultFacets = comparisonData.facets;
          comparisonData.builds.forEach(b =>
            builds.push(this._createBuild(b.shipId, b.buildName))
          );
          saved = true;
          newName = name;
        }
      }
    } else {
      try {
        let comparisonData = toComparison(code);
        defaultFacets = comparisonData.f;
        newName = name = comparisonData.n;
        predicate = comparisonData.p;
        desc = comparisonData.d;
        comparisonData.b.forEach(build => {
          builds.push(this._createBuild(build.s, build.n, build.c));
          if (!importObj[build.s]) {
            importObj[build.s] = {};
          }
          importObj[build.s][build.n] = build.c;
        });
      } catch (e) {
        throw { type: 'bad-comparison', message: e.message, details: e };
      }
    }

    let facets = [];
    let selectedLength = defaultFacets.length;
    let selectedFacets = new Array(selectedLength);

    for (let i = 0; i < ShipFacets.length; i++) {
      let facet = Object.assign({}, ShipFacets[i]);
      let defaultIndex = defaultFacets.indexOf(facet.i);
      if (defaultIndex == -1) {
        facets.push(facet);
      } else {
        facet.active = true;
        selectedFacets[selectedLength - defaultIndex - 1] = facet;
      }
    }

    facets = selectedFacets.concat(facets);
    builds.sort(sortBy(predicate));

    return {
      title: 'Coriolis EDCD Edition - Compare',
      predicate,
      desc,
      facets,
      builds,
      compareMode,
      code,
      name,
      newName,
      saved,
      importObj
    };
  }
  /**
   * Create a Ship instance / build
   * @param  {string} id   Ship Id
   * @param  {name} name   Build name
   * @param  {string} code Optional - Serialized ship code
   * @return {Object}      Ship instance with build name
   */
  _createBuild(id, name, code) {
    code = code ? code : Persist.getBuild(id, name); // Retrieve build code if not passed

    if (!code) {
      // No build found
      return;
    }

    let data = Ships[id]; // Get ship properties
    let b = new Ship(id, data.properties, data.slots); // Create a new Ship instance
    b.buildFrom(code); // Populate components from code
    b.buildName = name;
    b.applyDiscounts(Persist.getShipDiscount(), Persist.getModuleDiscount());
    return b;
  }

  /**
   * Update state with the specified sort predicates
   * @param  {String} predicate      Sort predicate - property name
   */
  _sortShips(predicate) {
    let { builds, desc } = this.state;
    if (this.state.predicate == predicate) {
      desc = !desc;
    }

    builds.sort(sortBy(predicate));

    if (desc) {
      builds.reverse();
    }

    this.setState({ predicate, desc });
  }

  /**
   * Show selected builds modal
   */
  _selectBuilds() {
    this.context.showModal(
      <ModalCompare
        onSelect={this._buildsSelected}
        builds={this.state.builds}
      />
    );
  }

  /**
   * Update selected builds with new list
   * @param  {Array} newBuilds List of new builds
   */
  _buildsSelected(newBuilds) {
    this.context.hideModal();
    let builds = [];

    for (let b of newBuilds) {
      builds.push(this._createBuild(b.id, b.buildName));
    }

    this.setState({ builds, saved: false });
  }

  /**
   * Toggle facet display
   * @param  {string} facet Facet / Ship Property
   */
  _toggleFacet(facet) {
    facet.active = !facet.active;
    this.setState({ facets: [].concat(this.state.facets), saved: false });
  }

  /**
   * Handle facet drag
   * @param  {Event} e Drag Event
   */
  _facetDrag(e) {
    this.nodeAfter = false;
    this.dragged = e.currentTarget;
    let placeholder = (this.placeholder = document.createElement('li'));
    placeholder.style.width = Math.round(this.dragged.offsetWidth) + 'px';
    placeholder.className = 'facet-placeholder';
    if (!browser || (browser.name !== 'edge' && browser.name !== 'ie')) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.currentTarget);
    }
  }

  /**
   * Handle facet drop
   * @param  {Event} e Drop Event
   */
  _facetDrop(e) {
    this.dragged.parentNode.removeChild(this.placeholder);
    let facets = this.state.facets;
    let frm = Number(this.dragged.dataset.i);
    let to = Number(this.over.dataset.i);

    if (frm < to) {
      to--;
    }
    if (this.nodeAfter) {
      to++;
    }

    facets.splice(to, 0, facets.splice(frm, 1)[0]);
    this.dragged.style.display = null;
    this.setState({ facets: [].concat(facets), saved: false });
  }

  /**
   * Handle facet drag over
   * @param  {Event} e Drag over Event
   */
  _facetDragOver(e) {
    e.preventDefault();

    if (e.target.className == 'facet-placeholder') {
      return;
    } else if (e.target != e.currentTarget) {
      this.over = e.target;
      this.dragged.style.display = 'none';
      let relX = e.clientX - this.over.getBoundingClientRect().left;
      let width = this.over.offsetWidth / 2;
      let parent = e.target.parentNode;

      if (parent == e.currentTarget) {
        if (relX > width && this.dragged != e.target) {
          this.nodeAfter = true;
          parent.insertBefore(this.placeholder, e.target.nextElementSibling);
        } else {
          this.nodeAfter = false;
          parent.insertBefore(this.placeholder, e.target);
        }
      }
    }
  }
  /**
   * Handle name change and update state
   * @param  {SyntheticEvent} e Event
   */
  _onNameChange(e) {
    this.setState({ newName: e.target.value, saved: false });
  }

  /**
   * Delete the current comparison
   */
  _delete() {
    Persist.deleteComparison(this.state.name);
    Router.go('/compare');
  }

  /**
   * Import the comparison builds
   */
  _import() {
    let builds = {};

    for (let ship of this.state.builds) {
      if (!builds[ship.id]) {
        builds[ship.id] = {};
      }
      builds[ship.id][ship.buildName] = ship.toString();
    }

    this.context.showModal(<ModalImport builds={builds} />);
  }

  /**
   * Save the current comparison
   */
  _save() {
    let { newName, builds, facets } = this.state;
    let selectedFacets = [];

    facets.forEach(f => {
      if (f.active) {
        selectedFacets.unshift(f.i);
      }
    });

    Persist.saveComparison(newName, builds, selectedFacets);
    Router.replace(`/compare/${encodeURIComponent(this.state.newName)}`);
    this.setState({ name: newName, saved: true });
  }

  /**
   * Serialize and generate a long URL for the current comparison
   * @return {string} URL for serialized comparison
   */
  _buildUrl() {
    let { facets, builds, name, predicate, desc } = this.state;
    let selectedFacets = [];

    for (let f of facets) {
      if (f.active) {
        selectedFacets.unshift(f.i);
      }
    }

    let code = fromComparison(name, builds, selectedFacets, predicate, desc);
    let loc = window.location;
    return (
      loc.protocol +
      '//' +
      loc.host +
      '/comparison?code=' +
      encodeURIComponent(code)
    );
  }

  /**
   * Generates the long permalink URL
   */
  _genPermalink() {
    this.context.showModal(<ModalPermalink url={this._buildUrl()} />);
  }

  /**
   * Generate E:D Forum BBCode and show in the export modal
   */
  _genBBcode() {
    let { translate, formats } = this.context.language;
    let { facets, builds } = this.state;

    let generator = callback => {
      let url = this._buildUrl();
      ShortenUrl(
        url,
        shortenedUrl =>
          callback(
            comparisonBBCode(translate, formats, facets, builds, shortenedUrl)
          ),
        error =>
          callback(comparisonBBCode(translate, formats, facets, builds, url))
      );
    };

    this.context.showModal(
      <ModalExport
        title={translate('forum') + ' BBCode'}
        generator={generator}
      />
    );
  }

  /**
   * Update dimenions from rendered DOM
   */
  _updateDimensions() {
    this.setState({
      chartWidth: this.chartRef.offsetWidth
    });
  }

  /**
   * Update all ship costs on disount change
   */
  _updateDiscounts() {
    let shipDiscount = Persist.getShipDiscount();
    let moduleDiscount = Persist.getModuleDiscount();
    let builds = [];

    for (let b of this.state.builds) {
      builds.push(b.applyDiscounts(shipDiscount, moduleDiscount));
    }

    this.setState({ builds });
  }

  /**
   * Update state based on context changes
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextContext Incoming/Next conext
   */
  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    if (this.context.route !== nextContext.route) {
      // Only reinit state if the route has changed
      this.setState(this._initState(nextContext));
    }
  }

  /**
   * Add listeners when about to mount
   */
  UNSAFE_componentWillMount() {
    this.resizeListener = this.context.onWindowResize(this._updateDimensions);
    this.persistListener = Persist.addListener(
      'discounts',
      this._updateDiscounts
    );
  }

  /**
   * Trigger DOM updates on mount
   */
  componentDidMount() {
    this._updateDimensions();
  }

  /**
   * Remove listeners on unmount
   */
  componentWillUnmount() {
    this.resizeListener.remove();
    this.persistListener.remove();
  }

  /**
   * Render the Page
   * @return {React.Component} The page contents
   */
  renderPage() {
    let translate = this.context.language.translate;
    let compareHeader;
    let {
      newName,
      name,
      saved,
      builds,
      facets,
      predicate,
      desc,
      chartWidth
    } = this.state;

    if (this.state.compareMode) {
      compareHeader = (
        <tr>
          <td className="head">{translate('comparison')}</td>
          <td>
            <input
              value={newName}
              onChange={this._onNameChange}
              placeholder={translate('Enter Name')}
              maxLength="50"
            />
            <button
              onClick={this._save}
              disabled={!newName || newName == 'all' || saved}
            >
              <FloppyDisk className="lg" />
              <span className="button-lbl">{translate('save')}</span>
            </button>
            <button onClick={this._delete} disabled={name == 'all' || !saved}>
              <Bin className="lg warning" />
            </button>
            <button onClick={this._selectBuilds}>
              <Rocket className="lg" />
              <span className="button-lbl">{translate('builds')}</span>
            </button>
            <button
              className="r"
              onClick={this._genPermalink}
              disabled={builds.length == 0}
            >
              <LinkIcon className="lg" />
              <span className="button-lbl">{translate('permalink')}</span>
            </button>
            <button
              className="r"
              onClick={this._genBBcode}
              disabled={builds.length == 0}
            >
              <Embed className="lg" />
              <span className="button-lbl">{translate('forum')}</span>
            </button>
          </td>
        </tr>
      );
    } else {
      compareHeader = (
        <tr>
          <td className="head">{translate('comparison')}</td>
          <td>
            <h3>{name}</h3>
            <button className="r" onClick={this._import}>
              <Download className="lg" />
              {translate('import')}
            </button>
          </td>
        </tr>
      );
    }

    return (
      <div
        className={'page'}
        style={{ fontSize: this.context.sizeRatio + 'em' }}
      >
        <table id="comparison">
          <tbody>
            {compareHeader}
            <tr key="facets">
              <td className="head">{translate('compare')}</td>
              <td>
                <ul id="facet-container" onDragOver={this._facetDragOver}>
                  {facets.map((f, i) => (
                    <li
                      key={f.title}
                      data-i={i}
                      draggable="true"
                      onDragStart={this._facetDrag}
                      onDragEnd={this._facetDrop}
                      className={cn('facet', { active: f.active })}
                      onClick={this._toggleFacet.bind(this, f)}
                    >
                      {'↔  ' + translate(f.title)}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          </tbody>
        </table>

        <ComparisonTable
          builds={builds}
          facets={facets}
          onSort={this._sortShips}
          predicate={predicate}
          desc={desc}
        />

        {!builds.length ? (
          <div className="chart" ref={node => (this.chartRef = node)}>
            {translate('PHRASE_NO_BUILDS')}
          </div>
        ) : (
          facets.filter(f => f.active).map((f, i) => (
            <div
              key={f.title}
              className="chart"
              ref={i == 0 ? node => (this.chartRef = node) : null}
            >
              <h3
                className="ptr"
                onClick={this._sortShips.bind(this, f.props[0])}
              >
                {translate(f.title)}
              </h3>
              <BarChart
                width={chartWidth}
                data={builds}
                properties={f.props}
                labels={f.lbls}
                unit={translate(f.unit)}
                format={f.fmt}
                title={translate(f.title)}
                predicate={predicate}
                desc={desc}
              />
            </div>
          ))
        )}
      </div>
    );
  }
}
