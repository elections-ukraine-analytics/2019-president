import React, { PureComponent } from 'react';
import { colors } from './Visualizations';

export const options = [
  {value: '2-colors', label: 'Два кольори'},
  {value: 'interpolate', label: 'Інтерпольовані кольори'},
];

const defaultMode = '2-colors';

class SelectModeColors extends PureComponent {
  state = {
    mode: defaultMode,
  };

  componentDidMount() {
    const { mode } = this.state;
    const { onChange } = this.props;
    if (onChange) {
      onChange(mode);
    }
  }

  onChange = (e) => {
    const { value } = e.target;
    const { onChange } = this.props;
    this.setState({ mode: value });
    if (onChange) {
      onChange(value);
    }
  }

  render() {
    const { mode } = this.state;
    const title = mode && options.find(({ value }) => value === mode)['label'];
    return (
      <>
        <div className="form-group row">
          <label htmlFor="visualization-mode-color" className="col-form-label col-auto">Кольори</label>
          <div className="col">
            <select value={mode} onChange={this.onChange} id="visualization-mode-color" className="form-control" title={title}>
              {options.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
        {mode === 'interpolate' &&
          <div>
            <div className="card">
                <div className="card-body">
                  <div>Iнтерпольований колiр показує наскiльки велика дiстанцiя мiж двома кандидатами, та на чью користь.</div>
                  <div>Палiтра:</div>
                  <div className="votes-indicator" style={{ 
                    background: `linear-gradient(
                      to right, 
                      ${colors.p},
                      ${colors.p170neutralBright} 45%,
                      ${colors.neutralBright},
                      ${colors.z170neutralBright} 55%,
                      ${colors.z}
                    )`,
                  }}></div>
                </div>
            </div>
          </div>
        }
      </>
    );
  }
}

export default SelectModeColors;