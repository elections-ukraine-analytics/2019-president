import React, { PureComponent } from 'react';

export const options = [
  {value: 'cvk---all-active', label: 'ЦВК: Усi дiльницi'},
  {value: 'e-vybory---has-photo', label: 'e-Vybory.org: Наявність фотокопій протоколів'},
];

const defaultMode = 'e-vybory---has-photo';

class SelectMode extends PureComponent {
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
    return (
      <div className="p-3">
        <div className="form-group row">
          <label htmlFor="visualization-mode" className="col-form-label col-auto">Оберiть</label>
          <div className="col">
            <select value={mode} onChange={this.onChange} id="visualization-mode" className="form-control">
              {options.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }
}

export default SelectMode;