import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import { wrapCtxMenu } from '../utils/UtilityFunctions';
import { canMount } from '../utils/SlotFunctions';
import { Equalizer } from '../components/SvgIcons';
import cn from 'classnames';
const browser = require('detect-browser');

/**
 * Abstract Slot Section
 */
export default class SlotSection extends TranslatedComponent {

  static propTypes = {
    ship: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    onCargoChange: PropTypes.func.isRequired,
    onFuelChange: PropTypes.func.isRequired,
    code: PropTypes.string.isRequired,
    togglePwr: PropTypes.func,
    sectionMenuRefs: PropTypes.object
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   * @param  {string} sectionId   Section DOM Id
   * @param  {string} sectionName Section name
   */
  constructor(props, context, sectionId, sectionName) {
    super(props);
    this.sectionId = sectionId;
    this.sectionName = sectionName;
    this.ssHeadRef = null;
    
    this.sectionRefArr = this.props.sectionMenuRefs[this.sectionId] = [];
    this.sectionRefArr['selectedRef'] = null;
    this._getSlots = this._getSlots.bind(this);
    this._selectModule = this._selectModule.bind(this);
    this._getSectionMenu = this._getSectionMenu.bind(this);
    this._contextMenu = this._contextMenu.bind(this);
    this._drop = this._drop.bind(this);
    this._dragOverNone = this._dragOverNone.bind(this);
    this._close = this._close.bind(this);
    this._keyDown = this._keyDown.bind(this);
    this._handleSectionFocus = this._handleSectionFocus.bind(this);
    this.state = {};
  }

  // Must be implemented by subclasses:
  //  _getSlots()
  //  _getSectionMenu()
  //  _contextMenu()
  //  componentDidUpdate(prevProps)

  /** 
   * TODO: May either need to send the function to be triggered when Enter key is pressed, or else 
   * may need a separate keyDown handler for each subclass (StandardSlotSection, HardpointSlotSection, etc.)
   * ex: _keyDown(_keyDownfn, event)
   * 
   * @param {SyntheticEvent} event KeyDown event
   */
  _keyDown(event) {
    if (event.key == 'Enter') {
      event.stopPropagation();
      if (event.currentTarget.nodeName === 'H1') {
        this._openMenu(this.sectionName, event);
      } else {
        event.currentTarget.click();
      }
      return;
    }
    if (event.key == 'Tab') {
      if (event.shiftKey) {
        if ((event.currentTarget === this.sectionRefArr[this.firstRefId]) && this.sectionRefArr[this.lastRefId]) {
          event.preventDefault();
          this.sectionRefArr[this.lastRefId].focus();
        }
      } else {
        if ((event.currentTarget === this.sectionRefArr[this.lastRefId]) &&  this.sectionRefArr[this.firstRefId]) {
          event.preventDefault();
          this.sectionRefArr[this.firstRefId].focus();
        }
      }
    }
  } 

  /**
   * Set focus on appropriate Slot Section Menu element
   * @param {Object} focusPrevProps prevProps for componentDidUpdate() from ...SlotSection.jsx 
   * @param {String} firstRef id of the first ref in ...SlotSection.jsx
   * @param {String} lastRef id of the last ref in ...SlotSection.jsx
   * 
   */
  _handleSectionFocus(focusPrevProps, firstRef, lastRef) {
    if (this.selectedRefId !== null && this.sectionRefArr[this.selectedRefId]) {
      // set focus on the previously selected option for the currently open section menu
      this.sectionRefArr[this.selectedRefId].focus();
    } else if (this.sectionRefArr[firstRef] && this.sectionRefArr[firstRef] != null) {
      // set focus on the first option in the currently open section menu if none have been selected previously
      this.sectionRefArr[firstRef].focus();
    }  else if (this.props.currentMenu == null && focusPrevProps.currentMenu == this.sectionName && this.sectionRefArr['ssHeadRef']) {
      // set focus on the section menu header when section menu is closed
      this.sectionRefArr['ssHeadRef'].focus();
    }
  }
  /**
   * Open a menu
   * @param  {string} menu    Menu name
   * @param  {SyntheticEvent} event Event
   */
  _openMenu(menu, event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.props.currentMenu === menu) {
      menu = null;
    }
    this.context.openMenu(menu);
  }

  /**
   * Mount/Use the specified module in the slot
   * @param  {Object} slot Slot
   * @param  {Object} m    Selected module
   */
  _selectModule(slot, m) {
    this.props.ship.use(slot, m, false);
    this.props.onChange();
    this._close();
  }

  /**
   * Slot Drag Handler
   * @param  {object} originSlot Origin slot model
   * @param  {Event} e           Drag Event
   */
  _drag(originSlot, e) {
    if (!browser || (browser.name !== 'edge' && browser.name !== 'ie')) {
      e.dataTransfer.setData('text/html', e.currentTarget);
    }
    e.dataTransfer.effectAllowed = 'copyMove';
    this.setState({ originSlot, copy: e.getModifierState('Alt') });
    this._close();
  }

  /**
   * Slot Drag Over Handler
   * @param  {object} targetSlot Potential drop target
   * @param  {Event} e           Drag Event
   */
  _dragOverSlot(targetSlot, e) {
    e.preventDefault();
    e.stopPropagation();
    let os = this.state.originSlot;
    if (os) {
      // Show correct icon
      const effect = this.state.copy ? 'copy' : 'move';
      if (!browser || (browser.name !== 'edge' && browser.name !== 'ie')) {
        e.dataTransfer.dropEffect = os != targetSlot && canMount(this.props.ship, targetSlot, os.m.grp, os.m.class) ? effect : 'none';
      }
      this.setState({ targetSlot });
    } else {
      if (!browser || (browser.name !== 'edge' && browser.name !== 'ie')) {
        e.dataTransfer.dropEffect = 'none';
      }
    }
  }

  /**
   * Drag over non-droppable target/element
   * @param  {Event} e   Drag Event
   */
  _dragOverNone(e) {
    e.preventDefault();
    if (!browser || (browser.name !== 'edge' && browser.name !== 'ie')) {
      e.dataTransfer.dropEffect = 'none';
    }
    this.setState({ targetSlot: null });
  }

  /**
   * Slot drop handler. If the target is eligible swap the origin and target modules.
   * If the target slot's current module cannot be mounted in the origin slot then
   * the origin slot will be empty.
   */
  _drop() {
    let { originSlot, targetSlot, copy } = this.state;
    let m = originSlot.m;

    if (targetSlot && originSlot != targetSlot) {
      if (copy) {
        // We want to copy the module in to the target slot
        if (targetSlot && canMount(this.props.ship, targetSlot, m.grp, m.class)) {
          const mCopy = m.clone();
          this.props.ship.use(targetSlot, mCopy, false);
          // Copy power info
          targetSlot.enabled = originSlot.enabled;
          targetSlot.priority = originSlot.priority;
          this.props.onChange();
        }
      } else {
        // Store power info
        const originEnabled = targetSlot.enabled;
        const originPriority = targetSlot.priority;
        const targetEnabled = originSlot.enabled;
        const targetPriority = originSlot.priority;
        // We want to move the module in to the target slot, and swap back any module that was originally in the target slot
        if (targetSlot && m && canMount(this.props.ship, targetSlot, m.grp, m.class)) {
          // Swap modules if possible
          if (targetSlot.m && canMount(this.props.ship, originSlot, targetSlot.m.grp, targetSlot.m.class)) {
            this.props.ship.use(originSlot, targetSlot.m, true);
            this.props.ship.use(targetSlot, m);
            // Swap power
            originSlot.enabled = originEnabled;
            originSlot.priority = originPriority;
            targetSlot.enabled = targetEnabled;
            targetSlot.priority = targetPriority;
          } else { // Otherwise empty the origin slot
            // Store power
            const targetEnabled = originSlot.enabled;
            this.props.ship.use(originSlot, null, true);  // Empty but prevent summary update
            this.props.ship.use(targetSlot, m);
            originSlot.enabled = 0;
            originSlot.priority = 0;
            targetSlot.enabled = targetEnabled;
            targetSlot.priority = targetPriority;
          }
          this.props.onChange();
        }
      }
    }
    this.setState({ originSlot: null, targetSlot: null, copy: null });
  }

  /**
   * Determine drop eligibilty CSS class
   * @param  {Object} slot       Current slot
   * @param  {Object} originSlot Origin slot
   * @param  {Object} targetSlot Target slot
   * @return {string} CSS Class name
   */
  _dropClass(slot, originSlot, targetSlot) {
    if (!originSlot) {
      return null;
    }
    if (slot === originSlot) {
      if (targetSlot && targetSlot.m && !canMount(this.props.ship, originSlot, targetSlot.m.grp, targetSlot.m.class)) {
        return 'dropEmpty'; // Origin slot will be emptied
      }
      return null;
    }
    if (originSlot.m && canMount(this.props.ship, slot, originSlot.m.grp, originSlot.m.class)) { // Eligble drop slot
      if (slot === targetSlot) {
        return 'drop';  // Can drop
      }
      return 'eligible';  // Potential drop slot
    }

    return 'ineligible';  // Cannot be dropped / invalid drop slot
  }

  /**
   * Close current menu
   */
  _close() {
    if (this.props.currentMenu) {
      this.context.closeMenu();
    }
  }

  /**
   * Render the slot section
   * @return {React.Component} Slot section
   */
  render() {
    let translate = this.context.language.translate;
    let sectionMenuOpened = this.props.currentMenu === this.sectionName;
    let open = this._openMenu.bind(this, this.sectionName);
    let ctx = wrapCtxMenu(this._contextMenu);

    return (
      <div id={this.sectionId} className={'group'}  onDragLeave={this._dragOverNone}>
        <div className={cn('section-menu', { selected: sectionMenuOpened })} onClick={open} onContextMenu={ctx}>
          <h1 tabIndex="0" onKeyDown={this._keyDown} ref={ssHead => this.sectionRefArr['ssHeadRef'] = ssHead}>{translate(this.sectionName)} <Equalizer/></h1>
          {sectionMenuOpened ? this._getSectionMenu(translate, this.props.ship) : null }
        </div>
        {this._getSlots()}
      </div>
    );
  }
}
