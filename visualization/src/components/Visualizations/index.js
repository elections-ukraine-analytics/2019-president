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
    dataEVyboryProtocolsCompact: null,
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
    await Promise.all([
      this.loadProtocolsCompactStep1(),
      //this.loadProtocolsUploadingStep1(),
    ]);
  }

  async loadProtocolsUploadingStep1() {
    const response = await fetch('./data/protocols-is-uploaded.json');
    const dataEVyboryProtocolsUploaded = await response.json();
    this.setState({ dataEVyboryProtocolsUploaded }, this.testAllowDetailsLoading);
  }

  async loadProtocolsCompactStep1() {
    const response = await fetch('./data/evybory-protocols-compact.json');
    const raw = await response.json();
    let data = {};
    for (const key of Object.keys(raw.data)) {
      data[key] = raw.data[key].map(
        ([area_code, ps_code, has_errors, photo_slug, table_slug, photo_date, table_date, rZ, rP, rSum, rppZ, rppP]) => 
        ({area_code, ps_code, has_errors, photo_slug, table_slug, photo_date, table_date, rZ, rP, rSum, rppZ, rppP})
      );
    }
    const dataEVyboryProtocolsCompact = {
      _source: raw._source,
      data,
    };
    this.setState({ dataEVyboryProtocolsCompact }, this.testAllowDetailsLoading);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.geoPollingStationsLocations === null && this.props.geoPollingStationsLocations !== null) {
      this.testAllowDetailsLoading();
    }
  }

  testAllowDetailsLoading() {
    const dataLoaded = this.state.dataEVyboryProtocolsCompact !== null; // && this.state.dataEVyboryProtocolsUploaded !== null;
    if (dataLoaded !== this.state.dataLoaded) {
      this.setState({ dataLoaded });
    }
    if (this.props.geoPollingStationsLocations === null || dataLoaded === false) {
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
      case 'e-vybory---has-data---step-1':
        const { dataEVyboryProtocolsCompact } = this.state;
        return this.layerEVyboryHasPhoto(geoPollingStationsLocations, dataEVyboryProtocolsCompact);
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

  layerEVyboryHasPhoto(geoPollingStationsLocations, dataEVyboryProtocolsCompact) {
    if (dataEVyboryProtocolsCompact === null) {
      return [];
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
          const evybory = dataEVyboryProtocolsCompact.data[key];
          if (evybory !== undefined) {
            hasPhoto = true;
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
    const { allowDetailsLoading, stationKey, mode, dataEVyboryProtocolsCompact } = this.state;
    const dataLayers = this.getDataLayers();
    return (
      <div className="layout--visualization">
        <Map dataLayers={dataLayers} onClick={this.onMapClick} />
        <div className="layout--control p-2">
          <div className="mb-2">
            <SelectMode onChange={this.onChangeMode} />
            <Details stationKey={stationKey} mode={mode} dataEVyboryProtocolsCompact={dataEVyboryProtocolsCompact} allowDetailsLoading={allowDetailsLoading} />
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