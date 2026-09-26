import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import cn from 'classnames';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import AvailableModulesMenu from './AvailableModulesMenu';
import { diffDetails } from '../utils/SlotFunctions';
import Persist from '../stores/Persist';
import { Reload } from './SvgIcons';

// Category mappings from AvailableModulesMenu
const GRPCAT = {
  'sg': 'shields',
  'bsg': 'shields',
  'psg': 'shields',
  'scb': 'shields',
  'cr': 'cargo racks',
  'crl': 'cargo racks',
  'cc': 'limpet controllers',
  'fx': 'limpet controllers',
  'hb': 'limpet controllers',
  'mlc': 'limpet controllers',
  'pc': 'limpet controllers',
  'rpl': 'limpet controllers',
  'pce': 'passenger cabins',
  'pci': 'passenger cabins',
  'pcm': 'passenger cabins',
  'pcq': 'passenger cabins',
  'fh': 'hangars',
  'fhmkii': 'hangars',
  'pv': 'hangars',
  'fs': 'fuel',
  'ft': 'fuel',
  'hr': 'structural reinforcement',
  'mrp': 'structural reinforcement',
  'bl': 'lasers',
  'pl': 'lasers',
  'ul': 'lasers',
  'ml': 'lasers',
  'c': 'projectiles',
  'mc': 'projectiles',
  'advmc': 'projectiles',
  'axmc': 'experimental',
  'axmce': 'experimental',
  'ntp': 'experimental',
  'fc': 'projectiles',
  'rfl': 'experimental',
  'pa': 'projectiles',
  'rg': 'projectiles',
  'mr': 'ordnance',
  'amr': 'ordnance',
  'axmr': 'experimental',
  'axmre': 'experimental',
  'rcpl': 'experimental',
  'dtl': 'experimental',
  'tbsc': 'experimental',
  'tbem': 'experimental',
  'tbrfl': 'experimental',
  'mahr': 'experimental',
  'rsl': 'experimental',
  'tp': 'ordnance',
  'nl': 'ordnance',
  'sc': 'scanners',
  'ss': 'scanners',
  'cs': 'scanners',
  'kw': 'scanners',
  'ws': 'scanners',
  'xs': 'scanners',
  'sb': 'defence',
  'ch': 'defence',
  'po': 'defence',
  'ec': 'defence',
  'sfn': 'defence',
  'hs': 'system',
  'csl': 'system',
  'gpp': 'guardian',
  'gpc': 'guardian',
  'gsrp': 'guardian',
  'ggc': 'guardian',
  'gfsb': 'guardian',
  'gmrp': 'guardian',
  'gsc': 'guardian',
  'ghrp': 'guardian',
  'scl': 'mining',
  'pwa': 'mining',
  'sdm': 'mining',
  'mvr': 'mining',
  'abl': 'mining',
  'dc': 'flight assists',
  'sua': 'flight assists',
  'pas': 'flight assists',
  'ews': 'weapon stabilizers',
};

const INTCAT = {
  'auto field-maintenance unit': ['am'],
  'cargo racks': ['cr', 'crl'],
  'fsd interdictor': ['fi'],
  'fuel': ['ft', 'fs'],
  'hangars': ['fh', 'fhmkii', 'pv'],
  'limpet controllers': ['cc', 'fx', 'hb', 'pc', 'rpl', 'mlc'],
  'passenger cabins': ['pce', 'pci', 'pcm', 'pcq'],
  'refineries': ['rf'],
  'shields': ['sg', 'bsg', 'psg', 'scb'],
  'structural reinforcement': ['hr', 'mrp'],
  'flight assists': ['dc', 'sua', 'pas'],
  'scanners': ['ss'],
  'experimental': ['rcpl', 'dtl', 'mahr', 'rsl'],
  'weapon stabilizers': ['ews'],
  'guardian': ['gsrp', 'gfsb', 'ghrp', 'gmrp'],
};

const HPTCAT = {
  'lasers': ['pl', 'ul', 'bl'],
  'projectiles': ['mc', 'advmc', 'c', 'fc', 'pa', 'rg'],
  'ordnance': ['mr', 'amr', 'tp', 'nl'],
  'experimental': ['axmc', 'axmce', 'axmr', 'axmre', 'ntp','rfl', 'tbrfl', 'tbsc', 'tbem', 'xs', 'sfn'],
  'guardian': ['gpc', 'ggc', 'gsc'],
  'mining': ['ml', 'scl', 'sdm', 'abl', 'mvr', 'pwa'],
  'system': ['hs', 'csl'],
  'defence': ['sb', 'ch', 'po', 'ec'],
};

/**
 * Category selection menu for optional slots
 */
export default class CategoryMenu extends TranslatedComponent {

  static propTypes = {
    className: PropTypes.string,
    modules: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
    onSelectCategory: PropTypes.func.isRequired,
    onSelectModule: PropTypes.func, // Add callback for direct module selection from search
    maxClass: PropTypes.number,
    eligible: PropTypes.func,
    slot: PropTypes.object, // Add slot for restriction checking
    m: PropTypes.object, // Current module
    ship: PropTypes.object, // Ship object for diffDetails
    warning: PropTypes.func // Warning function
  };

  constructor(props, context) {
    super(props);
    this._keyDown = this._keyDown.bind(this);
    this._handleSearchChange = this._handleSearchChange.bind(this);
    this._toggleFavouritesMode = this._toggleFavouritesMode.bind(this);
    this.searchInputRef = React.createRef();

    this.state = {
      searchQuery: '',
      favouritesMode: false
    };
  }

  /**
   * Get all unique categories that have modules fitting the slot
   */
  _getAvailableCategories() {
    const { modules, maxClass, eligible } = this.props;
    const categoriesSet = new Set();

    // Flatten modules into array
    let allModules = [];
    if (Array.isArray(modules)) {
      allModules = modules;
    } else if (typeof modules === 'object') {
      Object.keys(modules).forEach(groupKey => {
        const moduleGroup = modules[groupKey];
        if (Array.isArray(moduleGroup)) {
          allModules = allModules.concat(moduleGroup);
        } else if (moduleGroup && typeof moduleGroup === 'object') {
          const mods = Object.keys(moduleGroup).map(modKey => moduleGroup[modKey]);
          allModules = allModules.concat(mods);
        }
      });
    }

    // Filter modules by size and eligibility, then collect their categories
    allModules.forEach(mod => {
      if (!mod || !mod.grp) return;

      // Check if module fits the slot size
      if (maxClass && mod.class && mod.class > maxClass) return;

      // Check eligibility if provided
      if (eligible && !eligible(mod)) return;

      // Find the main category for this module
      let mainCategory = null;

      // Check hardpoint categories
      for (const [categoryName, groupList] of Object.entries(HPTCAT)) {
        if (groupList.includes(mod.grp)) {
          if (categoryName === 'experimental') {
            mainCategory = 'hardpoint-experimental';
          } else if (categoryName === 'guardian') {
            mainCategory = 'hardpoint-guardian';
          } else {
            mainCategory = categoryName;
          }
          break;
        }
      }

      // Check internal categories
      if (!mainCategory) {
        for (const [categoryName, groupList] of Object.entries(INTCAT)) {
          if (groupList.includes(mod.grp)) {
            mainCategory = categoryName;
            break;
          }
        }
      }

      // Fallback to GRPCAT
      if (!mainCategory && GRPCAT[mod.grp]) {
        mainCategory = GRPCAT[mod.grp];
      }

      if (mainCategory) {
        categoriesSet.add(mainCategory);
      }
    });

    return Array.from(categoriesSet);
  }

  /**
   * Get display name for categories
   */
  _getCategoryDisplayName(categoryName) {
    const categoryDisplayNames = {
      'auto field-maintenance unit': 'Auto Field-Maintenance Unit',
      'cargo racks': 'Cargo Racks',
      'fsd interdictor': 'FSD Interdictor',
      'fuel': 'Fuel',
      'hangars': 'Hangars',
      'limpet controllers': 'Limpet Controllers',
      'passenger cabins': 'Passenger Cabins',
      'refineries': 'Refineries',
      'shields': 'Shields',
      'structural reinforcement': 'Structural Reinforcement',
      'flight assists': 'Flight Assists',
      'scanners': 'Scanners',
      'weapon stabilizers': 'Weapon Stabilizers',
      'guardian': 'Guardian',
      'experimental': 'Experimental',
      'lasers': 'Lasers',
      'projectiles': 'Projectiles',
      'ordnance': 'Ordnance',
      'hardpoint-experimental': 'Experimental',
      'hardpoint-guardian': 'Guardian',
      'mining': 'Mining',
      'system': 'System',
      'defence': 'Defence',
      'other': 'Other Modules'
    };

    return categoryDisplayNames[categoryName] || categoryName.toUpperCase();
  }

  /**
   * Handle search input changes
   */
  _handleSearchChange(e) {
    const searchQuery = e.target.value;
    this.setState({ searchQuery });
  }

  /**
   * Toggle between favourites mode and normal module categories
   */
  _toggleFavouritesMode() {
    this.setState(prev => ({ favouritesMode: !prev.favouritesMode }));
  }

  /**
   * Get categories that have favourited modules which fit this slot
   * @return {Array} Array of category names that have favourites
   */
  _getFavouriteCategories() {
    const { maxClass, eligible, modules } = this.props;
    const favourites = Persist.getFavourites();
    const categoriesSet = new Set();

    // Build a set of valid module groups from the modules prop
    // This ensures we only show favourites that belong to this slot type
    const validGroups = new Set();
    if (Array.isArray(modules)) {
      modules.forEach(mod => { if (mod && mod.grp) validGroups.add(mod.grp); });
    } else if (typeof modules === 'object') {
      Object.keys(modules).forEach(groupKey => {
        validGroups.add(groupKey);
      });
    }

    favourites.forEach(fav => {
      if (!fav || !fav.grp) return;

      // Check if favourite's group is valid for this slot type
      if (validGroups.size > 0 && !validGroups.has(fav.grp)) return;

      // Check if favourite fits the slot size
      if (maxClass && fav.class && fav.class > maxClass) return;

      // Check eligibility if provided
      if (eligible && !eligible(fav)) return;

      // Find the main category for this favourite
      let mainCategory = null;

      // Check hardpoint categories
      for (const [categoryName, groupList] of Object.entries(HPTCAT)) {
        if (groupList.includes(fav.grp)) {
          if (categoryName === 'experimental') {
            mainCategory = 'hardpoint-experimental';
          } else if (categoryName === 'guardian') {
            mainCategory = 'hardpoint-guardian';
          } else {
            mainCategory = categoryName;
          }
          break;
        }
      }

      // Check internal categories
      if (!mainCategory) {
        for (const [categoryName, groupList] of Object.entries(INTCAT)) {
          if (groupList.includes(fav.grp)) {
            mainCategory = categoryName;
            break;
          }
        }
      }

      // Fallback to GRPCAT
      if (!mainCategory && GRPCAT[fav.grp]) {
        mainCategory = GRPCAT[fav.grp];
      }

      if (mainCategory) {
        categoriesSet.add(mainCategory);
      }
    });

    return Array.from(categoriesSet);
  }

  /**
   * Key down handler
   */
  _keyDown(cb, e) {
    if (e.keyCode === 13 || e.keyCode === 32) { // Enter or Space
      e.preventDefault();
      e.stopPropagation();
      cb();
    }
  }

  /**
   * Render the category menu
   */
  render() {
    const { onSelectCategory, onSelectModule, modules, eligible, m, ship, warning, className } = this.props;
    const { searchQuery, favouritesMode } = this.state;
    const hasFavourites = Persist.hasFavourites() && this._getFavouriteCategories().length > 0;

    // Determine which categories to show
    let availableCategories;
    if (favouritesMode) {
      availableCategories = this._getFavouriteCategories();
    } else {
      availableCategories = this._getAvailableCategories();
    }

    // Define display order for categories
    const categoryOrder = [
      'lasers',
      'projectiles',
      'ordnance',
      'hardpoint-experimental',
      'hardpoint-guardian',
      'mining',
      'system',
      'defence',
      'cargo racks',
      'fuel',
      'hangars',
      'limpet controllers',
      'passenger cabins',
      'refineries',
      'shields',
      'structural reinforcement',
      'flight assists',
      'scanners',
      'weapon stabilizers',
      'guardian',
      'experimental',
      'auto field-maintenance unit',
      'fsd interdictor',
      'other'
    ];

    // Sort categories by the defined order
    const sortedCategories = availableCategories.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a);
      const indexB = categoryOrder.indexOf(b);

      // If not in order list, put at end
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });

    // Render search results if there's a search query
    const hasSearchQuery = searchQuery && searchQuery.trim();

    // If searching, render AvailableModulesMenu with search pre-populated
    if (hasSearchQuery) {
      return (
        <div
          className={cn('select', 'category-menu', className)}
          onContextMenu={stopCtxPropagation}
        >
          <div className="module-search-container">
            <input
              ref={this.searchInputRef}
              type="text"
              className="module-search-input"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={this._handleSearchChange}
              onClick={(e) => e.stopPropagation()}
              autoFocus={this.context.noTouch}
            />
          </div>
          <AvailableModulesMenuWithSearch
            className={className}
            modules={modules}
            m={m}
            ship={ship}
            onSelect={onSelectModule}
            warning={warning}
            diffDetails={ship ? diffDetails.bind(ship, this.context.language) : undefined}
            eligible={eligible}
            searchQuery={searchQuery}
            hideSearch={true}
          />
        </div>
      );
    }

    return (
      <div
        className={cn('select', 'category-menu', className)}
        onContextMenu={stopCtxPropagation}
      >
        <div className="module-search-container">
          <input
            ref={this.searchInputRef}
            type="text"
            className="module-search-input"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={this._handleSearchChange}
            onClick={(e) => e.stopPropagation()}
            autoFocus={this.context.noTouch}
          />
        </div>

        {hasFavourites && (
          <div
            className={cn('favourites-toggle', { active: favouritesMode })}
            tabIndex="0"
            onClick={(e) => {
              e.stopPropagation();
              this._toggleFavouritesMode();
            }}
            onKeyDown={this._keyDown.bind(this, this._toggleFavouritesMode)}
          >
            <span className="favourites-toggle-text">
              {favouritesMode ? <span><Reload className="favourites-toggle-icon" /> Modules</span> : '★ Favourites'}
            </span>
          </div>
        )}

        <div className="select-group cap">
          {favouritesMode ? 'Favourite Categories' : 'Select Module Category'}
        </div>

        {sortedCategories.map(category => (
          <div
            key={category}
            className="category-item special-module c"
            tabIndex="0"
            onClick={(e) => {
              e.stopPropagation();
              if (favouritesMode) {
                onSelectCategory(`favourites:${category}`);
              } else {
                onSelectCategory(category);
              }
            }}
            onKeyDown={this._keyDown.bind(this, () => {
              if (favouritesMode) {
                onSelectCategory(`favourites:${category}`);
              } else {
                onSelectCategory(category);
              }
            })}
          >
            <div className="module-content">
              <span className="module-text">{this._getCategoryDisplayName(category)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
}

/**
 * Wrapper component for AvailableModulesMenu with pre-populated search
 */
class AvailableModulesMenuWithSearch extends AvailableModulesMenu {
  constructor(props, context) {
    super(props, context);
    // Set the search query from props
    if (props.searchQuery) {
      this.state = {
        ...this.state,
        searchQuery: props.searchQuery
      };
    }
  }

  componentDidMount() {
    super.componentDidMount();
    // Auto-focus search input on desktop (not mobile, to avoid keyboard popup)
    if (this.context.noTouch && this.searchInputRef.current) {
      this.searchInputRef.current.focus();
    }
    // Trigger search filtering after mount
    if (this.props.searchQuery) {
      this._filterModulesBySearch();
    }
  }

  componentDidUpdate(prevProps) {
    super.componentDidUpdate(prevProps);
    // Update search if query changed
    if (prevProps.searchQuery !== this.props.searchQuery && this.props.searchQuery) {
      this.setState({ searchQuery: this.props.searchQuery }, () => {
        this._filterModulesBySearch();
      });
    }
  }
}
