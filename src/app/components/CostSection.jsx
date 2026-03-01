import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { Ships } from 'coriolis-data/dist';
import Persist from '../stores/Persist';
import Ship from '../shipyard/Ship';
import { Insurance } from '../shipyard/Constants';
import { slotName, slotComparator } from '../utils/SlotFunctions';
import TranslatedComponent from './TranslatedComponent';
import { ShoppingIcon } from '../components/SvgIcons';

/**
 * Cost Section
 */
export default class CostSection extends TranslatedComponent {
  static propTypes = {
    ship: PropTypes.object.isRequired,
    code: PropTypes.string.isRequired,
    buildName: PropTypes.string
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);
    this._costsTab = this._costsTab.bind(this);
    this._sortCost = this._sortCost.bind(this);
    this._sortAmmo = this._sortAmmo.bind(this);
    this._sortRetrofit = this._sortRetrofit.bind(this);
    this._buildRetrofitShip = this._buildRetrofitShip.bind(this);
    this._onBaseRetrofitChange = this._onBaseRetrofitChange.bind(this);
    this._defaultRetrofitName = this._defaultRetrofitName.bind(this);
    this._eddbShoppingList = this._inaraShoppingList.bind(this);

    let data = Ships[props.ship.id];   // Retrieve the basic ship properties, slots and defaults
    let retrofitName = this._defaultRetrofitName(props.ship.id, props.buildName);
    let retrofitShip = this._buildRetrofitShip(props.ship.id, retrofitName);
    let shipDiscount = Persist.getShipDiscount();
    let moduleDiscount = Persist.getModuleDiscount();

    this.props.ship.applyDiscounts(shipDiscount, moduleDiscount);
    retrofitShip.applyDiscounts(shipDiscount, moduleDiscount);

    this.state = {
      retrofitShip,
      retrofitName,
      shipDiscount,
      moduleDiscount,
      insurance: Insurance[Persist.getInsurance()],
      tab: Persist.getCostTab(),
      buildOptions: Persist.getBuildsNamesFor(props.ship.id),
      ammoPredicate: 'cr',
      ammoDesc: true,
      costPredicate: 'cr',
      costDesc: true,
      retroPredicate: 'cr',
      retroDesc: true
    };
  }

  /**
   * Create a ship instance to base/reference retrofit changes from
   * @param  {string} shipId       Ship Id
   * @param  {string} name         Build name
   * @param  {Ship} retrofitShip   Existing retrofit ship
   * @return {Ship}                Retrofit ship
   */
  _buildRetrofitShip(shipId, name, retrofitShip) {
    let data = Ships[shipId];   // Retrieve the basic ship properties, slots and defaults

    if (!retrofitShip) {  // Don't create a new instance unless needed
      retrofitShip = new Ship(shipId, data.properties, data.slots);  // Create a new Ship for retrofit comparison
    }

    if (Persist.hasBuild(shipId, name)) {
      retrofitShip.buildFrom(Persist.getBuild(shipId, name));  // Populate modules from existing build
    } else {
      retrofitShip.buildWith(data.defaults);  // Populate with default components
    }
    return retrofitShip;
  }

  /**
   * Get the default retrofit build name if it exists
   * @param  {string} shipId       Ship Id
   * @param  {string} name         Build name
   * @return {string}              Build name or null
   */
  _defaultRetrofitName(shipId, name) {
    return Persist.hasBuild(shipId, name) ? name : null;
  }

  /**
   * Show selected tab
   * @param  {string} tab Tab name
   */
  _showTab(tab) {
    Persist.setCostTab(tab);
    this.setState({ tab });
  }

  /**
   * Update prices on discount change
   */
  _onDiscountChanged() {
    let shipDiscount = Persist.getShipDiscount();
    let moduleDiscount = Persist.getModuleDiscount();
    this.props.ship.applyDiscounts(shipDiscount, moduleDiscount);
    this.state.retrofitShip.applyDiscounts(shipDiscount, moduleDiscount);
    this._updateRetrofit(this.props.ship, this.state.retrofitShip);
    this.setState({ shipDiscount, moduleDiscount });
  }

  /**
   * Update insurance on change
   * @param  {string} insuranceName Insurance level name
   */
  _onInsuranceChanged(insuranceName) {
    this.setState({ insurance: Insurance[insuranceName] });
  }

  /**
   * Repopulate modules on retrofit ship from existing build
   * @param  {SyntheticEvent} event Build name to base the retrofit ship on
   */
  _onBaseRetrofitChange(event) {
    let retrofitName = event.target.value;
    let ship = this.props.ship;

    if (retrofitName) {
      this.state.retrofitShip.buildFrom(Persist.getBuild(ship.id, retrofitName));
    } else {
      this.state.retrofitShip.buildWith(Ships[ship.id].defaults);  // Retrofit ship becomes stock build
    }
    this._updateRetrofit(ship, this.state.retrofitShip);
    this.setState({ retrofitName });
  }

  /**
   * On builds changed check to see if the retrofit ship needs
   * to be updated
   */
  _onBuildsChanged() {
    let update = false;
    let ship = this.props.ship;
    let { retrofitName, retrofitShip } = this.state;

    if(!Persist.hasBuild(ship.id, retrofitName)) {
      retrofitShip.buildWith(Ships[ship.id].defaults);  // Retrofit ship becomes stock build
      this.setState({ retrofitName: null });
      update = true;
    } else if (Persist.getBuild(ship.id, retrofitName) != retrofitShip.toString()) {
      retrofitShip.buildFrom(Persist.getBuild(ship.id, retrofitName));  // Repopulate modules from saved build
      update = true;
    }

    if (update) { // Update retrofit comparison
      this._updateRetrofit(ship, retrofitShip);
    }
    // Update list of retrofit base build options
    this.setState({ buildOptions: Persist.getBuildsNamesFor(ship.id) });
  }

  /**
   * Toggle item cost inclusion in overall total
   * @param  {Object} item Cost item
   */
  _toggleCost(item) {
    this.props.ship.setCostIncluded(item, !item.incCost);
    this.forceUpdate();
  }

  /**
   * Toggle item cost inclusion in retrofit total
   * @param  {Object} item Cost item
   */
  _toggleRetrofitCost(item) {
    let retrofitTotal = this.state.retrofitTotal;
    item.retroItem.incCost = !item.retroItem.incCost;
    retrofitTotal += item.netCost * (item.retroItem.incCost ? 1 : -1);
    this.setState({ retrofitTotal });
  }

  /**
   * Set cost list sort predicate
   * @param  {string} predicate sort predicate
   */
  _sortCostBy(predicate) {
    let { costPredicate, costDesc } = this.state;

    if (costPredicate == predicate) {
      costDesc = !costDesc;
    }

    this.setState({ costPredicate: predicate, costDesc });
  }

  /**
   * Sort cost list
   * @param  {Ship} ship        Ship instance
   * @param  {string} predicate Sort predicate
   * @param  {Boolean} desc     Sort descending
   */
  _sortCost(ship, predicate, desc) {
    let costList = ship.costList;
    let translate = this.context.language.translate;

    if (predicate == 'm') {
      costList.sort(slotComparator(translate, null, desc));
    } else {
      costList.sort(slotComparator(translate, (a, b) => (a.m.cost || 0) - (b.m.cost || 0), desc));
    }
  }

  /**
   * Set ammo list sort predicate
   * @param  {string} predicate sort predicate
   */
  _sortAmmoBy(predicate) {
    let { ammoPredicate, ammoDesc } = this.state;

    if (ammoPredicate == predicate) {
      ammoDesc = !ammoDesc;
    }

    this.setState({ ammoPredicate: predicate, ammoDesc });
  }

  /**
   * Sort ammo cost list
   * @param  {Array} ammoCosts  Ammo cost list
   * @param  {string} predicate Sort predicate
   * @param  {Boolean} desc     Sort descending
   */
  _sortAmmo(ammoCosts, predicate, desc) {
    let translate = this.context.language.translate;

    if (predicate == 'm') {
      ammoCosts.sort(slotComparator(translate, null, desc));
    } else {
      ammoCosts.sort(slotComparator(translate, (a, b) => a[predicate] - b[predicate], desc));
    }
  }

  /**
   * Set retrofit list sort predicate
   * @param  {string} predicate sort predicate
   */
  _sortRetrofitBy(predicate) {
    let { retroPredicate, retroDesc } = this.state;

    if (retroPredicate == predicate) {
      retroDesc = !retroDesc;
    }

    this.setState({ retroPredicate: predicate, retroDesc });
  }

  /**
   * Sort retrofit cost list
   * @param  {Array} retrofitCosts  Retrofit cost list
   * @param  {string} predicate     Sort predicate
   * @param  {Boolean} desc         Sort descending
   */
  _sortRetrofit(retrofitCosts, predicate, desc) {
    let translate = this.context.language.translate;

    if (predicate == 'cr') {
      retrofitCosts.sort((a, b) => a.netCost - b.netCost);
    } else {
      retrofitCosts.sort((a , b) => (a[predicate] ? translate(a[predicate]).toLowerCase() : '').localeCompare(b[predicate] ? translate(b[predicate]).toLowerCase() : ''));
    }

    if (!desc) {
      retrofitCosts.reverse();
    }
  }

  /**
   * Render the cost tab
   * @return {React.Component} Tab contents
   */
  _costsTab() {
    let { ship } = this.props;
    let { shipDiscount, moduleDiscount, insurance } = this.state;
    let { translate, formats, units } = this.context.language;
    let rows = [];

    for (let i = 0, l = ship.costList.length; i < l; i++) {
      let item = ship.costList[i];
      if (item.m && item.m.cost) {
        let toggle = this._toggleCost.bind(this, item);
        rows.push(<tr key={i} className={cn('highlight', { disabled: !item.incCost })}>
          <td className='ptr' style={{ width: '1em' }} onClick={toggle}>{item.m.class + item.m.rating}</td>
          <td className='le ptr shorten cap' onClick={toggle}>{slotName(translate, item)}</td>
          <td className='ri ptr' onClick={toggle}>{formats.int(item.discountedCost)}{units.CR}</td>
        </tr>);
      }
    }

    return <div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr className='main'>
            <th colSpan='2' className='sortable le' onClick={this._sortCostBy.bind(this,'m')}>
              {translate('module')}
              {shipDiscount ? <u className='cap optional-hide' style={{ marginLeft: '0.5em' }}>{`[${translate('ship')} ${formats.pct(-1 * shipDiscount)}]`}</u> : null}
              {moduleDiscount ? <u className='cap optional-hide' style={{ marginLeft: '0.5em' }}>{`[${translate('modules')} ${formats.pct(-1 * moduleDiscount)}]`}</u> : null}
            </th>
            <th className='sortable le' onClick={this._sortCostBy.bind(this, 'cr')} >{translate('credits')}</th>
          </tr>
        </thead>
        <tbody>
          {rows}
          <tr className='ri'>
            <td colSpan='2' className='lbl' >{translate('total')}</td>
            <td className='val'>{formats.int(ship.totalCost)}{units.CR}</td>
          </tr>
          <tr className='ri'>
            <td colSpan='2' className='lbl'>{translate('insurance')}</td>
            <td className='val'>{formats.int(ship.totalCost * insurance)}{units.CR}</td>
          </tr>
        </tbody>
      </table>
    </div>;
  }

  /**
   * Open up a window for inara with a shopping list of our retrofit components
   */
  _inaraShoppingList() {
    const { retrofitCosts } = this.state;
    const { ship } = this.props;

    // Provide unique list of non-PP module EDDB IDs to buy
    const modIds = retrofitCosts.filter(item => item.retroItem.incCost && item.buyId && !item.buyPp).map(item => item.buyId).filter((v, i, a) => a.indexOf(v) === i);

    // Open up the relevant URL
    window.open('https://inara.cz/inapi/corisearch.php?m=' + modIds.join(','));
  }

  /**
   * Render the retofit tab
   * @return {React.Component} Tab contents
   */
  _retrofitTab() {
    let { retrofitTotal, retrofitCosts, moduleDiscount, retrofitName } = this.state;
    const { termtip, tooltip } = this.context;
    let { translate, formats, units } = this.context.language;
    let int = formats.int;
    let rows = [], options = [<option key='stock' value=''>{translate('Stock')}</option>];

    for (let opt of this.state.buildOptions) {
      options.push(<option key={opt} value={opt}>{opt}</option>);
    }

    if (retrofitCosts.length) {
      for (let i = 0, l = retrofitCosts.length; i < l; i++) {
        let item = retrofitCosts[i];
        rows.push(<tr key={i} className={cn('highlight', { disabled: !item.retroItem.incCost })} onClick={this._toggleRetrofitCost.bind(this, item)}>
          <td className='ptr' style={{ width: '1em' }}>{item.sellClassRating}</td>
          <td className='le ptr shorten cap'>{translate(item.sellName)}</td>
          <td className='ptr' style={{ width: '1em' }}>{item.buyClassRating}</td>
          <td className='le ptr shorten cap'>{translate(item.buyName)}</td>
          <td colSpan='2' className={cn('ri ptr', item.retroItem.incCost ? item.netCost > 0 ? 'warning' : 'secondary-disabled' : 'disabled')}>{int(item.netCost)}{units.CR}</td>
        </tr>);
      }
    } else {
      rows = <tr><td colSpan='7' style={{ padding: '3em 0' }}>{translate('PHRASE_NO_RETROCH')}</td></tr>;
    }

    return <div>
      <div className='scroll-x'>
        <table style={{ width: '100%' }}>
          <thead>
            <tr className='main'>
              <th colSpan='2' className='sortable le' onClick={this._sortRetrofitBy.bind(this, 'sellName')}>{translate('sell')}</th>
              <th colSpan='2' className='sortable le' onClick={this._sortRetrofitBy.bind(this, 'buyName')}>{translate('buy')}</th>
              <th colSpan='2' className='sortable le' onClick={this._sortRetrofitBy.bind(this, 'cr')}>
                {translate('net cost')}
                {moduleDiscount ? <u className='cap optional-hide' style={{ marginLeft: '0.5em' }}>{`[${translate('modules')} -${formats.pct(moduleDiscount)}]`}</u> : null}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows}
            <tr className='ri'>
              <td className='lbl' ><button onClick={this._inaraShoppingList} onMouseOver={termtip.bind(null, 'PHRASE_REFIT_SHOPPING_LIST')} onMouseOut={tooltip.bind(null, null)}><ShoppingIcon className='lg' style={{ fill: 'black' }}/></button></td>
              <td colSpan='3' className='lbl' >{translate('cost')}</td>
              <td colSpan='2' className={cn('val', retrofitTotal > 0 ? 'warning' : 'secondary-disabled')} style={{ borderBottom:'none' }}>
                {int(retrofitTotal)}{units.CR}
              </td>
            </tr>
            <tr className='ri'>
              <td colSpan='4' className='lbl cap' >{translate('retrofit from')}</td>
              <td className='val cen' style={{ borderRight: 'none', width: '1em' }}><u className='primary-disabled'>&#9662;</u></td>
              <td className='val' style={{ borderLeft:'none', padding: 0 }}>
                <select style={{ width: '100%', padding: 0 }} value={retrofitName || translate('Stock')} onChange={this._onBaseRetrofitChange}>
                  {options}
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>;
  }


  /**
   * Update retrofit costs
   * @param  {Ship} ship          Ship instance
   * @param  {Ship} retrofitShip  Retrofit Ship instance
   */
  _updateRetrofit(ship, retrofitShip) {
    let retrofitCosts = [];
    let retrofitTotal = 0, i, l, item;

    if (ship.bulkheads.m.index != retrofitShip.bulkheads.m.index) {
      item = {
        buyClassRating: ship.bulkheads.m.class + ship.bulkheads.m.rating,
        buyId: ship.bulkheads.m.eddbID,
        buyPp: ship.bulkheads.m.pp,
        buyName: ship.bulkheads.m.name,
        sellClassRating: retrofitShip.bulkheads.m.class + retrofitShip.bulkheads.m.rating,
        sellName: retrofitShip.bulkheads.m.name,
        netCost: ship.bulkheads.discountedCost - retrofitShip.bulkheads.discountedCost,
        retroItem: retrofitShip.bulkheads
      };
      retrofitCosts.push(item);
      if (retrofitShip.bulkheads.incCost) {
        retrofitTotal += item.netCost;
      }
    }

    for (let g in { standard: 1, internal: 1, hardpoints: 1 }) {
      let retroSlotGroup = retrofitShip[g];
      let slotGroup = ship[g];
      for (i = 0, l = slotGroup.length; i < l; i++) {
        const modId = slotGroup[i].m ? slotGroup[i].m.eddbID : null;
        const retroModId = retroSlotGroup[i].m ? retroSlotGroup[i].m.eddbID : null;
        if (modId != retroModId) {
          item = { netCost: 0, retroItem: retroSlotGroup[i] };
          if (slotGroup[i].m) {
            item.buyId = slotGroup[i].m.eddbID,
            item.buyPp = slotGroup[i].m.pp,
            item.buyName = slotGroup[i].m.name || slotGroup[i].m.grp;
            item.buyClassRating = slotGroup[i].m.class + slotGroup[i].m.rating;
            item.netCost = slotGroup[i].discountedCost;
          }
          if (retroSlotGroup[i].m) {
            item.sellName = retroSlotGroup[i].m.name || retroSlotGroup[i].m.grp;
            item.sellClassRating = retroSlotGroup[i].m.class + retroSlotGroup[i].m.rating;
            item.netCost -= retroSlotGroup[i].discountedCost;
          }
          retrofitCosts.push(item);
          if (retroSlotGroup[i].incCost) {
            retrofitTotal += item.netCost;
          }
        }
      }
    }

    this.setState({ retrofitCosts, retrofitTotal });
    this._sortRetrofit(retrofitCosts, this.state.retroPredicate, this.state.retroDesc);
  }

  /**
   * Render the ammo tab
   * @return {React.Component} Tab contents
   */
  _ammoTab() {
    let { ammoTotal, ammoCosts } = this.state;
    let { translate, formats, units } = this.context.language;
    let int = formats.int;
    let rows = [];

    for (let i = 0, l = ammoCosts.length; i < l; i++) {
      let item = ammoCosts[i];
      rows.push(<tr key={i} className='highlight'>
        <td style={{ width: '1em' }}>{item.m.class + item.m.rating}</td>
        <td className='le shorten cap'>{slotName(translate, item)}</td>
        <td className='ri'>{int(item.max)}</td>
        <td className='ri'>{int(item.cost)}{units.CR}</td>
        <td className='ri'>{int(item.total)}{units.CR}</td>
      </tr>);
    }

    return <div>
      <div className='scroll-x' >
        <table style={{ width: '100%' }}>
          <thead>
            <tr className='main'>
              <th colSpan='2' className='sortable le' onClick={this._sortAmmoBy.bind(this, 'm')} >{translate('module')}</th>
              <th colSpan='1' className='sortable le' onClick={this._sortAmmoBy.bind(this, 'max')} >{translate('qty')}</th>
              <th colSpan='1' className='sortable le' onClick={this._sortAmmoBy.bind(this, 'cost')} >{translate('unit cost')}</th>
              <th className='sortable le' onClick={this._sortAmmoBy.bind(this, 'total')}>{translate('subtotal')}</th>
            </tr>
          </thead>
          <tbody>
            {rows}
            <tr className='ri'>
              <td colSpan='4' className='lbl' >{translate('total')}</td>
              <td className='val'>{int(ammoTotal)}{units.CR}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>;
  }

  /**
   * Recalculate all ammo costs
   * @param  {Ship} ship  Ship instance
   */
  _updateAmmoCosts(ship) {
    let ammoCosts = [], ammoTotal = 0, item, q, limpets = 0, srvs = 0, scoop = false;

    for (let g in { standard: 1, internal: 1, hardpoints: 1 }) {
      let slotGroup = ship[g];
      for (let i = 0, l = slotGroup.length; i < l; i++) {
        if (slotGroup[i].m) {
          // Special cases needed for SCB, AFMU, and limpet controllers since they don't use standard ammo/clip
          q = 0;
          switch (slotGroup[i].m.grp) {
            case 'fs': // Skip fuel calculation if scoop present
              scoop = true;
              break;
            case 'scb':
              q = slotGroup[i].m.getAmmo() + 1;
              break;
            case 'am':
              q = slotGroup[i].m.getAmmo();
              break;
            case 'pv':
              srvs += slotGroup[i].m.getBays();
              break;
            case 'fx': case 'hb': case 'cc': case 'pc':
              limpets = ship.cargoCapacity;
              break;
            default:
              q = slotGroup[i].m.getClip() + slotGroup[i].m.getAmmo();
          }
          // Calculate ammo costs only if a cost is specified
          if (slotGroup[i].m.ammocost > 0) {
            item = {
              m: slotGroup[i].m,
              max: q,
              cost: slotGroup[i].m.ammocost,
              total: q * slotGroup[i].m.ammocost
            };
            ammoCosts.push(item);
            ammoTotal += item.total;
          }
          // Add fighters
          if (slotGroup[i].m.grp === 'fh') {
            item = {
              m: slotGroup[i].m,
              max: slotGroup[i].m.getRebuildsPerBay() * slotGroup[i].m.getBays(),
              cost: slotGroup[i].m.fightercost,
              total: slotGroup[i].m.getRebuildsPerBay() * slotGroup[i].m.getBays() * slotGroup[i].m.fightercost
            };
            ammoCosts.push(item);
            ammoTotal += item.total;
          }
        }
      }
    }

    // Limpets if controllers exist and cargo space available
    if (limpets > 0) {
      item = {
        m: { name: 'limpets', class: '', rating: '' },
        max: ship.cargoCapacity,
        cost: 101,
        total: ship.cargoCapacity * 101
      };
      ammoCosts.push(item);
      ammoTotal += item.total;
    }

    if (srvs > 0) {
      item = {
        m: { name: 'SRVs', class: '', rating: '' },
        max: srvs,
        cost: 1030,
        total: srvs * 1030
      };
      ammoCosts.push(item);
      ammoTotal += item.total;
    }

    // Calculate refuel costs if no scoop present
    if (!scoop) {
      item = {
        m: { name: 'fuel', class: '', rating: '' },
        max: ship.fuelCapacity,
        cost: 50,
        total: ship.fuelCapacity * 50
      };
      ammoCosts.push(item);
      ammoTotal += item.total;
    }

    this.setState({ ammoTotal, ammoCosts });
    this._sortAmmo(ammoCosts, this.state.ammoPredicate, this.state.ammoDesc);
  }

  /**
   * Add listeners on mount and update costs
   */
  UNSAFE_componentWillMount() {
    this.listeners = [
      Persist.addListener('discounts', this._onDiscountChanged.bind(this)),
      Persist.addListener('insurance', this._onInsuranceChanged.bind(this)),
      Persist.addListener('builds', this._onBuildsChanged.bind(this)),
    ];
    this._updateAmmoCosts(this.props.ship);
    this._updateRetrofit(this.props.ship, this.state.retrofitShip);
    this._sortCost(this.props.ship);
  }

  /**
   * Update state based on property and context changes
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextContext Incoming/Next context
   */
  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    let retrofitShip = this.state.retrofitShip;

    if (nextProps.ship != this.props.ship) { // Ship has changed
      let nextId = nextProps.ship.id;
      let retrofitName = this._defaultRetrofitName(nextId, nextProps.buildName);
      retrofitShip = this._buildRetrofitShip(nextId, retrofitName, nextId == this.props.ship.id ? retrofitShip : null);
      this.setState({
        retrofitShip,
        retrofitName,
        buildOptions: Persist.getBuildsNamesFor(nextId)
      });
    }

    if (nextProps.ship != this.props.ship || nextProps.code != this.props.code) {
      nextProps.ship.applyDiscounts(Persist.getShipDiscount(), Persist.getModuleDiscount());
      this._updateAmmoCosts(nextProps.ship);
      this._updateRetrofit(nextProps.ship, retrofitShip);
      this._sortCost(nextProps.ship);
    }
  }

  /**
   * Sort lists before render
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextState Incoming/Next state
   */
  UNSAFE_componentWillUpdate(nextProps, nextState) {
    let state = this.state;

    switch (nextState.tab) {
      case 'ammo':
        if (state.ammoPredicate != nextState.ammoPredicate || state.ammoDesc != nextState.ammoDesc) {
          this._sortAmmo(nextState.ammoCosts, nextState.ammoPredicate, nextState.ammoDesc);
        }
        break;
      case 'retrofit':
        if (state.retroPredicate != nextState.retroPredicate || state.retroDesc != nextState.retroDesc) {
          this._sortRetrofit(nextState.retrofitCosts, nextState.retroPredicate, nextState.retroDesc);
        }
        break;
      default:
        if (state.costPredicate != nextState.costPredicate || state.costDesc != nextState.costDesc) {
          this._sortCost(nextProps.ship, nextState.costPredicate, nextState.costDesc);
        }
    }
  }

  /**
   * Remove listeners
   */
  componentWillUnmount() {
    this.listeners.forEach(l => l.remove());
  }

  /**
   * Render the Cost section
   * @return {React.Component} Contents
   */
  render() {
    let tab = this.state.tab;
    let translate = this.context.language.translate;
    let tabSection;

    switch (tab) {
      case 'ammo': tabSection = this._ammoTab(); break;
      case 'retrofit': tabSection = this._retrofitTab(); break;
      default:
        tab = 'costs';
        tabSection = this._costsTab();
    }

    return (
      <div className='group half'>
        <table className='tabs'>
          <thead>
            <tr>
              <th style={{ width:'33%' }} className={cn({ active: tab == 'costs' })} onClick={this._showTab.bind(this, 'costs')} >{translate('costs')}</th>
              <th style={{ width:'33%' }} className={cn({ active: tab == 'retrofit' })} onClick={this._showTab.bind(this, 'retrofit')} >{translate('retrofit costs')}</th>
              <th style={{ width:'34%' }} className={cn({ active: tab == 'ammo' })} onClick={this._showTab.bind(this, 'ammo')} >{translate('reload costs')}</th>
            </tr>
          </thead>
        </table>
        {tabSection}
      </div>
    );
  }
}
