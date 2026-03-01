import React from 'react';
import PropTypes from 'prop-types';
import TranslatedComponent from './TranslatedComponent';

/**
 * Export Modal with support for multiple formats
 */
export default class ModalExport extends TranslatedComponent {

  static propTypes = {
    title: PropTypes.string,
    generator: PropTypes.func,
    data: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.array]),
    formats: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      data: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.array]).isRequired
    }))
  };

  /**
   * Constructor
   * @param  {Object} props   React Component properties
   */
  constructor(props) {
    super(props);

    let exportJson;
    let formats = [];

    if (props.formats) {
      // Multiple formats provided
      formats = props.formats;
      exportJson = typeof formats[0].data === 'string' ? formats[0].data : JSON.stringify(formats[0].data, null, 2);
    } else if (props.generator) {
      exportJson = 'Generating...';
    } else if(typeof props.data == 'string') {
      exportJson = props.data;
    } else {
      exportJson = JSON.stringify(this.props.data, null, 2);
    }

    this.state = {
      exportJson,
      formats,
      selectedFormat: 0
    };
  }

  /**
   * If generator is provided, execute on mount
   */
  UNSAFE_componentWillMount() {
    if (this.props.generator) {
      this.props.generator((str) => this.setState({ exportJson: str }));
    }
  }

  /**
   * Focus on textarea and select all
   */
  componentDidMount() {
    if (this.exportField) {
      this.exportField.focus();
      this.exportField.select();
    }
  }

  /**
   * Handle format selection change
   * @param {number} index Format index
   */
  _selectFormat(index) {
    const format = this.state.formats[index];
    const exportJson = typeof format.data === 'string' ? format.data : JSON.stringify(format.data, null, 2);
    this.setState({ selectedFormat: index, exportJson }, () => {
      if (this.exportField) {
        this.exportField.focus();
        this.exportField.select();
      }
    });
  }

  /**
   * Render the modal
   * @return {React.Component} Modal Content
   */
  render() {
    let translate = this.context.language.translate;
    let description;

    if (this.props.description) {
      description = <div>{translate(this.props.description)}</div>;
    }

    let formatButtons = null;
    if (this.state.formats.length > 1) {
      formatButtons = (
        <div className='format-selector' style={{ marginBottom: '0.5em' }}>
          {this.state.formats.map((format, index) => (
            <button
              key={index}
              className={this.state.selectedFormat === index ? 'selected' : ''}
              onClick={() => this._selectFormat(index)}
              style={{
                marginRight: '0.5em',
                fontWeight: this.state.selectedFormat === index ? 'bold' : 'normal'
              }}
            >
              {format.name}
            </button>
          ))}
        </div>
      );
    }

    return <div className='modal' onClick={ (e) => e.stopPropagation() }>
      <h2>{translate(this.props.title || 'Export')}</h2>
      {description}
      {formatButtons}
      <div>
        <textarea className='cb json' ref={node => this.exportField = node} readOnly value={this.state.exportJson} />
      </div>
      <button className='r dismiss cap' onClick={this.context.hideModal}>{translate('close')}</button>
    </div>;
  }
}
