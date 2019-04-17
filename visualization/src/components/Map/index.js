import React, { Component } from 'react';
import './index.css';

// https://docs.mapbox.com/mapbox-gl-js/api/
// https://docs.mapbox.com/mapbox-gl-js/example/data-driven-circle-colors/
const mapboxgl = window.mapboxgl;
mapboxgl.accessToken = 'pk.eyJ1Ijoic2FzaGFrIiwiYSI6ImNqdWU4cTY0MTAweTYzeW1qNWIydHE1MHAifQ.kz7SzbNlU6z-IfqXZ0Kxbw';

const boundsUkraine = [[21.08, 43.86], [41.08, 52.81]];

class Map extends Component {
  state = {
    mapLoaded: false,
    renderingLayer: false,
  };

  mapFirstSymbolId = null;

  constructor(props) {
    super(props);    
    this.mapRef = React.createRef();
  }

  componentDidMount() {
    this.map = new mapboxgl.Map({
      container: this.mapRef.current,
      style: 'mapbox://styles/mapbox/light-v10',
      bounds: boundsUkraine,
    });

    window.debugMap = this.map; // to access map instance in browser devtools

    this.map.addControl(new mapboxgl.NavigationControl());

    this.map.once('load', () => {
      
      // https://docs.mapbox.com/mapbox-gl-js/example/geojson-layer-in-stack/
      const layers = this.map.getStyle().layers;
      // Find the index of the first symbol layer in the map style
      for (const layer of layers) {
        if (layer.type === 'symbol') {
          this.mapFirstSymbolId = layer.id;
          break;
        }
      }

      this.setState({ mapLoaded: true });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const { mapLoaded } = this.state;
    const { dataLayers } = this.props;
    if (mapLoaded === false) {
      return;
    }
    if (prevState.mapLoaded !== mapLoaded) {
      this.assignDataLayers();
      return;
    }
    if (prevProps.dataLayers !== dataLayers) {
      this.assignDataLayers(prevProps.dataLayers);
    }
  }

  async assignDataLayers(prevDataLayers) {
    const { dataLayers } = this.props;

    if (prevDataLayers !== undefined) {
      for (const dataLayer of prevDataLayers) {
        const layer = this.map.getLayer(dataLayer.id);
        if (layer !== undefined) {
          this.map.removeLayer(dataLayer.id);
          this.map.removeSource(layer.source);
        }
      }
    }

    if (dataLayers === undefined || dataLayers === null || dataLayers.length === 0) {
      return;
    }

    for (const dataLayer of dataLayers) {
      console.log('addLayer');
      this.setState({ renderingLayer: true });
      this.map.once('idle', () => {
        this.setState({ renderingLayer: false });
      });
      this.map.addLayer(dataLayer, this.mapFirstSymbolId);
    }
  }

  render() {
    const { dataLayers } = this.props;
    const { renderingLayer } = this.state;
    return (
      <div className="map-container">
        <div className="map" ref={this.mapRef}></div>
        {(renderingLayer === true || dataLayers === undefined || dataLayers === null || dataLayers.length === 0) &&
          <div className="loading-map"><span>Загрузка даних ...</span></div>
        }
      </div>
    );
  }
}

export default Map;