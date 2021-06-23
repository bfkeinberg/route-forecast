const moment = require('moment-timezone');
const fetch = require('node-fetch');

/* eslint-disable max-params, max-lines-per-function */

/**
 *
 * @param {number} lat latitude
 * @param {number} lon longitude
 * @param {date} currentTime time at which to obtain forecast
 * @param {number} distance used only in the return value, not the call
 * @param {string} zone time zone
 * @param {number} bearing the direction of travel at the time of the forecast
 * @param {function} getBearingDifference - returns the difference between two bearings
  * @returns {Promise<{time: *, distance: *, summary: *, tempStr: string, precip: string, cloudCover: string, windSpeed: string,
 * lat: *, lon: *, temp: string, fullTime: *, relBearing: null, rainy: boolean, windBearing: number,
 * vectorBearing: *, gust: string} | never>} a promise to evaluate to get the forecast results
 */
const callVisualCrossing = function (lat, lon, currentTime, distance, zone, bearing, getBearingDifference) {
    const visualCrossingKey = process.env.VISUAL_CROSSING_KEY;
    const startTime = moment(currentTime);
    const endTime = startTime.clone();
    endTime.add(1, 'hours');
    const startTimeString = startTime.unix();
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/${startTimeString}?unitGroup=us&include=current&options=nonulls&key=${visualCrossingKey}`;
//    console.info(`url is ${url}`)
    const forecastResult = fetch(url).then(response => {
        const result = response.json();
        return result;
    }).
    then(forecast => {
        if (forecast.code !== undefined) {
            console.error(`got error code ${forecast.code}`);
            throw forecast.message;
        }
        const current = forecast.currentConditions;
        if (current === undefined) {
            throw "No current conditions";
        }
        console.info(`returned was ${JSON.stringify(forecast)}`);
        const now = moment.unix(current.datetimeEpoch).tz(zone)
        console.log(`now is ${now}`);
        const hasWind = current.windspeed !== undefined;
        const windBearing = current.winddir;
        const relativeBearing = hasWind && windBearing !== undefined ? getBearingDifference(bearing, windBearing) : null;
        const rainy = current.precip !== 0;
        const precip = current.precipprob !== undefined ? current.precipprob : forecast.days[0].precipprob;
        return {
            'time':now.format('h:mmA'),
            'distance':distance,
            'summary':forecast.days[0].conditions,
            'tempStr':`${Math.round(current.temp)}F`,
            'precip':`${precip.toFixed(1)}%`,
            'cloudCover':current.cloudcover===undefined?'<unavailable>':`${current.cloudcover.toFixed(1)}%`,
            'windSpeed':!hasWind?'<unavailable>':`${Math.round(current.windspeed)}`,
            'lat':lat,
            'lon':lon,
            'temp':`${Math.round(current.temp)}`,
            'fullTime':now.format('ddd MMM D h:mmA YYYY'),
            'relBearing':relativeBearing,
            'rainy':rainy,
            'windBearing':Math.round(windBearing),
            'vectorBearing':bearing,
            'gust':current.windgust===undefined?'<unavailable>':`${Math.round(current.windgust)}`,
            'feel':current.feelslike===undefined?Math.round(current.temperature):Math.round(current.feelslike)
        }
    }).
    catch(error => {
        console.error('error',JSON.stringify(error));
        throw error;
    });
    return forecastResult;
};

module.exports = callVisualCrossing;