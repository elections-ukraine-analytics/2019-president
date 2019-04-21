import React, { Component } from 'react';
import Visualizations from './components/Visualizations';
import './App.css';

class App extends Component {
  state = {
    geoPollingStationsLocations: null,
    geoOkrugs: null,
  };

  async componentDidMount() {
    await Promise.all([
      this.loadGeo(),
      this.loadGeoOkrugs(),
    ]);
    
  }

  async loadGeo() {
    const response = await fetch('./static-data/geo-polling-stations-locations.json');
    const geoPollingStationsLocations = await response.json();
    this.setState({ geoPollingStationsLocations });
  }

  async loadGeoOkrugs() {
    const response = await fetch('./static-data/geo-okrugs.json');
    const geoOkrugs = await response.json();
    this.setState({ geoOkrugs });
  }

  render() {
    const { geoPollingStationsLocations, geoOkrugs } = this.state;
    return (
      <div className="App">
        <div className="layout--title p-3">
          Аналiтика Виборiв Президента 2019 (Elections Ukraine Analytics - 2019 President)
        </div>
        <Visualizations 
          geoPollingStationsLocations={geoPollingStationsLocations}
          geoOkrugs={geoOkrugs}
        />
      </div>
    );
  }
}

export default App;
