import React, { Component, Fragment } from 'react';
import { colors } from '../Visualizations';
import './index.css';

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
    const { selectedProperties, mode, dataEVyboryProtocolsCompact } = this.props;
    const { stationKey, okrugNumber } = selectedProperties || { stationKey: undefined, okrugNumber: undefined };
    const isEVybory = mode && mode.startsWith('e-vybory---');
    const data = otherData && stationKey && otherData[stationKey];
    const urlEVyborySearchByStation = stationKey && data && 
      'https://e-vybory.org/feed?region=&district=' + data.okrugNumber + '&station=' + data.numberNormalized + '&error=';
    const urlTemplateEVyboryViewProtocol = 'https://e-vybory.org/view/{photo_slug}';
    const urlTemplateEVyboryViewTable = 'https://e-vybory.org/view-data/{table_slug}';

    return (
      <div>
        { selectedProperties && otherData === null &&
          <span className="text-muted">Завантаження даних...</span>
        }
        {
          isEVybory && dataEVyboryProtocolsCompact &&
          <>
            <div><strong>Дата завантаження даних з e-vybory.org:</strong> {dataEVyboryProtocolsCompact._source.lastUpdateDate.replace('T', ' ')}</div>
          </>
        }
        {isEVybory && okrugNumber &&
          <>
            <div><strong>Округ:</strong> {okrugNumber}</div>
            <div><strong>Всього дiльниць:</strong> {selectedProperties['totalPollingStationsCount']}</div>
            <h3>Iнформація з сайту e-Vybory.org:</h3>
            <div><strong>Оцифрованi дiльницi без помилок:</strong> {JSON.parse(selectedProperties['tablesCompleted']).join(', ')}</div>
            <div><strong>Не оцифрованi дiльницi:</strong> {JSON.parse(selectedProperties['tablesNotCompleted']).join(', ')}</div>
            <div><strong>Оцифрованi дiльницi з помилками:</strong> {selectedProperties['withErrorsList']}</div>
          </>
        }

        { stationKey && data &&
          <>
            <div><strong>Округ:</strong> {data.okrugNumber}</div>
            <div><strong>Дiльниця:</strong> {data.number}</div>
            <div>
              <a href={urlEVyborySearchByStation} rel="noopener noreferrer" target="_blank">
                Пошук даних по дiльницi на e-Vybory.org
              </a>
            </div>
            {
              isEVybory && dataEVyboryProtocolsCompact.data[stationKey] &&
              <>
                <h3>Iнформація з сайту e-Vybory.org:</h3>
                {dataEVyboryProtocolsCompact.data[stationKey].map((row, index) => (
                  <Fragment key={row.photo_slug + row.table_slug + row.photo_date + row.table_date}>
                    {dataEVyboryProtocolsCompact.data[stationKey].length > 1 &&
                      <div className="small">Запис {index + 1} з {dataEVyboryProtocolsCompact.data[stationKey].length}</div>
                    }
                    <div>
                      Вiдкрити на e-Vybory.org:
                      {' '}
                      <a href={urlTemplateEVyboryViewProtocol.replace('{photo_slug}', row.photo_slug)} rel="noopener noreferrer" target="_blank">протокол</a>
                      {' | '}
                      <a href={urlTemplateEVyboryViewTable.replace('{table_slug}', row.table_slug)} rel="noopener noreferrer" target="_blank">оцифровка</a>
                    </div>
                    <div><strong>Арифметичнi помилки у заповненi протоколу: </strong> {row.has_errors === '1' ? 'Так' : 'Нi'}</div>
                    <div><strong>Дата протоколу:</strong> {row.photo_date.replace('T', ' ')}</div>
                    <div><strong>Дата оцифровки:</strong> {row.table_date.replace('T', ' ')}</div>
                    <div><strong>Сума голосiв за усiх кандидатiв: </strong> {row.rSum}</div>
                    <div><strong>Зеленський:</strong> {row.rZ} ({row.rppZ / 100}%)</div>
                    <div className="votes-indicator" style={{backgroundColor: colors.z, width: (row.rppZ / 100) + '%'}}></div>
                    <div><strong>Порошенко:</strong> {row.rP} ({row.rppP / 100}%)</div>
                    <div className="votes-indicator" style={{backgroundColor: colors.p, width: (row.rppP / 100) + '%'}}></div>
                  </Fragment>
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