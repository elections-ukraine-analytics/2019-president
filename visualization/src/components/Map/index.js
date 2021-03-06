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
    selectedFeature: null,
  };
   
  layerHighlightPoint = null;
  layerHighlightPolygon = null;

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
    const { mapLoaded, selectedFeature } = this.state;
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
    if (prevState.selectedFeature !== selectedFeature) {
      this.highlightSelect(selectedFeature, prevState.selectedFeature);
    }
  }

  highlightSelect(selectedFeature, prevSelectedFeature = null) {
    debugger;
    if (prevSelectedFeature) {
      this.map.setFeatureState({source: prevSelectedFeature.source, id: prevSelectedFeature.properties.stationKey}, { focus: false });
    }
    this.map.setFeatureState({source: selectedFeature.source, id: selectedFeature.properties.stationKey}, { focus: true });
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
      const { onClick } = this.props;
      this.setState({ selectedFeature: null });
      if (onClick) {
        onClick(null);
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

      this.map.on('mouseenter', dataLayer.id, this.onMouseEnter);
      this.map.on('mouseleave', dataLayer.id, this.onMouseLeave);
      this.map.on('click', this.onClick);
    }
  }

  onMouseEnter = () => {
    this.map.getCanvas().style.cursor = 'pointer';
  }

  onMouseLeave = () => {
    this.map.getCanvas().style.cursor = '';
  }

  onClick = (e) => {
    const { onClick, dataLayers } = this.props;
    const { point } = e;
    let features;

    const boundingOffsets = [0, 5, 10, 100, 300];
    for (const offset of boundingOffsets) {
      const boundingBox = offset === 0 ? point : [[point.x - offset, point.y - offset], [point.x + offset, point.y + offset]];
      features = this.map.queryRenderedFeatures(boundingBox, { layers: dataLayers.map(r => r.id) });
      if (features.length > 0) {
        break;
      }
    }

    if (features.length === 0) {
      return;
    }
    
    const feature = features[0];
    if (onClick) {
      //const selectedFeature = feature;
      //this.setState({ selectedFeature });
      onClick(feature.properties);
    }
    
  }

  render() {
    const { dataLayers } = this.props;
    const { renderingLayer } = this.state;
    return (
      <div className="map-container">
        <div className="map" ref={this.mapRef}></div>
        {(renderingLayer === true || dataLayers === undefined || dataLayers === null || dataLayers.length === 0) &&
          <div className="loading-map"><span>Завантаження даних ...</span></div>
        }
      </div>
    );
  }
}

export default Map;