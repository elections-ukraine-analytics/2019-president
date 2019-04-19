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
            <div><strong>Округ:</strong> {data.okrugNumber}</div>
            <div><strong>Дiльниця:</strong> {data.number}</div>
            <div><strong>Розмір дільниці:</strong> {data.size}</div>
            <div><strong>Опис меж дільниці:</strong></div>
            <div>{data.areaDescriptionOrTitle}</div>
            <div><strong>Адреса приміщення для голосування (місцезнаходження) / Адреса дільничної виборчої комісії:</strong></div>
            <div>{data.location}</div>
          </>
        }
      </div>
    );
  }
}

export default Details;