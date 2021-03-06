import React, { Component } from 'react';
import memoize from 'memoize-one';
import Map from '../Map';
import SelectMode from '../SelectMode';
import SelectModeColors from '../SelectModeColors';
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

export const colors = {
  z: '#00b259',
  p: '#7f1561',
  neutralBright: '#fbb03b',
  neutralMuted: 'grey',
  z170neutralBright: '#94b148',
  p170neutralBright: '#c8704b',
  hightlight: 'red',
}


class Visualizations extends Component {
  state = {
    dataEVyboryProtocolsUploaded: null,
    dataEVyboryProtocolsCompact: null,
    dataCVKStep2: null,
    mode: null,
    modeColor: null,
    dataLoaded: false,
    allowDetailsLoading: false,
    selectedProperties: undefined,
  }

  constructor(props) {
    super(props);
    this.layerCVKAllActive = memoize(this.layerCVKAllActive);
    this.layerEVyboryHasPhoto = memoize(this.layerEVyboryHasPhoto);
    this.layerEVyboryHasPhotoOkrugs = memoize(this.layerEVyboryHasPhotoOkrugs);
    this.layerEVyboryTop2 = memoize(this.layerEVyboryTop2);
    this.layerCVKTop2Step2 = memoize(this.layerCVKTop2Step2);
    this.loadCVKStep2 = memoize(this.loadCVKStep2);
  }

  async componentDidMount() {
    await Promise.all([
      this.loadProtocolsCompactStep1(),
      //this.loadProtocolsUploadingStep1(),
    ]);
  }

  async loadCVKManifest() {
    const response = await fetch('/manifests/cvk.json');
    const data = await response.json();
    return data;
  }

  async loadCVKStep2() {
    const { name } = await this.loadCVKManifest();
    const response = await fetch('/data-dynamic/' + name);
    const dataCVKStep2 = await response.json();
    this.setState({ dataCVKStep2 });
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
    const { geoPollingStationsLocations, geoOkrugs } = this.props;
    const { mode, modeColor } = this.state;

    if (mode === null || geoPollingStationsLocations === null) {
      return [];
    }

    const { dataEVyboryProtocolsCompact, dataCVKStep2 } = this.state;

    switch (mode) {
      case 'cvk---all-active':
        return this.layerCVKAllActive(geoPollingStationsLocations);
      case 'cvk---top-2---step-2':
        return this.layerCVKTop2Step2(geoPollingStationsLocations, dataCVKStep2, modeColor);
      case 'e-vybory---has-data---step-1':
        return this.layerEVyboryHasPhoto(geoPollingStationsLocations, dataEVyboryProtocolsCompact);
      case 'e-vybory---has-data---step-1---okrugs':
        return this.layerEVyboryHasPhotoOkrugs(geoOkrugs, dataEVyboryProtocolsCompact);
      case 'e-vybory---top-2---step-1':
        return this.layerEVyboryTop2(geoPollingStationsLocations, dataEVyboryProtocolsCompact, false, modeColor);
      case 'e-vybory---top-2-errors---step-1':
        return this.layerEVyboryTop2(geoPollingStationsLocations, dataEVyboryProtocolsCompact, true, modeColor);
      default:
        console.error('Unknown visualization mode - ' + mode);
        return [];
    }
  }

  onChangeMode = (mode) => {
    this.setState({ mode });
  };

  onChangeModeColor = (modeColor) => {
    this.setState({ modeColor });
  };

  layerCVKAllActive(geoPollingStationsLocations) {
    const geoJson =  {
      type: "FeatureCollection",
      features: 
        Object.keys(geoPollingStationsLocations)
        .filter(key => geoPollingStationsLocations[key] !== null)
        .map(key => ({
          type: 'Feature',
          id: key,
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
        'circle-color': colors.neutralBright,
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
            id: key,
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
          ['get', 'hasPhoto'], colors.neutralBright, // if has photo
          colors.neutralMuted // default
        ],
      },
    }];
    return result;
  }

  layerEVyboryHasPhotoOkrugs(geoOkrugs, dataEVyboryProtocolsCompact) {
    if (dataEVyboryProtocolsCompact === null) {
      return [];
    }

    if (!geoOkrugs) {
      return [];
    }

    const geoJson =  {
      type: "FeatureCollection",
      features:
        geoOkrugs.map(({ okrugNumber, geometry, psList }) => {
          const evyboryCollection = 
            Object.keys(dataEVyboryProtocolsCompact.data)
            .filter(key => key.startsWith(okrugNumber + ':'))
            .map(key => dataEVyboryProtocolsCompact.data[key]);

          const tablesCompleted = psList
            .filter(number => 
              evyboryCollection.some(row => 
                row.some(r => r.has_errors === '0' && +r.ps_code === number)
              )
            );

          const tablesNotCompleted = psList
            .filter(number => 
              !evyboryCollection.some(row => 
                row.some(r => +r.ps_code === number)
              )
            );

          const withErrors = psList
            .filter(number => 
              evyboryCollection.some(row => 
                row.some(r => r.has_errors === '1' && +r.ps_code === number)
              )
            );

          const totalPollingStationsCount = psList.length;
          const withErrorsList = withErrors.join(', ');
          const withErrorsCount = withErrors.length;

          return {
            type: 'Feature',
            geometry,
            properties: {
              okrugNumber,
              tablesCompleted,
              tablesNotCompleted,
              totalPollingStationsCount,
              withErrorsList,
              withErrorsCount,
              percentCompleted: Math.trunc((tablesCompleted.length + withErrorsCount) * 10000 / totalPollingStationsCount),
            }
          }
        }),
    };

    const result = [{
      id: 'data-fill',
      type: 'fill',
      source: {
        type: 'geojson',
        data: geoJson,
      },
      layout: {},
      paint: {
        'fill-opacity': 1,
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'percentCompleted'],
          0, colors.neutralMuted,
          10000, colors.neutralBright,
        ],
        'fill-outline-color': ['rgba', 255, 255, 255, 0.2],
      },
    }];
    return result;
  }

  layerEVyboryTop2(geoPollingStationsLocations, dataEVyboryProtocolsCompact, withErrors, modeColor) {
    const numberWithErrors = withErrors ? '1' : '0';

    if (modeColor === null) {
      return [];
    }
    
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
        .filter(key => dataEVyboryProtocolsCompact.data[key])
        .map(key => {
          let hasErrors = false;
          if (withErrors && dataEVyboryProtocolsCompact.data[key].some(row => row.has_errors === '0')) {
            // do not display with errors if we have table data without errors
            return false;
          }
          let collection = dataEVyboryProtocolsCompact.data[key].filter(row => row.has_errors === numberWithErrors);
          let evybory;
          if (collection.length === 0) {
            return false;
          } else if (collection.length === 1) {
            evybory = collection[0];
          } else {
            // if several records - use recent (by table_date)
            collection.sort((a, b) => b.table_date - a.table_date);
            evybory = collection[0];
          }

          return {
            type: 'Feature',
            id: key,
            geometry: {
              type: 'Point',
              coordinates: geoPollingStationsLocations[key],
            },
            properties: {
              winner: evybory.rZ === evybory.rP ? '=' : (evybory.rppZ > evybory.rppP ? 'З' : 'П'),
              winnerInterpolate: evybory.rppZ - evybory.rppP,
              hasErrors,
              stationKey: key,
            }
          }
        }),
    };

    let circleColor;

    if (modeColor === '2-colors') {
      circleColor = [
        'match', // https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-match
        ['get', 'winner'],
        '=', colors.neutralBright, // equal
        'З', colors.z,
        'П', colors.p,
        colors.neutralMuted // default
      ];
    } else if (modeColor === 'interpolate') {
      circleColor = [
        'interpolate', // https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-interpolate
        ['linear'],
        ['get', 'winnerInterpolate'],
        -10000, colors.p,
          -500, colors.p170neutralBright,
             0, colors.neutralBright,
           500, colors.z170neutralBright,
        +10000, colors.z,
      ];
    }

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
        'circle-color': circleColor,
      },
    }];
    return result;
  }

  layerCVKTop2Step2(geoPollingStationsLocations, dataCVKStep2, modeColor) {
    if (dataCVKStep2 === null) {
      this.loadCVKStep2();
      return [];
    }    

    if (modeColor === null) {
      return [];
    }
    
    if (!geoPollingStationsLocations) {
      return [];
    }

    const geoJson =  {
      type: "FeatureCollection",
      features:
        Object.keys(geoPollingStationsLocations)
        .filter(key => geoPollingStationsLocations[key] !== null)
        .map(key => {
          const data = dataCVKStep2[key];
          if (!data) {
            return {
              type: 'Feature',
              id: key,
              geometry: {
                type: 'Point',
                coordinates: geoPollingStationsLocations[key],
              },
              properties: {
                noData: true,
                stationKey: key,
              }
            }
          }
          const [ , , totalVoters, rZ, rP ] = data.last;
          const rppZ = rZ * 10000 / totalVoters;
          const rppP = rP * 10000 / totalVoters;
          const hasChanges = data.history.length > 0;
          return {
            type: 'Feature',
            id: key,
            geometry: {
              type: 'Point',
              coordinates: geoPollingStationsLocations[key],
            },
            properties: {
              noData: false,
              winner: rZ === rP ? '=' : (rZ > rP ? 'З' : 'П'),
              winnerInterpolate: rppZ - rppP,
              hasChanges,
              stationKey: key,
            }
          }
        }),
    };

    let circleColor;

    if (modeColor === '2-colors') {
      circleColor = [
        'case',
        ['get', 'noData'],
        colors.neutralMuted,
        [
          'match', // https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-match
          ['get', 'winner'],
          '=', colors.neutralBright, // equal
          'З', colors.z,
          'П', colors.p,
          colors.neutralMuted // default
        ],
      ];
    } else if (modeColor === 'interpolate') {
      circleColor = [
        'case',
        ['get', 'noData'],
        colors.neutralMuted,
        [
          'interpolate', // https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-interpolate
          ['linear'],
          ['get', 'winnerInterpolate'],
          -10000, colors.p,
            -500, colors.p170neutralBright,
              0, colors.neutralBright,
            500, colors.z170neutralBright,
          +10000, colors.z,
        ],
      ];
    }

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
        'circle-color': circleColor,
      },
    }];
    return result;
  }

  onMapClick = (data) => {
    if (!data) {
      this.setState({ selectedProperties: undefined });
      return;
    }
    this.setState({ selectedProperties: data });
  };

  render() {
    const { allowDetailsLoading, selectedProperties, mode, dataEVyboryProtocolsCompact } = this.state;
    const dataLayers = this.getDataLayers();
    return (
      <div className="layout--visualization">
        <Map dataLayers={dataLayers} onClick={this.onMapClick} />
        <div className="layout--control">
          <div className="details-pane p-2">
            <div className="mb-5">
              <SelectMode onChange={this.onChangeMode} />
              {mode && mode.includes('---top-2-') &&
                <SelectModeColors onChange={this.onChangeModeColor} />
              }
              <Details 
                selectedProperties={selectedProperties}
                mode={mode}
                dataEVyboryProtocolsCompact={dataEVyboryProtocolsCompact}
                allowDetailsLoading={allowDetailsLoading}
              />
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
      </div>
    );
  }
}

export default Visualizations;