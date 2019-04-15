import React, { Component } from 'react';
import Visualizations from './Visualizations';
import memoize from 'memoize-one';
import './App.css';

class App extends Component {
  state = {
    geoPollingStations: null,
    cvkPollingStationsEntireList: null,
  }

  constructor(props) {
    super(props);
    this.getGeoActivePollingStations = memoize(this.getGeoActivePollingStations);
  }

  async componentDidMount() {
    await Promise.all([
      this.loadGeo(),
      this.loadCVKPollingStations(),
    ]);
  }

  async loadGeo() {
    const response = await fetch('./static-data/geo-polling-stations.json');
    const geoPollingStations = await response.json();
    this.setState({ geoPollingStations });
  }

  async loadCVKPollingStations() {
    const response = await fetch('./static-data/cvk-polling-stations-entire-list.json');
    const cvkPollingStationsEntireList = await response.json();
    this.setState({ cvkPollingStationsEntireList });
  }

  getGeoActivePollingStations(geoPollingStations, cvkPollingStationsEntireList) {
    if (geoPollingStations === null || cvkPollingStationsEntireList === null) {
      return [];
    }

    if (cvkPollingStationsEntireList === null) {
      return [];
    }

    const indexedCVKPollingStationsEntireList = {};
    for (const row of cvkPollingStationsEntireList.data) {
      const key = row.join(':');
      indexedCVKPollingStationsEntireList[key] = row;
    }

    return geoPollingStations.filter(ps => indexedCVKPollingStationsEntireList[ps.okrugNumber + ':' + ps.numberNormalized] !== undefined);
  }  

  render() {
    const { geoPollingStations, cvkPollingStationsEntireList } = this.state;
    const geoActivePollingStations = this.getGeoActivePollingStations(geoPollingStations, cvkPollingStationsEntireList);
    return (
      <div className="App">
        <Visualizations 
          geoActivePollingStations={geoActivePollingStations}
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
