import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';
import Link from './Link';
import cn from 'classnames';
import { outfitURL } from '../utils/UrlGenerators';


/**
 * Comparison Table
 */
export default class ComparisonTable extends TranslatedComponent {
  static propTypes = {
    facets: PropTypes.array.isRequired,
    builds: PropTypes.array.isRequired,
    onSort: PropTypes.func.isRequired,
    predicate: PropTypes.string.isRequired, // Used only to test again prop changes for shouldRender
    desc: PropTypes.oneOfType([PropTypes.bool.isRequired, PropTypes.number.isRequired]), // Used only to test again prop changes for shouldRender
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   * @param  {Object} context React Component context
   */
  constructor(props, context) {
    super(props, context);
    this._buildHeaders = this._buildHeaders.bind(this);
    this.state = this._buildHeaders(props.facets, props.onSort, context.language.translate);
  }

  /**
   * Build table headers
   * @param  {Array} facets        Facets list
   * @param  {Function} onSort      Sort callback
   * @param  {Function} translate   Translate function
   * @return {Object}               Header Components
   */
  _buildHeaders(facets, onSort, translate) {
    let header = [
      <th key='ship' rowSpan='2' className='sortable' onClick={onSort.bind(null, 'name')}>{translate('ship')}</th>,
      <th key='build' rowSpan='2' className='sortable' onClick={onSort.bind(null, 'buildName')}>{translate('build')}</th>
    ];
    let subHeader = [];

    for (let f of facets) {
      if (f.active) {
        let p = f.props;
        let pl = p.length;
        header.push(<th key={f.title} rowSpan={pl === 1 ? 2 : 1} colSpan={pl} className={cn({ sortable: pl === 1 })} onClick={pl === 1 ? onSort.bind(null, p[0]) : null }>
          {translate(f.title)}
        </th>);

        if (pl > 1) {
          for (let i = 0; i < pl; i++) {
            subHeader.push(<th key={p[i]} className={cn('sortable', { lft: i === 0 })} onClick={onSort.bind(null, p[i])} >{translate(f.lbls[i])}</th>);
          }
        }
      }
    }

    return { header, subHeader };
  }

  /**
   * Generate a table row for the build
   * @param  {Object} build       Ship build
   * @param  {Array} facets       Facets list
   * @param  {Object} formats     Localized formats map
   * @param  {Object} units       Localized untis map
   * @return {React.Component}    Table row
   */
  _buildRow(build, facets, formats, units) {
    if (build && build.id && build.buildName) {
      let url = outfitURL(build.id, build.toString(), build.buildName);
      let cells = [
        <td key='s' className='tl'><Link href={url}>{build.name}</Link></td>,
        <td key='bn' className='tl'><Link href={url}>{build.buildName}</Link></td>
      ];

      for (let f of facets) {
        if (f.active) {
          for (let p of f.props) {
            cells.push(<td key={p}>{formats[f.fmt](build[p])}{f.unit ? units[f.unit] : null}</td>);
          }
        }
      }
      return <tr key={build.id + build.buildName} className='tr'>{cells}</tr>;
    }
  }

  /**
   * Update state based on property and context changes
   * @param  {Object} nextProps   Incoming/Next properties
   * @param  {Object} nextContext Incoming/Next conext
   */
  UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
    // If facets or language has changed re-render header
    if (nextProps.facets != this.props.facets || nextContext.language != this.context.language) {
      this.setState(this._buildHeaders(nextProps.facets, nextProps.onSort, nextContext.language.translate));
    }
  }

  /**
   * Render the table
   * @return {React.Component} Comparison table
   */
  render() {
    let { builds, facets } = this.props;
    let { header, subHeader } = this.state;
    let { formats, units } = this.context.language;

    let buildsRows = new Array(builds.length);

    for (let i = 0, l = buildsRows.length; i < l; i++) {
      buildsRows[i] = this._buildRow(builds[i], facets, formats, units);
    }

    return (
      <div className='scroll-x'>
        <table id='comp-tbl'>
          <thead>
            <tr className='main'>{header}</tr>
            <tr>{subHeader}</tr>
          </thead>
          <tbody>
            {buildsRows}
          </tbody>
        </table>
      </div>
    );
  }
}
