import React, { Component } from 'react';
import Visualizations from './Visualizations';
import './App.css';

class App extends Component {
  state = {
    geoPollingStationsLocations: null,
  };

  async componentDidMount() {
    await Promise.all([
      this.loadGeo(),
    ]);
  }

  async loadGeo() {
    const response = await fetch('./static-data/geo-polling-stations-locations.json');
    const geoPollingStationsLocations = await response.json();
    this.setState({ geoPollingStationsLocations });
  }

  render() {
    const { geoPollingStationsLocations } = this.state;
    return (
      <div className="App">
        <Visualizations 
          geoPollingStationsLocations={geoPollingStationsLocations}
        />
        <div className="small">
          Джерела інформації:
          {' '}
          <a href="https://e-vybory.org/export/" rel="noopener noreferrer" target="_blank">ГО «Електронна демократія»</a>
          {' | '}
          <a href="https://cvk.gov.ua/pls/vp2019/wp001.html" rel="noopener noreferrer" target="_blank">ЦВК - WWW ІАС "Вибори Президента України"</a>
          {' | '}
          <a href="https://www.drv.gov.ua/ords/portal/!cm_core.cm_index?option=ext_dvk&amp;prejim=3" rel="noopener noreferrer" target="_blank">Державний реєстр виборців</a>
          {' '}
          Розробник:
          {' '}
          <a href="https://github.com/elections-ukraine-analytics/2019-president" rel="noopener noreferrer" target="_blank">GitHub</a>
          {', '}
          <a href="mailto:e.control.2019.ak@gmail.com">e.control.2019.ak@gmail.com</a>
        </div>
      </div>
    );
  }
}

export default App;
