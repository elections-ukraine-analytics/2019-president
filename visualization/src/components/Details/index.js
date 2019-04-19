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
    const { stationKey, mode, dataEVyboryProtocolsCompact } = this.props;
    const isEVybory = mode && mode.startsWith('e-vybory---');
    const data = otherData && stationKey && otherData[stationKey];
    return (
      <div>
        { stationKey && otherData === null &&
          <span className="text-muted">Завантаження даних...</span>
        }
        {
          isEVybory && dataEVyboryProtocolsCompact &&
          <>
            <div><strong>Дата завантаження даних з e-vybory.org:</strong> {dataEVyboryProtocolsCompact._source.lastUpdateDate.replace('T', ' ')}</div>
          </>
        }
        { stationKey && data &&
          <>
            <div><strong>Округ:</strong> {data.okrugNumber}</div>
            <div><strong>Дiльниця:</strong> {data.number}</div>
            {
              isEVybory && dataEVyboryProtocolsCompact.data[stationKey] &&
              <>
                <h3>Iнформація з сайту e-Vybory.org:</h3>
                {dataEVyboryProtocolsCompact.data[stationKey].map((row, index) => (
                  <>
                    {dataEVyboryProtocolsCompact.data[stationKey].length > 0 &&
                      <div className="small">Запис {index} з {dataEVyboryProtocolsCompact.data[stationKey].length}</div>
                    }
                    <div><strong>Арифметичнi помилки у заповненi протоколу: </strong> {row.has_errors === '1' ? 'Так' : 'Нi'}</div>
                    <div><strong>Дата протоколу:</strong> {row.photo_date.replace('T', ' ')}</div>
                    <div><strong>Дата оцифровки:</strong> {row.table_date.replace('T', ' ')}</div>
                    <div><strong>Сума голосiв за усiх кандидатiв: </strong> {row.rSum}</div>
                    <div><strong>Зеленський:</strong> {row.rZ} ({Math.trunc(row.rZ / row.rSum * 10000) / 100})</div>
                    <div><strong>Порошенко:</strong> {row.rP} ({Math.trunc(row.rP / row.rSum * 10000) / 100})</div>
                  </>
                ))}
              </>
            }
            <h3>Iнформація з сайту ДРВ:</h3>
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