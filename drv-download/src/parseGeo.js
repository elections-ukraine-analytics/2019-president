
class ParseGeo {

  static async base(page, prefix) {
    try {
      const response = await page.waitForResponse((response) => {
        if (response.request().resourceType() !== 'xhr') {
          return false;
        }
        if (response.url().includes(prefix)) {
          return true;
        }
        return false;
      });

      if (!response.ok()) {
        console.log('Bad server response');
        return false;
      }
      
      return await response.json();
    } catch (e) {
      return false;
    }
  }

  static async geoOkrugs(page) {
    const data = await ParseGeo.base(page, 'gis$core.Gis_Okrug_Poly');
    const result = {};
    for (const raw of data.features) {
      const { id } = raw.properties;
      const { geometry } = raw;
      result[id] = {
        okrugNumber: id,
        geometry,
      };
    }
    return result;
  }

  static async geoPollingStationPoly(page) {
    const data = await ParseGeo.base(page, 'gis$core.Gis_DistrPoly');
    if (data === false) {
      return false;
    }
    const result = {};
    for (const raw of data.features) {
      const { name } = raw.properties;
      const { geometry } = raw;
      result[name] = {
        id: name,
        geometry,
      };
    }
    return result;
  }

  static async geoPollingStationMarker(page) {
    const data = await ParseGeo.base(page, 'gis$core.Gis_DistrMarker');
    if (data === false) {
      return false;
    }
    const result = {};
    for (const raw of data.features) {
      const { name } = raw.properties;
      const { geometry } = raw;
      result[name] = {
        id: name,
        geometry,
      };
    }
    return result;
  }

}


module.exports = ParseGeo;