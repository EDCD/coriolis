import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import cn from 'classnames';
import { stopCtxPropagation } from '../utils/UtilityFunctions';
import { MountFixed, MountGimballed, MountTurret, Warning, CommunityGoalSmall, TechBrokerSmall, PowerPlaySmall } from './SvgIcons';
import ModalConfirmCG from './ModalConfirmCG';
import Persist from '../stores/Persist';


const PRESS_THRESHOLD = 500; // mouse/touch down threshold

// Add these constants at the top of the file, after the imports (around line 8):

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
  'hangars': ['fh', 'pv'],
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
  // Add standard/core modules (remove bulkheads since they're handled separately)
  'power plant': ['pp'],
  'thrusters': ['th', 't'],
  'frame shift drive': ['fsd'],
  'life support': ['ls'],
  'power distributor': ['pd'],
  'sensors': ['s', 'ss'],
  'fuel tank': ['ft']
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
 * Available modules menu
 */
export default class AvailableModulesMenu extends TranslatedComponent {

  static propTypes = {
    className: PropTypes.string,
    modules: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired,
    warning: PropTypes.func.isRequired,
    diffDetails: PropTypes.func.isRequired,
    m: PropTypes.object,
    eligible: PropTypes.func.isRequired,
    slot: PropTypes.object, // Add this line for slot restriction information
    selectedCategory: PropTypes.string, // Category to filter by ('current' for same as fitted module, or category name)
    onBack: PropTypes.func // Callback for back button
  };

  /**
   * Select handler that warns about CG modules
   * @param  {Function} onSelect      The original select function
   * @param  {Object} module          The module being selected
   */
  _selectModule(onSelect, module) {
    if (module && module.preEngineered && module.preEngineered.availability === 'CG' && Persist.promptCG()) {
      this.context.showModal(<ModalConfirmCG onSelect={onSelect} module={module} />);
    } else {
      onSelect(module);
    }
  }

  /**
   * Get the availability icon for a module (CG, Tech Broker, or PowerPlay)
   * @param  {Object} mod The module
   * @return {React.Component} Icon component or null
   */
  _getAvailabilityIcon(mod) {
    if (!mod) return null;

    // Check for PowerPlay modules first
    if (mod.powerplay === 'True' || mod.powerplay === true) {
      return <PowerPlaySmall className='powerplay' />;
    }

    // Then check for pre-engineered modules (CG or Tech Broker)
    if (!mod.preEngineered) return null;

    if (mod.preEngineered.availability === 'CG') {
      return <CommunityGoalSmall className='community' />;
    }

    if (typeof mod.preEngineered.availability === 'undefined') {
      return <TechBrokerSmall className='techbroker' />;
    }

    return null;
  }

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props);

    this.slotItems = new Map();

    this._initState = this._initState.bind(this);
    this._shouldIncludeModule = this._shouldIncludeModule.bind(this); // Add this line
    this._getModuleCategory = this._getModuleCategory.bind(this);
    this._keyDown = this._keyDown.bind(this);
    this._hideDiff = this._hideDiff.bind(this);
    this._showSearch = this._showSearch.bind(this);
    this._scrollToActiveModule = this._scrollToActiveModule.bind(this);
    this._handleSearchChange = this._handleSearchChange.bind(this);
    this._filterModulesBySearch = this._filterModulesBySearch.bind(this);
    this.searchInputRef = React.createRef();

    const initialState = this._initState(props, context);
    this.state = {
      ...initialState,
      searchQuery: ''
      // Don't override allModules - it's already in initialState
    };
  }

  /**
   * Get the main category for a module
   * @param {Object} mod The module
   * @return {string} The main category name
   */
  _getModuleCategory(mod) {
    if (!mod || !mod.grp) return null;

    // Check hardpoint categories
    for (const [categoryName, groupList] of Object.entries(HPTCAT)) {
      if (groupList.includes(mod.grp)) {
        if (categoryName === 'experimental') {
          return 'hardpoint-experimental';
        } else if (categoryName === 'guardian') {
          return 'hardpoint-guardian';
        } else {
          return categoryName;
        }
      }
    }

    // Check internal categories
    for (const [categoryName, groupList] of Object.entries(INTCAT)) {
      if (groupList.includes(mod.grp)) {
        return categoryName;
      }
    }

    // Fallback to GRPCAT
    if (GRPCAT[mod.grp]) {
      return GRPCAT[mod.grp];
    }

    return null;
  }

  /**
   * Init state based on module list
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   * @return {Object}         Initial state
   */
  _initState(props, context) {
    let { language, termtip, tooltip } = context;
    let { modules, onSelect, m, eligible, warning, selectedCategory } = props;
    let translate = language.translate;
    let list = [];
    let emptyId = 'empty';
    let firstSlotId, lastSlotId, activeSlotId;

    if (m) {
      activeSlotId = m.id;
    }

    // Check if this is a core internal slot (they can never be empty)
    const isCoreInternal = this.props.className && this.props.className.includes('standard');

    if (!isCoreInternal) {
      firstSlotId = emptyId;
      lastSlotId = emptyId;
    }

    // Collect all modules from any structure into a flat array
    let allModules = [];

    if (modules) {
      if (Array.isArray(modules)) {
        // Direct array of modules
        allModules = modules.filter(this._shouldIncludeModule);
      } else if (typeof modules === 'object') {
        // Object structure - extract all modules into flat array
        Object.keys(modules).forEach(groupKey => {
          const moduleGroup = modules[groupKey];

          if (Array.isArray(moduleGroup)) {
            // Filter modules in this group
            const filteredModules = moduleGroup.filter(this._shouldIncludeModule);
            allModules = allModules.concat(filteredModules);
          } else if (moduleGroup && typeof moduleGroup === 'object') {
            // Nested object structure like { 'cargo': { '1': mod1, '2': mod2 } }
            const filteredModules = Object.keys(moduleGroup)
              .map(modKey => moduleGroup[modKey])
              .filter(this._shouldIncludeModule);
            allModules = allModules.concat(filteredModules);
          }
        });
      }
    }

    // Filter by category if specified
    if (selectedCategory) {
      if (selectedCategory === 'current' && m) {
        // Filter to modules in the same category as the currently fitted module
        const currentCategory = this._getModuleCategory(m);
        if (currentCategory) {
          allModules = allModules.filter(mod => this._getModuleCategory(mod) === currentCategory);
        }
      } else if (selectedCategory !== 'current') {
        // Filter to modules in the specified category
        allModules = allModules.filter(mod => this._getModuleCategory(mod) === selectedCategory);
      }
    }

    // Process all modules with proper category grouping (no duplicate headers)
    if (allModules.length > 0) {
      this._processModules(allModules, list, onSelect, eligible, warning, termtip, tooltip, translate);

      allModules.forEach((mod) => {
        if (!firstSlotId) firstSlotId = mod.id;
        lastSlotId = mod.id;
      });
    }

    // Only add empty option for non-core internal slots
    if (!isCoreInternal) {
      list.unshift(this._createEmptySlotElement(emptyId, m, onSelect, translate));
    }

    this.activeSlotId = activeSlotId;
    this.firstSlotId = firstSlotId;
    this.lastSlotId = lastSlotId;

    return { list, allModules };
  }

  /**
   * Filter out unrecognised modules
   */
  _shouldIncludeModule = (mod) => {
    if (!mod || !mod.id) return false;

    // Filter out unrecognised modules more comprehensively
    const id = mod.id.toLowerCase();
    const name = (mod.name || '').toLowerCase();
    const grp = mod.grp || '';

    // Filter out any module with "unrecognised" in name or ID
    if (name.includes('unrecognised') || id.includes('unrecognised')) return false;

    // Filter out specific error/placeholder modules by ID
    // Don't use generic endsWith('z') as it filters out Guardian 5A Power Distributor (ID: 2Z)
    if (id === '1z' || id === '0z' || id === '4m' || id === '4n') return false;

    // Filter out modules with rating 'Z' which is used for unrecognised modules
    if (mod.rating === 'Z' && name.includes('unrecognised')) return false;

    // Filter out modules with unrecognised/unknown group
    if (grp === 'unknown' || grp === 'unrecognised') return false;

    // Filter out modules that are clearly error placeholders
    if (name.includes('error') || name.includes('placeholder')) return false;

    // Filter out modules with invalid/missing critical properties for their type
    if (!mod.class && !mod.rating && !mod.name && mod.id.length < 3) return false;

    // Filter out ship-specific thrusters that don't match the current ship
    if (mod.ship && this.props.ship && mod.ship !== this.props.ship.id) {
      return false;
    }

    return true;
  }

  /**
   * Sort modules by size (descending) then rating (ascending)
   */
  _sortModules = (a, b) => {
    const classA = a.class || 0;
    const classB = b.class || 0;
    if (classA !== classB) {
      return classB - classA; // Size descending: 6, 5, 4, 3, 2, 1
    }

    // Handle all possible ratings: A, B, C, D, E, F, G, H, I, etc.
    const ratingA = a.rating || 'Z';
    const ratingB = b.rating || 'Z';
    if (ratingA !== ratingB) {
      return ratingA.localeCompare(ratingB); // Rating ascending: A, B, C, D, E, F, G, H, I
    }

    const nameA = a.name || a.id || '';
    const nameB = b.name || b.id || '';
    return nameA.localeCompare(nameB);
  }

  /**
   * Determine if a module is compact (only size/class) or named
   */
  _isCompactModule = (mod) => {
    // Bulkheads are never compact
    const isBulkhead = mod.grp === 'bh' || mod.grp === 'armour' ||
                      (mod.name && mod.name.toLowerCase().includes('bulkhead'));

    if (isBulkhead) return false;

    // If it has no name, it's compact (just size/rating like "5A", "2F", "1I")
    if (!mod.name) return true;

    // If the name is just the class/rating repeated, it's compact
    if (mod.class && mod.rating && mod.name === `${mod.class}${mod.rating}`) return true;

    // Special/unique modules should NEVER be compact (like Disruptor, Pacifier, etc.)
    const specialModuleNames = [
      'disruptor',
      'pacifier',
      'retributor',
      'enforcer',
      'cytoscrambler',
      'advanced',
      'enhanced',
      'modified',
      'prismatic',
      'bi-weave',
      'guardian',
      'ax',
      'caustic',
      'enzyme',
      'nanite',
      'abrasion',
      'seismic',
      'sub-surface',
      'displacement',
      'mining',
      'detailed surface scanner',
      'supercruise assist',
      'docking computer',
      'fighter hangar',
      'planetary vehicle hangar',
      'corrosion resistant',
      'military grade',
      'lightweight',
      'reinforced',
      'mirrored',
      'reactive'
    ];

    if (mod.name) {
      const lowerName = mod.name.toLowerCase();
      const isSpecialModule = specialModuleNames.some(special => lowerName.includes(special));

      if (isSpecialModule) {
        return false; // Special modules are NEVER compact
      }
    }

    // Only very basic standard modules should be in grid format
    const basicGridModules = [
      'cargo rack',
      'fuel tank'
    ];

    if (mod.name) {
      const lowerName = mod.name.toLowerCase();
      const isBasicGridModule = basicGridModules.some(type => lowerName === type);

      if (isBasicGridModule) {
        return true; // Only exact matches for basic modules are compact
      }
    }

    // Everything else with a name should be in the named list
    return false;
  }

  /**
   * Create a compact module element for the grid
   */
  _createCompactModuleElement = (mod, onSelect, eligible, warning, termtip, tooltip, translate) => {
    if (!mod || !mod.id) {
      console.warn('Invalid module:', mod);
      return null;
    }

    let validSlot = eligible(mod);
    let isActive = this.props.m && this.props.m.id === mod.id;

    // Check if this is a hardpoint module
    const isHardpoint = mod.mount || (mod.grp && (mod.grp === 'wp' || mod.grp === 'ul'));

    // Check if module has a warning
    const hasWarning = validSlot && !isActive && warning && warning(mod);

    let classNames = cn({
      'compact-module': !isHardpoint, // Use compact-module for non-hardpoint modules
      'hardpoint-module': isHardpoint, // Use hardpoint-module for hardpoint modules
      'c': validSlot,
      'disabled': !validSlot,
      'active': isActive,
      'warning': hasWarning
    });

    let warningIcon;
    if (hasWarning) {
      warningIcon = <Warning className="warning-icon" />;
    }

    // Get availability icon (CG or Tech Broker)
    const availabilityIcon = this._getAvailabilityIcon(mod);

    // Generate compact display name for all class/rating combinations
    let displayName;
    let mountIcon = null;

    // Check if this is a hardpoint module and get mount type icon
    if (mod.mount) {
      switch (mod.mount) {
        case 'F': // Fixed
          mountIcon = <MountFixed className="mount-icon" />;
          break;
        case 'G': // Gimballed
          mountIcon = <MountGimballed className="mount-icon" />;
          break;
        case 'T': // Turret
          mountIcon = <MountTurret className="mount-icon" />;
          break;
        default:
          mountIcon = null;
      }
    }

    if (mod.class && mod.rating) {
      displayName = `${mod.class}${mod.rating}`;
    } else if (mod.rating) {
      displayName = mod.rating;
    } else if (mod.class) {
      displayName = `${mod.class}`;
    } else {
      displayName = mod.id.toUpperCase().substring(0, 3);
    }

    return (
      <div key={mod.id}
           className={classNames}
           tabIndex={validSlot ? '0' : ''}
           data-id={mod.id}
           onClick={validSlot ? this._selectModule.bind(this, onSelect, mod) : null}
           onKeyDown={validSlot ? this._keyDown.bind(this, this._selectModule.bind(this, onSelect, mod)) : null}
           ref={slotItem => {
             if (slotItem) {
               this.slotItems.set(mod.id, slotItem);
             }
           }}>
        <div className="module-content"> {availabilityIcon}
          {mountIcon && <span className="module-mount">{mountIcon}</span>}
          <span className="module-text">{warningIcon} {displayName} </span>
        </div>
      </div>
    );
  }

  /**
   * Add named/special modules as grid elements (like Disruptor, Pacifier)
   */
  _addNamedModulesAsGrid(namedModules, list, onSelect, eligible, warning, termtip, tooltip, translate) {
    // Group named modules by size for consistent layout
    const modulesBySize = {};
    namedModules.forEach(mod => {
      const size = mod.class || 0;
      if (!modulesBySize[size]) {
        modulesBySize[size] = [];
      }
      modulesBySize[size].push(mod);
    });

    // Sort sizes in descending order (6, 5, 4, 3, 2, 1)
    const sizes = Object.keys(modulesBySize).map(Number).sort((a, b) => b - a);

    sizes.forEach(size => {
      const modulesInRow = modulesBySize[size];
      const moduleCount = modulesInRow.length;

      // Check if any module in this row is a hardpoint module
      const hasHardpointModules = modulesInRow.some(mod =>
        mod.mount || (mod.grp && (mod.grp === 'wp' || mod.grp === 'ul'))
      );

      // Use different row class based on module type
      const rowClassName = hasHardpointModules ? 'hardpoint-module-row' : 'compact-module-row';

      list.push(
        <div key={`named-size-${size}`}
             className={rowClassName}
             data-module-count={moduleCount}>
          {modulesInRow.map(mod =>
            this._createNamedModuleElement(mod, onSelect, eligible, warning, termtip, tooltip, translate)
          )}
        </div>
      );
    });
  }

  /**
   * Create a named module element (like Disruptor, Pacifier) with proper styling and mount icons
   */
  _createNamedModuleElement = (mod, onSelect, eligible, warning, termtip, tooltip, translate) => {
    if (!mod || !mod.id) {
      console.warn('Invalid module:', mod);
      return null;
    }

    let validSlot = eligible(mod);
    let isActive = this.props.m && this.props.m.id === mod.id;

    // Check if this is a hardpoint module
    const isHardpoint = mod.mount || (mod.grp && (mod.grp === 'wp' || mod.grp === 'ul'));

    // Check if module has a warning
    const hasWarning = validSlot && !isActive && warning && warning(mod);

    let classNames = cn({
      'compact-module': !isHardpoint,
      'hardpoint-module': isHardpoint,
      'named-module': true,
      'c': validSlot,
      'disabled': !validSlot,
      'active': isActive,
      'warning': hasWarning
    });

    let warningIcon;
    if (hasWarning) {
      warningIcon = <Warning className="warning-icon" />;
    }

    // Generate display name for named modules
    let displayName;
    let mountIcon = null;

    // Check if this is a hardpoint module and get mount type icon
    if (mod.mount) {
      switch (mod.mount) {
        case 'F': // Fixed
          mountIcon = <MountFixed className="mount-icon" />;
          break;
        case 'G': // Gimballed
          mountIcon = <MountGimballed className="mount-icon" />;
          break;
        case 'T': // Turret
          mountIcon = <MountTurret className="mount-icon" />;
          break;
        default:
          mountIcon = null;
      }
    }

    // For named modules, show the name (but shorter)
    if (mod.name) {
      // Shorten common long names for better fit
      let shortName = mod.name
        .replace('Fragment Cannon', 'Frag')
        .replace('Pulse Laser', 'Pulse')
        .replace('Multi-cannon', 'MC')
        .replace('Missile Rack', 'Missile');

      displayName = shortName.toUpperCase();
    } else {
      if (mod.class && mod.rating) {
        displayName = `${mod.class}${mod.rating}`;
      } else {
        displayName = mod.id.toUpperCase();
      }
    }

    return (
      <div key={mod.id}
           className={classNames}
           tabIndex={validSlot ? '0' : ''}
           data-id={mod.id}
           onClick={validSlot ? this._selectModule.bind(this, onSelect, mod) : null}
           onKeyDown={validSlot ? this._keyDown.bind(this, this._selectModule.bind(this, onSelect, mod)) : null}
           ref={slotItem => {
             if (slotItem) {
               this.slotItems.set(mod.id, slotItem);
             }
           }}>
        <div className="module-content">
          {mountIcon && <span className="module-mount">{mountIcon}</span>}

          <span className="module-text">{warningIcon} {displayName}</span>
        </div>
      </div>
    );
  }

  /**
   * Process modules by grouping them by main category and sub-category
   */
  _processModules(modules, list, onSelect, eligible, warning, termtip, tooltip, translate) {
    const sortedModules = modules.sort(this._sortModules);

    // Group modules by their actual group key (mod.grp)
    const moduleGroups = this._groupModulesByType(sortedModules);

    // Organize groups into main categories using GRPCAT, INTCAT, HPTCAT
    const mainCategories = {};

    // Process each group and assign to main category
    Object.keys(moduleGroups).forEach(groupKey => {
      const groupModules = moduleGroups[groupKey];

      // Special handling for bulkheads
      if (groupKey === 'bh' || groupKey === 'armour') {
        if (!mainCategories['bulkheads']) {
          mainCategories['bulkheads'] = [];
        }
        mainCategories['bulkheads'].push({
          groupKey: groupKey,
          modules: groupModules
        });
        return; // Skip the rest of the logic for bulkheads
      }

      // Find which main category this group belongs to
      let mainCategoryName = null;

      // Check hardpoint categories first for weapon modules
      for (const [categoryName, groupList] of Object.entries(HPTCAT)) {
        if (groupList.includes(groupKey)) {
          if (categoryName === 'experimental') {
            mainCategoryName = 'hardpoint-experimental';
          } else if (categoryName === 'guardian') {
            mainCategoryName = 'hardpoint-guardian';
          } else {
            mainCategoryName = categoryName;
          }
          break;
        }
      }

      // If not found in hardpoint categories, check internal categories
      if (!mainCategoryName) {
        for (const [categoryName, groupList] of Object.entries(INTCAT)) {
          if (groupList.includes(groupKey)) {
            mainCategoryName = categoryName;
            break;
          }
        }
      }

      // Fallback to GRPCAT if not found in specific categories
      if (!mainCategoryName && GRPCAT[groupKey]) {
        mainCategoryName = GRPCAT[groupKey];
      }

      // Final fallback
      if (!mainCategoryName) {
        mainCategoryName = 'other';
      }

      // Initialize main category if it doesn't exist
      if (!mainCategories[mainCategoryName]) {
        mainCategories[mainCategoryName] = [];
      }

      // Add this group to the main category
      mainCategories[mainCategoryName].push({
        groupKey: groupKey,
        modules: groupModules
      });
    });

    // Define the order of main categories for display
    const categoryOrder = [
      // Core modules first
      'bulkheads',
      'power plant',
      'thrusters',
      'frame shift drive',
      'life support',
      'power distributor',
      'sensors',
      // Internal modules
      'auto field-maintenance unit',
      'cargo racks',
      'fsd interdictor',
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
      // Hardpoint modules in the desired order
      'lasers',
      'projectiles',
      'ordnance',
      'hardpoint-experimental',
      'hardpoint-guardian',
      'mining',
      'system',
      'defence',
      'other'
    ];

    // Render each main category with its groups
    categoryOrder.forEach(mainCategoryName => {
      const groups = mainCategories[mainCategoryName];

      if (groups && groups.length > 0) {
        // Add main category header
        const displayCategoryName = this._getMainCategoryDisplayName(mainCategoryName);
        list.push(<div key={`main-${mainCategoryName}`} className="select-group cap">{displayCategoryName}</div>);

        // Check if there are multiple groups in this category
        const hasMultipleGroups = groups.length > 1;

        // Add each group within this category
        groups.forEach(group => {
          const { groupKey, modules: groupModules } = group;

          // Determine if we should show a group header (sub-header)
          // Show group header if:
          // 1. There are multiple groups in this category, OR
          // 2. The group key is 'fh' (fighter hangar), OR
          // 3. The main category is 'shields' (always show sub-headers for shields), OR
          // 4. The main category is 'experimental' (always show sub-headers for experimental), OR
          // 5. The main category is 'limpet controllers' (always show sub-headers for limpet controllers)
          const shouldShowGroupHeader = hasMultipleGroups ||
                                       groupKey === 'fh' ||
                                       mainCategoryName === 'shields' ||
                                       mainCategoryName === 'experimental' ||
                                       mainCategoryName === 'limpet controllers';

          if (shouldShowGroupHeader) {
            // Get group display name using the new method
            const groupDisplayName = this._getGroupDisplayName(groupKey, groupModules);

            // Add group header (sub-category)
            list.push(<div key={`group-${groupKey}`} className="module-separator cap">{groupDisplayName}</div>);
          }

          // Separate compact and named modules within this group
          const compactModules = [];
          const namedModules = [];

          groupModules.forEach(mod => {
            if (this._isCompactModule(mod)) {
              compactModules.push(mod);
            } else {
              // Check if the module is a planetary approach suite and if the slot is pas restricted
              if (mod.grp === 'pas') {
                // Check if 'eligible' is set and if eligible has 'pas'
                if (eligible({ grp: 'pas' })) {
                  namedModules.push(mod); // Only add PAS if the slot is pas restricted and this module is a PAS
                  console.log('Adding PAS module to pas restricted slot:', mod);
                } else {
                  console.log('Skipping PAS module for non pas restricted slot:', mod, ' slot eligible:', eligible);
                  // continue to the next item in the loop and skip adding the pas module to the availableModulesMenu for a non pas restricted slot
                  return;
                }
              } else {
                // For all other modules (NOT including bulkheads), add them normally
                namedModules.push(mod);
              }
            }
          });

          // If there's only one compact module, treat it as a named module instead
          if (compactModules.length === 1) {
            namedModules.push(compactModules[0]);
            compactModules.length = 0; // Clear the compact array
          }

          // Add compact modules as grid (only if there are multiple)
          if (compactModules.length > 0) {
            this._addCompactModulesAsGrid(compactModules, list, onSelect, eligible, warning, termtip, tooltip, translate, groupKey);
          }

          // Add named modules
          if (namedModules.length > 0) {
            namedModules.forEach(mod => {
              this._addModuleToList(mod, list, onSelect, eligible, warning, termtip, tooltip, translate);
            });
          }
        });
      }
    });
  }

  /**
   * Get display name for main categories
   */
  _getMainCategoryDisplayName(categoryName) {
    const categoryDisplayNames = {
      // Core modules
      'bulkheads': 'Bulkheads',
      'power plant': 'Power Plant',
      'thrusters': 'Thrusters',
      'frame shift drive': 'Frame Shift Drive',
      'life support': 'Life Support',
      'power distributor': 'Power Distributor',
      'sensors': 'Sensors',
      // Internal modules
      'auto field-maintenance unit': 'Auto Field-Maintenance Unit',
      'cargo racks': 'Cargo Racks',
      'fsd interdictor': 'FSD Interdictor',
      'fuel': 'Fuel',
      'hangars': 'Hangars',
      'limpet controllers': 'Limpet Controllers',
      'passenger cabins': 'Passenger Cabins',
      'refineries': 'Refineries',
      'shields': 'Shields',
      'structural reinforcement': 'Structural Reinforment',
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
   * Get friendly display name for module group keys
   */
  _getGroupDisplayName(groupKey, modules) {
    // First try to get the name from the first module's ukName if available
    if (modules && modules.length > 0 && modules[0].ukName) {
      return modules[0].ukName;
    }

    // Fallback to mapping common group keys to friendly names
    const groupDisplayNames = {
      // Hardpoint modules
      'pl': 'Pulse Laser',
      'ul': 'Burst Laser',
      'bl': 'Beam Laser',
      'mc': 'Multi-Cannon',
      'advmc': 'Multi-Cannon (Advanced)',
      'c': 'Cannon',
      'fc': 'Fragment Cannon',
      'pa': 'Plasma Accelerator',
      'rg': 'Rail Gun',
      'mr': 'Missile Rack',
      'amr': 'Missile Rack (Advanced)',
      'tp': 'Torpedo Pylon',
      'nl': 'Mine Launcher',
      'ml': 'Mining Laser',
      'scl': 'Seismic Charge Launcher',
      'sdm': 'Sub-Surface Displacement Missile',
      'abl': 'Abrasion Blaster',
      'mvr': 'Mining Volley Repeater',
      'pwa': 'Pulse Wave Analyser',
      'axmc': 'AX Multi-Cannon',
      'axmce': 'AX Multi-Cannon (Enhanced)',
      'axmr': 'AX Missile Rack',
      'axmre': 'AX Missile Rack (Enhanced)',
      'ntp': 'Nanite Torpedo Pylon',
      'rfl': 'Remote Release Flak Launcher',
      'tbrfl': 'Remote Release Flechette Launcher',
      'tbsc': 'Shock Cannon',
      'tbem': 'Enzyme Missile Rack',
      'gpc': 'Guardian Plasma Charger',
      'ggc': 'Guardian Gauss Cannon',
      'gsc': 'Guardian Shard Cannon',

      // Utility modules
      'sb': 'Shield Booster',
      'hs': 'Heat Sink Launcher',
      'csl': 'Caustic Sink Launcher',
      'ch': 'Chaff Launcher',
      'po': 'Point Defence',
      'ec': 'Electronic Countermeasure',
      'cs': 'Cargo Scanner',
      'kw': 'Kill Warrant Scanner',
      'ws': 'Wake Scanner',
      'sc': 'Surface Scanner',
      'ss': 'Detailed Surface Scanner',

      // Internal modules
      'cr': 'Cargo Rack',
      'crl': 'Corrosion Resistant Cargo Rack',
      'sg': 'Shield Generator',
      'bsg': 'Bi-Weave Shield Generator',
      'psg': 'Prismatic Shield Generator',
      'scb': 'Shield Cell Bank',
      'cc': 'Collector Limpet Controller',
      'fx': 'Fuel Transfer Limpet Controller',
      'hb': 'Hatch Breaker Limpet Controller',
      'pc': 'Prospector Limpet Controller',
      'rpl': 'Repair Limpet Controller',
      'mlc': 'Multi Limpet Controller',
      'rsl': 'Research Limpet Controller',
      'fh': 'Fighter Hangar',
      'pv': 'Planetary Vehicle Hangar',
      'fs': 'Fuel Scoop',
      'ft': 'Fuel Tank',
      'hr': 'Hull Reinforcement Package',
      'mrp': 'Module Reinforcement Package',
      'dc': 'Docking Computer',
      'sua': 'Supercruise Assist',
      'ews': 'Experimental Weapon Stabiliser',

      // Standard modules
      'pp': 'Power Plant',
      'th': 'Thrusters',
      'fsd': 'Frame Shift Drive',
      'ls': 'Life Support',
      'pd': 'Power Distributor',
      'ss': 'Sensors'
    };

    return groupDisplayNames[groupKey] || groupKey.toUpperCase();
  }

  /**
   * Check if a hardpoint slot has restrictions
   */
  _isRestrictedHardpointSlot(slotObject) {
    return slotObject && typeof slotObject === 'object' && slotObject.name;
  }

  /**
   * Get the restriction type for a hardpoint slot
   */
  _getHardpointSlotRestriction(slotObject) {
    if (!this._isRestrictedHardpointSlot(slotObject)) {
      return null;
    }
    return slotObject.name.toLowerCase();
  }

  /**
   * Check if a module is eligible for a restricted hardpoint slot
   */
  _isModuleEligibleForRestrictedHardpoint(mod, restriction) {
    if (!restriction || !mod) return true;

    const grp = mod.grp || '';
    const name = (mod.name || '').toLowerCase();

    switch (restriction) {
      case 'mining':
        // Mining hardpoints can only use mining equipment
        return ['ml', 'scl', 'sdm', 'abl', 'mvr', 'pwa'].includes(grp) ||
               name.includes('mining') ||
               name.includes('abrasion') ||
               name.includes('seismic') ||
               name.includes('sub-surface');

      case 'utility':
        // Utility hardpoints for specific utility modules
        return ['sc', 'ss', 'cs', 'kw', 'ws', 'xs', 'ch', 'po', 'ec', 'sfn'].includes(grp);

      case 'weapon':
        // Weapon-only hardpoints
        return ['pl', 'ul', 'bl', 'mc', 'advmc', 'c', 'fc', 'pa', 'rg', 'mr', 'amr', 'tp', 'nl'].includes(grp) ||
               mod.mount; // Any module with a mount type is a weapon

      default:
        return true;
    }
  }

  /**
   * Add compact modules organized in rows by size
   */

  _addCompactModulesAsGrid(compactModules, list, onSelect, eligible, warning, termtip, tooltip, translate, groupKey = 'default') {
    // Check if we have a single-rating type (like all E-class cargo racks)
    const ratings = [...new Set(compactModules.map(mod => mod.rating))];
    const isSingleRatingType = ratings.length === 1;

    // Generate unique key based on module content
    const moduleIds = compactModules.map(mod => mod.id).sort().join('-');

    const gridKey = `compact-grid-${groupKey}-${moduleIds.slice(0, 30)}`; // Include group key

    if (isSingleRatingType) {
      // For single-rating types (like Cargo Racks), arrange them in one or more rows
      const maxPerRow = 6;
      const rows = [];
      for (let i = 0; i < compactModules.length; i += maxPerRow) {
        rows.push(compactModules.slice(i, i + maxPerRow));
      }

      list.push(
        <div key={gridKey} className="compact-module-grid">
          {rows.map((rowModules, rowIndex) => {
            const moduleCount = rowModules.length;

            // Check if any module in this row is a hardpoint module
            const hasHardpointModules = rowModules.some(mod =>
              mod.mount || (mod.grp && (mod.grp === 'wp' || mod.grp === 'ul'))
            );

            // Use different row class based on module type
            const rowClassName = hasHardpointModules ? 'hardpoint-module-row' : 'compact-module-row';

            return (
              <div key={`${gridKey}-row-${rowIndex}`}
                   className={rowClassName}
                   data-module-count={moduleCount}>
                {rowModules.map(mod =>
                  this._createCompactModuleElement(mod, onSelect, eligible, warning, termtip, tooltip, translate)
                )}
              </div>
            );
          })}
        </div>
      );
    } else {
      // For multi-rating types (like weapons), group by size as before
      const modulesBySize = {};
      compactModules.forEach(mod => {
        const size = mod.class || 0;
        if (!modulesBySize[size]) {
          modulesBySize[size] = [];
        }
        modulesBySize[size].push(mod);
      });

      // Sort sizes in descending order (6, 5, 4, 3, 2, 1)
      const sizes = Object.keys(modulesBySize).map(Number).sort((a, b) => b - a);

      list.push(
        <div key={gridKey} className="compact-module-grid">
          {sizes.map(size => {
            const modulesInRow = modulesBySize[size];
            const moduleCount = modulesInRow.length;

            // Check if any module in this row is a hardpoint module
            const hasHardpointModules = modulesInRow.some(mod =>
              mod.mount || (mod.grp && (mod.grp === 'wp' || mod.grp === 'ul'))
            );

            // Use different row class based on module type
            const rowClassName = hasHardpointModules ? 'hardpoint-module-row' : 'compact-module-row';

            return (
              <div key={`${gridKey}-size-${size}`}
                   className={rowClassName}
                   data-module-count={moduleCount}>
                {modulesInRow.map(mod =>
                  this._createCompactModuleElement(mod, onSelect, eligible, warning, termtip, tooltip, translate)
                )}
              </div>
            );
          })}
        </div>
      );
    }
  }

  /**
   * Add a module to the list (for named/special modules)
   */
  _addModuleToList(mod, list, onSelect, eligible, warning, termtip, tooltip, translate) {
    if (!mod || !mod.id) {
      console.warn('Invalid module:', mod);
      return;
    }

    let validSlot = eligible(mod);
    let isActive = this.props.m && this.props.m.id === mod.id;

    // Check if module has a warning
    const hasWarning = validSlot && !isActive && warning && warning(mod);

    // Use special module styling with margins and borders
    let classNames = cn({
      'special-module': true, // Add special-module class for styling
      'c': validSlot,
      'disabled': !validSlot,
      'active': isActive,
      'warning': hasWarning
    });

    let warningIcon;
    if (hasWarning) {
      warningIcon = <Warning className="warning-icon" />;
    }

    // Check if this is a hardpoint module and get mount type icon
    let mountIcon = null;
    if (mod.mount) {
      switch (mod.mount) {
        case 'F': // Fixed
          mountIcon = <MountFixed className="mount-icon" />;
          break;
        case 'G': // Gimballed
          mountIcon = <MountGimballed className="mount-icon" />;
          break;
        case 'T': // Turret
          mountIcon = <MountTurret className="mount-icon" />;
          break;
        default:
          mountIcon = null;
      }
    }

    // Generate proper display name for named modules
    let displayName;
    if (mod.name) {
      const isBulkhead = mod.grp === 'bh' || mod.grp === 'armour' ||
                        (mod.name && mod.name.toLowerCase().includes('bulkhead'));

      if (isBulkhead) {
        displayName = mod.name.toUpperCase();
      } else {
        if (mod.class && mod.rating) {
          displayName = `${mod.class}${mod.rating} ${mod.name}`.toUpperCase();
        } else {
          displayName = mod.name.toUpperCase();
        }
      }
    } else {
      if (mod.class && mod.rating) {
        displayName = `${mod.class}${mod.rating}`;
      } else {
        displayName = mod.id.toUpperCase();
      }
    }

    // Get availability icon (CG or Tech Broker)
    const availabilityIcon = this._getAvailabilityIcon(mod);

    // Create the module element with box styling and margins
    list.push(
      <div key={mod.id}
           className={classNames}
           tabIndex={validSlot ? '0' : ''}
           data-id={mod.id}
           onClick={validSlot ? this._selectModule.bind(this, onSelect, mod) : null}
           onKeyDown={validSlot ? this._keyDown.bind(this, this._selectModule.bind(this, onSelect, mod)) : null}
           ref={slotItem => {
             if (slotItem) {
               this.slotItems.set(mod.id, slotItem);
             }
           }}>
        <div className="module-content"> {availabilityIcon}
          {mountIcon && <span className="module-mount">{mountIcon}</span>}
          <span className="module-text">{warningIcon} {displayName}</span>
        </div>
      </div>
    );
  }

  /**
   * Group modules by their type/category
   */
  _groupModulesByType(modules) {
    const groups = {};

    modules.forEach(mod => {
      let groupKey = this._getModuleGroupKey(mod);

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(mod);
    });

    return groups;
  }

  /**
   * Determine the group key for a module - use the actual module group from coriolis-data
   */
  _getModuleGroupKey(mod) {
    if (!mod) return 'other';

    // Use the actual group key from coriolis-data (mod.grp)
    const grp = mod.grp || 'other';
    return grp;
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
   * Scroll to the currently fitted module
   */
  _scrollToActiveModule() {
    if (!this.props.m || !this.node) return;

    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      const activeElement = this.node.querySelector(`[data-id="${this.props.m.id}"]`);
      if (activeElement) {
        // Calculate the position to center the element in the scrollable container
        const containerHeight = this.node.clientHeight;
        const elementTop = activeElement.offsetTop;
        const elementHeight = activeElement.offsetHeight;

        // Center the element in the visible area
        const scrollPosition = elementTop - (containerHeight / 2) + (elementHeight / 2);

        // Smooth scroll to the position
        this.node.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
      }
    });
  }

  /**
   * Create empty slot element
   */
  _createEmptySlotElement(emptyId, m, onSelect, translate) {
    return (
      <div key={emptyId}
           className={cn('empty-slot', { 'active': !m })}
           tabIndex='0'

           data-id={emptyId}
           onClick={onSelect.bind(null, null)}
           onKeyDown={this._keyDown.bind(this, onSelect.bind(null, null))}
           ref={slotItem => {
             if (slotItem) {
               this.slotItems.set(emptyId, slotItem);
             }
           }}>
        {translate('empty')}
      </div>
    );
  }

  /**
   * Hide the diff details popup
   */
  _hideDiff() {
    if (this.node) {
      this.node.classList.remove('show-diff');
    }
  }

  /**
   * Show the search/filter input
   */
  _showSearch() {
    this.setState({ searchActive: true }, () => {
      if (this.node) {
        let input = this.node.querySelector('.module-search input');
        if (input) {
          input.focus();
        }
      }
    });
  }

  /**
   * Handle search input changes
   */
  _handleSearchChange(e) {
    const searchQuery = e.target.value;
    this.setState({ searchQuery }, () => {
      this._filterModulesBySearch();
    });
  }

  /**
   * Filter modules based on search query
   * When searching, ignore category filters and search ALL modules
   */
  _filterModulesBySearch() {
    const { language, termtip, tooltip } = this.context;
    const { onSelect, m, eligible, warning, modules } = this.props;
    const { searchQuery } = this.state;
    const translate = language.translate;

    let list = [];
    let emptyId = 'empty';
    const isCoreInternal = this.props.className && this.props.className.includes('standard');

    // Filter modules based on search query
    const query = searchQuery.toLowerCase().trim();

    // When searching, we want to search ALL modules, not just the category-filtered ones
    // So we rebuild the allModules list from the original modules prop
    let allModulesForSearch = [];
    if (modules) {
      if (Array.isArray(modules)) {
        allModulesForSearch = modules.filter(this._shouldIncludeModule);
      } else if (typeof modules === 'object') {
        Object.keys(modules).forEach(groupKey => {
          const moduleGroup = modules[groupKey];

          if (Array.isArray(moduleGroup)) {
            const filteredModules = moduleGroup.filter(this._shouldIncludeModule);
            allModulesForSearch = allModulesForSearch.concat(filteredModules);
          } else if (moduleGroup && typeof moduleGroup === 'object') {
            const filteredModules = Object.keys(moduleGroup)
              .map(modKey => moduleGroup[modKey])
              .filter(this._shouldIncludeModule);
            allModulesForSearch = allModulesForSearch.concat(filteredModules);
          }
        });
      }
    }

    let filteredModules = allModulesForSearch;

    if (query) {
      filteredModules = allModulesForSearch.filter(mod => {
        // Search in module name
        if (mod.name && mod.name.toLowerCase().includes(query)) return true;

        // Search in module ID
        if (mod.id && mod.id.toLowerCase().includes(query)) return true;

        // Search in class/rating combination
        if (mod.class && mod.rating) {
          const classRating = `${mod.class}${mod.rating}`.toLowerCase();
          if (classRating.includes(query)) return true;
        }

        // Search in group name and category
        if (mod.grp) {
          // Search in the group display name
          const groupName = this._getGroupDisplayName(mod.grp, [mod]).toLowerCase();
          if (groupName.includes(query)) return true;

          // Search in the main category name (GRPCAT mapping)
          const mainCategory = GRPCAT[mod.grp] || '';
          if (mainCategory.toLowerCase().includes(query)) return true;

          // Search in the display category name (which might be different)
          // Find which main category this group belongs to
          let mainCategoryKey = null;

          for (const [categoryName, groupList] of Object.entries(HPTCAT)) {
            if (groupList.includes(mod.grp)) {
              mainCategoryKey = categoryName === 'experimental' ? 'hardpoint-experimental' :
                               categoryName === 'guardian' ? 'hardpoint-guardian' : categoryName;
              break;
            }
          }

          if (!mainCategoryKey) {
            for (const [categoryName, groupList] of Object.entries(INTCAT)) {
              if (groupList.includes(mod.grp)) {
                mainCategoryKey = categoryName;
                break;
              }
            }
          }

          if (mainCategoryKey) {
            const displayCategoryName = this._getMainCategoryDisplayName(mainCategoryKey).toLowerCase();
            if (displayCategoryName.includes(query)) return true;
          }
        }

        return false;
      });

      console.log(`Search for "${query}" found ${filteredModules.length} modules out of ${allModulesForSearch.length} (ignoring category filters)`);
    }

    // Process filtered modules
    if (filteredModules.length > 0) {
      this._processModules(filteredModules, list, onSelect, eligible, warning, termtip, tooltip, translate);
    } else if (query) {
      // Show "no results" message
      list.push(
        <div key="no-results" className="select-group" style={{ padding: '1em', color: '#999' }}>
          No modules found matching "{searchQuery}"
        </div>
      );
    }

    // Add empty option for non-core internal slots
    if (!isCoreInternal) {
      list.unshift(this._createEmptySlotElement(emptyId, m, onSelect, translate));
    }

    this.setState({ list });
  }

  /**
   * Update state based on context changes
   */
  componentDidMount() {
    this._scrollToActiveModule(); // Scroll to the currently fitted module
  }

  /**
   * Handle component updates
   */
  componentDidUpdate(prevProps) {
    // If the fitted module changed, scroll to the new active module
    if (prevProps.m !== this.props.m) {
      this._scrollToActiveModule();
    }
  }

  /**
   * Render component
   * @return {Object} React component
   */
  render() {
    let { className, selectedCategory, onBack } = this.props;
    let { list, searchQuery } = this.state;

    let classes = cn('select', className);

    // Determine if we should show search box
    // Show for optional internal, hardpoint, and utility slots (not for standard/core modules)
    const isCoreInternal = className && className.includes('standard');
    const showSearch = !isCoreInternal;

    // Show back button if a category is selected
    const showBackButton = selectedCategory && onBack;

    return (
      <div className={classes}
           ref={node => { this.node = node; }}
           onContextMenu={stopCtxPropagation}>
        {showBackButton && (
          <div
            className="back-button special-module c"
            onClick={(e) => {
              e.stopPropagation();
              onBack();
            }}
            onKeyDown={this._keyDown.bind(this, onBack)}
            tabIndex="0"
          >
            <div className="module-content">
              <span className="module-text">← Back to Categories</span>
            </div>
          </div>
        )}
        {showSearch && (
          <div className="module-search-container">
            <input
              ref={this.searchInputRef}
              type="text"
              className="module-search-input"
              placeholder="Search modules..."
              value={searchQuery}
              onChange={this._handleSearchChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        {list}
      </div>
    );
  }
}
