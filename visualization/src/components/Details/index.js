import React, { Component } from 'react';

class Details extends Component {
  state = {
    allowed: false,
    otherData: null,
  }
  
  componentDidMount() {
    this.testAllowedLoadingData();
  }

  componentDidUpdate() {
    this.testAllowedLoadingData();
  }

  testAllowedLoadingData() {
    if (this.state.allowed === false && this.props.allowDetailsLoading === true) {
      this.loadOtherData();
    }
  }

  async loadOtherData() {
    this.setState({ allowed: true });
    const response = await fetch('./static-data/geo-polling-stations-other-data.json');
    const otherData = await response.json();
    this.setState({ otherData });
  }

  render() {
    const { otherData } = this.state;
    const { stationKey } = this.props;
    const data = otherData && stationKey && otherData[stationKey];
    return (
      <div>
        { stationKey && otherData === null &&
          <span className="text-muted">Завантаження даних...</span>
        }
        { stationKey && data &&
          <>
            <div>Округ: {data.okrugNumber}</div>
            <div>Дiльниця: {data.number}</div>
          </>
        }
      </div>
    );
  }
}

export default Details;