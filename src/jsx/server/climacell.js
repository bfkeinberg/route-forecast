const moment = require('moment-timezone');
const fetch = require('node-fetch');

const getBearingDifference = function (bearing,windBearing) {
    return Math.min(bearing - windBearing < 0 ? bearing - windBearing + 360 : bearing - windBearing,
        windBearing - bearing < 0 ? windBearing - bearing + 360 : windBearing - bearing);
};

/*

const fetch = require('node-fetch');

const url = 'https://data.climacell.co/v4/timelines';

const options = {
  method: 'GET',
  qs: {
    location: '50.071359537541866,19.90203430876136',
    fields: ['windSpeed', 'precipitationProbability', 'windDirection'],
    startTime: '2021-02-12T16:00:00Z',
    endTime: '2021-02-12T18:00:00Z',
    timesteps: '1h',
    units: 'imperial',
    apikey: 'WwsOI3NGPH6OoWclCk5rloJHlQoDrimM'
  }
};

fetch(url, options)
  .then(res => res.json())
  .then(json => console.log(json))
  .catch(err => console.error('error:' + err));
  
*/
/* eslint-disable max-params*/

/**
 *
 * @param {number} lat latitude
 * @param {number} lon longitude
 * @param {date} currentTime time at which to obtain forecast
 * @param {number} distance used only in the return value, not the call
 * @param {string} zone time zone
 * @param {number} bearing the direction of travel at the time of the forecast
 * @returns {Promise<{time: *, distance: *, summary: *, tempStr: string, precip: string, cloudCover: string, windSpeed: string,
 * lat: *, lon: *, temp: string, fullTime: *, relBearing: null, rainy: boolean, windBearing: number,
 * vectorBearing: *, gust: string} | never>} a promise to evaluate to get the forecast results
 */
const callClimacell = function (lat, lon, currentTime, distance, zone, bearing) {
    const MAX_API_CALLS_PER_DAY = 1000;

    const climacellKey = process.env.CLIMACELL_KEY;
    const startTime = moment(currentTime);
    const endTime = startTime.clone();
    endTime.add(1, 'hours');
    const startTimeString = startTime.format('YYYY-MM-DD[T]HH:mm:ssZ');
    const endTimeString = endTime.format('YYYY-MM-DD[T]HH:mm:ssZ');
    const now = startTime.tz(zone);
    console.log(`now is ${now}`);
//    console.log(`Current:${currentTime} Start: ${startTimeString} End: ${endTimeString} Time zone is ${zone} iso:${startTime.toISOString()}`);
    const url = `https://data.climacell.co/v4/timelines?location=${lat},${lon}&fields=windSpeed&fields=precipitationProbability&fields=windDirection&fields=temperature&fields=temperatureApparent&fields=windGust&fields=cloudCover&fields=precipitationType&fields=weatherCode&timezone=${zone}&startTime=${startTimeString}&endTime=${endTimeString}&timesteps=1h&units=imperial&apikey=${climacellKey}`;
    console.log(`url is ${url}`);
    const forecastResult = fetch(url).then(response => {
        const result = response.json();
        result.apiCalls = response.headers.get('X-RateLimit-Remaining-day');
        console.log(`api calls remaining:${result.apiCalls}`);
        return result;
        }).
    then(forecast => {
        if (forecast.code != null) {
            console.error(`got error code ${forecast.code}`);
            throw forecast.message;
        }
        if (forecast.apiCalls < 50) {
            throw Error({'details':'Daily count exceeded'});
        }
        const current = forecast.data.timelines[0];
        const values =  current.intervals[0].values;
        const hasWind = values.windSpeed !== undefined;
        const windBearing = values.windDirection;
        const relativeBearing = hasWind && windBearing !== undefined ? getBearingDifference(bearing, windBearing) : null;
        const rainy = current.precipitationType === 1;
//        console.log(`current is ${JSON.stringify(current)}`);
        console.info ('return ' + JSON.stringify({
            'time':now.format('h:mmA'),
            'distance':distance,
            'summary':values.weatherCode,
            'tempStr':`${Math.round(values.temperature)}F`,
            'precip':values.precipitationProbability===undefined?'<unavailable>':`${(values.precipitationProbability).toFixed(1)}%`,
            'cloudCover':values.cloudCover===undefined?'<unavailable>':`${values.cloudCover.toFixed(1)}%`,
            'windSpeed':!hasWind?'<unavailable>':`${Math.round(values.windSpeed)}`,
            'lat':lat,
            'lon':lon,
            'temp':`${Math.round(values.temperature)}`,
            'fullTime':now.format('ddd MMM D h:mmA YYYY'),
            'relBearing':relativeBearing,
            'rainy':rainy,
            'windBearing':windBearing,
            'vectorBearing':bearing,
            'gust':values.windGust===undefined?'<unavailable>':`${Math.round(values.windGust)}`,
            'feel':values.temperatureApparent===undefined?Math.round(values.temperature):Math.round(values.temperatureApparent)}));
        return {
            'time':now.format('h:mmA'),
            'distance':distance,
            'summary':values.weatherCode,
            'tempStr':`${Math.round(values.temperature)}F`,
            'precip':values.precipitationProbability===undefined?'<unavailable>':`${(values.precipitationProbability).toFixed(1)}%`,
            'cloudCover':values.cloudCover===undefined?'<unavailable>':`${values.cloudCover.toFixed(1)}%`,
            'windSpeed':!hasWind?'<unavailable>':`${Math.round(values.windSpeed)}`,
            'lat':lat,
            'lon':lon,
            'temp':`${Math.round(values.temperature)}`,
            'fullTime':now.format('ddd MMM D h:mmA YYYY'),
            'relBearing':relativeBearing,
            'rainy':rainy,
            'windBearing':windBearing,
            'vectorBearing':bearing,
            'gust':values.windGust===undefined?'<unavailable>':`${Math.round(values.windGust)}`,
            'feel':values.temperatureApparent===undefined?Math.round(values.temperature):Math.round(values.temperatureApparent)
        }
    }).
    catch(error => {
        console.error('error',JSON.stringify(error));
        throw error;
    });
    return forecastResult;
};

module.exports = callClimacell;

