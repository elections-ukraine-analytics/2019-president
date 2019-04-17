import React, { Component } from 'react';
import memoize from 'memoize-one';
import Map from '../Map';
import SelectMode from '../SelectMode';
import Details from '../Details';
import './index.css';

const circleRadius = {
  base: 1.75,
  stops: [[5, 4], [22, 180]],
};
const circleOpacity = {
  base: 0.4,
  stops: [[6, 0.4], [8, 1]],
};


class Visualizations extends Component {
  state = {
    dataEVyboryProtocolsUploaded: null,
    mode: null,
    dataLoaded: false,
    allowDetailsLoading: false,
    stationKey: undefined,
  }

  constructor(props) {
    super(props);
    this.layerCVKAllActive = memoize(this.layerCVKAllActive);
    this.layerEVyboryHasPhoto = memoize(this.layerEVyboryHasPhoto);
  }

  async componentDidMount() {
    const response = await fetch('./data/protocols-is-uploaded.json');
    const dataEVyboryProtocolsUploaded = await response.json();
    this.setState({ dataEVyboryProtocolsUploaded, dataLoaded: true }, this.testAllowDetailsLoading);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.geoPollingStationsLocations === null && this.props.geoPollingStationsLocations !== null) {
      this.testAllowDetailsLoading();
    }
  }

  testAllowDetailsLoading() {
    if (this.props.geoPollingStationsLocations === null || this.state.dataLoaded === false) {
      return;
    }

    this.setState({ allowDetailsLoading: true });
  }

  getDataLayers() {
    const { geoPollingStationsLocations } = this.props;
    const { mode } = this.state;

    if (mode === null || geoPollingStationsLocations === null) {
      return [];
    }

    switch (mode) {
      case 'cvk---all-active':
        return this.layerCVKAllActive(geoPollingStationsLocations);
      case 'e-vybory---has-photo':
        const { dataEVyboryProtocolsUploaded } = this.state;
        return this.layerEVyboryHasPhoto(geoPollingStationsLocations, dataEVyboryProtocolsUploaded);
      default:
        console.error('Unknown visualization mode - ' + mode);
        return [];
    }
  }

  onChangeMode = (mode) => {
    this.setState({ mode });
  }

  layerCVKAllActive(geoPollingStationsLocations) {
    const geoJson =  {
      type: "FeatureCollection",
      features: 
        Object.keys(geoPollingStationsLocations)
        .filter(key => geoPollingStationsLocations[key] !== null)
        .map(key => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: geoPollingStationsLocations[key],
          },
          properties: {
            stationKey: key,
          }
        })),
    };

    const result = [{
      id: 'data-circle',
      type: 'circle',
      source: {
        type: 'geojson',
        data: geoJson,
      },
      layout: {},
      paint: {
        'circle-radius': circleRadius,
        'circle-opacity': circleOpacity,
        'circle-color': '#fbb03b',
      },
    }];
    return result;
  }

  layerEVyboryHasPhoto(geoPollingStationsLocations, dataEVyboryProtocolsUploaded) {
    if (dataEVyboryProtocolsUploaded === null) {
      return [];
    }

    const indexedUploads = {};
    for (const row of dataEVyboryProtocolsUploaded.status) {
      const key = [row[0], row[1]].join(':');
      indexedUploads[key] = row;
    }

    if (!geoPollingStationsLocations) {
      debugger;
    }

    const geoJson =  {
      type: "FeatureCollection",
      features:
        Object.keys(geoPollingStationsLocations)
        .filter(key => geoPollingStationsLocations[key] !== null)
        .map(key => {
          let hasPhoto = false;
          let hasErrors = false;
          const evybory = indexedUploads[key]
          if (evybory !== undefined) {
            hasPhoto = evybory[2];
          }
          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: geoPollingStationsLocations[key],
            },
            properties: {
              hasPhoto,
              hasErrors,
              stationKey: key,
            }
          }
        }),
    };

    const result = [{
      id: 'data-circle',
      type: 'circle',
      source: {
        type: 'geojson',
        data: geoJson,
      },
      layout: {},
      paint: {
        'circle-radius': circleRadius,
        'circle-opacity': circleOpacity,
        'circle-color': [
          'case', // https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-match
          ['get', 'hasPhoto'], '#fbb03b', // if has photo
          'grey' // default
        ],
      },
    }];
    return result;
  }

  onMapClick = (data) => {
    const { stationKey } = data;
    this.setState({ stationKey });
  };

  render() {
    const { allowDetailsLoading, stationKey } = this.state;
    const dataLayers = this.getDataLayers();
    return (
      <div className="layout--visualization">
        <Map dataLayers={dataLayers} onClick={this.onMapClick} />
        <div className="layout--control p-2">
          <div className="mb-2">
            <SelectMode onChange={this.onChangeMode} />
            <Details stationKey={stationKey} allowDetailsLoading={allowDetailsLoading} />
          </div>
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
      </div>
    );
  }
}

export default Visualizations;