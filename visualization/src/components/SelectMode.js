import React, { PureComponent } from 'react';

export const options = [
  {value: 'cvk---all-active', label: 'ЦВК: Усi дiльницi'},
  {value: 'e-vybory---has-data---step-1', label: 'e-Vybory.org: Наявність оцифрованих протоколів (1 тур - 31.03.2019)'},
  {value: 'e-vybory---has-data---step-1---okrugs', label: 'e-Vybory.org: По округам: Наявність оцифрованих протоколів (1 тур - 31.03.2019)'},
  {value: 'e-vybory---top-2---step-1', label: 'e-Vybory.org: Результати 2 лiдерiв оцифрованих протоколів (1 тур - 31.03.2019)'},
  {value: 'e-vybory---top-2-errors---step-1', label: 'e-Vybory.org: Результати 2 лiдерiв оцифрованих протоколів з помилками (1 тур - 31.03.2019)'},
];

const defaultMode = 'e-vybory---has-data---step-1';

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
    const title = mode && options.find(({ value }) => value === mode)['label'];
    return (
      <div className="form-group row">
        <label htmlFor="visualization-mode" className="col-form-label col-auto">Звiт</label>
        <div className="col">
          <select value={mode} onChange={this.onChange} id="visualization-mode" className="form-control" title={title}>
            {options.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }
}

export default SelectMode;