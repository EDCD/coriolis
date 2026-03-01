import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import cn from 'classnames';
import AvailableModulesMenu from './AvailableModulesMenu';
import CategoryMenu from './CategoryMenu';
import ModificationsMenu from './ModificationsMenu';
import { diffDetails } from '../utils/SlotFunctions';
import { wrapCtxMenu } from '../utils/UtilityFunctions';
import { canMount } from '../utils/SlotFunctions';

/**
 * Abstract Slot
 */
export default class Slot extends TranslatedComponent {

  static propTypes = {
    availableModules: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    maxClass: PropTypes.number.isRequired,
    selected: PropTypes.bool,
    slot: PropTypes.object, // Add slot prop
    m: PropTypes.object,
    enabled: PropTypes.bool.isRequired,
    ship: PropTypes.object.isRequired,
    eligible: PropTypes.object,
    warning: PropTypes.func,
    drag: PropTypes.func,
    drop: PropTypes.func,
    dropClass: PropTypes.string
  };

  /**
   * Default warning function if none provided
   * @param {object} module The module to check
   * @return {React.Component|null} Warning icon or null
   */
  _warning(module) {
    // Return null if no warning needed
    return null;
  }

  /**
   * Check if a module is eligible for this slot
   * Since availableModules() already filters based on slot restrictions,
   * this function just needs to return true for all modules in the list
   * @param {object} module The module to check
   * @return {boolean} Whether the module can be mounted
   */
  _eligible(module) {
    // All modules passed to AvailableModulesMenu are already pre-filtered
    // by the availableModules() function based on slot.eligible restrictions
    return true;
  }

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);

    this._modificationsSelected = false;
    this._selectedCategory = null;
    this._showCategoryMenu = false; // Track whether to show category menu

    this._contextMenu = wrapCtxMenu(this._contextMenu.bind(this));
    this._getMaxClassLabel = this._getMaxClassLabel.bind(this);
    this._keyDown = this._keyDown.bind(this);
    this._eligible = this._eligible.bind(this);
    this._warning = this._warning.bind(this);
    this._onSelectCategory = this._onSelectCategory.bind(this);
    this._onBackToCategories = this._onBackToCategories.bind(this);
    this.slotDiv = null;
  }

  /**
   * Handle category selection
   * @param {string} category The selected category
   */
  _onSelectCategory(category) {
    this._selectedCategory = category;
    this._showCategoryMenu = false; // We've selected a category, so show the modules menu
    this.forceUpdate();
  }

  /**
   * Handle back button to return to category menu
   */
  _onBackToCategories() {
    this._selectedCategory = null;
    this._showCategoryMenu = true; // User clicked back, so show the category menu
    this.forceUpdate();
  }

  // Must be implemented by subclasses:
  // _getSlotDetails()

  /**
   * Get the CSS class name for the slot. Can/should be overriden
   * as necessary.
   * @return {string} CSS Class name
   */
  _getClassNames() {
    return null;
  }

  /**
   * Get the label for the slot size/class
   * Should be overriden if necessary
   * @return {string} label
   */
  _getMaxClassLabel() {
    return this.props.maxClass;
  }

  /**
   * Empty slot on right-click
   * @param  {SyntheticEvent} event Event
   */
  _contextMenu(event) {
    event.stopPropagation();
    event.preventDefault();
    this.props.onSelect(null,null);
  }

  /** Key Down handler
   *  @param {SyntheticEvent} event Event
   *  ToDo: see if this can be moved up
   *  we do more or less the same thing
   *  in every section when Enter key is pressed
   *  on a focusable item
   *
   */
  _keyDown(event) {
    if (event.key == 'Enter') {
      if(event.target.className == 'r') {
        this._toggleModifications();
      }
      this.props.onOpen(event);
    }
  }
  /**
   * Render the slot
   * @return {React.Component} The slot
   */
  render() {
    let language = this.context.language;
    let translate = language.translate;
    let { ship, m, enabled, dropClass, dragOver, onOpen, onChange, selected, eligible, onSelect, warning, availableModules } = this.props;
    let slotDetails, modificationsMarker, menu;
    let missing = false;

    // Only reset flags if we're transitioning from selected to not selected
    // Track previous selected state to detect transitions
    const wasSelected = this._wasSelected;
    this._wasSelected = selected;

    if (!selected && wasSelected) {
      // Slot was just deselected, reset flags
      this._modificationsSelected = false;
      this._selectedCategory = null;
      this._showCategoryMenu = false;
    }

    if (m) {
      slotDetails = this._getSlotDetails(m, enabled, translate, language.formats, language.units);  // Must be implemented by sub classes
      modificationsMarker = JSON.stringify(m);
      if(typeof m.grp !== 'undefined' || m.grp !== null) {
        if(m.grp == "mh" || m.grp == "mm") {
          missing = true;
        }
      }
    } else {
      slotDetails = <div className={'empty'}>{translate(eligible ? 'emptyrestricted' : 'empty')}</div>;
      modificationsMarker = '';
    }

    if (selected) {
      if (this._modificationsSelected) {
        // Show modifications menu
        menu = <ModificationsMenu
          className={this._getClassNames()}
          onChange={onChange}
          ship={ship}
          m={m}
          marker={modificationsMarker}
          modButton = {this.modButton}
        />;
      } else if (this._showCategoryMenu) {
        // User clicked back or this is an empty slot - show category menu
        menu = <CategoryMenu
          className={this._getClassNames()}
          modules={availableModules()}
          maxClass={this.props.maxClass}
          eligible={this._eligible}
          slot={this.props.slot}
          onSelectCategory={this._onSelectCategory}
          onSelectModule={onSelect}
          m={m}
          ship={ship}
          warning={warning || this._warning}
        />;
      } else if (this._selectedCategory) {
        // User selected a specific category - show modules filtered by that category with back button
        menu = <AvailableModulesMenu
          className={this._getClassNames()}
          modules={availableModules()}
          m={m}
          ship={ship}
          onSelect={onSelect}
          warning={warning || this._warning}
          diffDetails={diffDetails.bind(ship, this.context.language)}
          eligible={this._eligible}
          slotDiv = {this.slotDiv}
          selectedCategory={this._selectedCategory}
          onBack={this._onBackToCategories}
        />;
      } else if (m) {
        // Module already fitted and no category selected yet - show modules in same category with back button
        menu = <AvailableModulesMenu
          className={this._getClassNames()}
          modules={availableModules()}
          m={m}
          ship={ship}
          onSelect={onSelect}
          warning={warning || this._warning}
          diffDetails={diffDetails.bind(ship, this.context.language)}
          eligible={this._eligible}
          slotDiv = {this.slotDiv}
          selectedCategory={'current'}
          onBack={this._onBackToCategories}
        />;
      } else {
        // Empty slot and no category selected - show category menu
        this._showCategoryMenu = true; // Ensure the flag is set for empty slots
        menu = <CategoryMenu
          className={this._getClassNames()}
          modules={availableModules()}
          maxClass={this.props.maxClass}
          eligible={this._eligible}
          slot={this.props.slot}
          onSelectCategory={this._onSelectCategory}
          onSelectModule={onSelect}
          m={m}
          ship={ship}
          warning={warning || this._warning}
        />;
      }
    }

    // TODO: implement touch dragging

    return (
      <div className={cn('slot', dropClass, { selected })} onClick={onOpen} onKeyDown={this._keyDown} onContextMenu={this._contextMenu} onDragOver={dragOver} tabIndex="0" ref={slotDiv => this.slotDiv = slotDiv}>
        {
          // If missing module/hardpoint, set the div container to warning status.
        }
        <div className={ missing === true ? 'details-container warning' : 'details-container'}>
          <div className='sz'>{this._getMaxClassLabel(translate)}</div>
            {slotDetails}
          </div>
        <div className={cn('menu-section-wrapper', { open: selected && menu })}>
          {menu}
        </div>
      </div>
    );
  }


  /**
   * Toggle the modifications flag when selecting the modifications icon
   * @param {SyntheticEvent} event Event (optional)
   */
  _toggleModifications(event) {
    // Clear any lingering tooltip (e.g. from experimental effects)
    if (this.context.tooltip) {
      this.context.tooltip(null);
    }

    if (this.props.selected && this._modificationsSelected) {
      // Closing engineering menu — reset the flag and let the click
      // bubble up to onOpen, which will deselect the slot entirely
      this._modificationsSelected = false;
      return;
    }

    // Opening engineering menu
    this._modificationsSelected = true;

    // If slot is already selected, stop propagation and just force update
    // Otherwise let it bubble to select the slot first
    if (this.props.selected) {
      if (event) {
        event.stopPropagation();
      }
      this.forceUpdate();
    }
    // If not selected, let the event bubble so slot gets selected
    // and when it re-renders, _modificationsSelected will be true
  }
}
