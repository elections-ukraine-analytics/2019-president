import React, { Component } from 'react';
import memoize from 'memoize-one';
import Map from './components/Map';
import SelectMode from './components/SelectMode';

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
  }

  constructor(props) {
    super(props);
    this.layerCVKAllActive = memoize(this.layerCVKAllActive);
    this.layerEVyboryHasPhoto = memoize(this.layerEVyboryHasPhoto);
  }

  async componentDidMount() {
    const response = await fetch('./data/protocols-is-uploaded.json');
    const dataEVyboryProtocolsUploaded = await response.json();
    this.setState({ dataEVyboryProtocolsUploaded });
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

  render() {
    const dataLayers = this.getDataLayers();
    return (
      <>
        <SelectMode onChange={this.onChangeMode} />
        <Map dataLayers={dataLayers} />
      </>
    );
  }
}

export default Visualizations;