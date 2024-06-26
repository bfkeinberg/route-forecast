const moment = require('moment-timezone');
const axios = require('axios');
const Sentry = require("@sentry/node")

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
 * @param {boolean} isControl the forecast point is from a controle
* @returns {Promise<{time: *, distance: *, summary: *, precip: string, cloudCover: string, windSpeed: string,
 * lat: *, lon: *, temp: string, relBearing: null, rainy: boolean, windBearing: number,
 * vectorBearing: *, gust: string} | never>} a promise to evaluate to get the forecast results
 */
const callVisualCrossing = async function (lat, lon, currentTime, distance, zone, bearing, getBearingDifference, isControl) {
    const visualCrossingKey = process.env.VISUAL_CROSSING_KEY;
    const startTime = moment(currentTime);
    const endTime = startTime.clone();
    endTime.add(1, 'hours');
    const startTimeString = startTime.unix();
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/${startTimeString}?unitGroup=us&include=current&options=nonulls&key=${visualCrossingKey}`;
    const weatherResult = await axios.get(url).catch(error => {Sentry.captureMessage(`axios error ${error.response?error.response.data:error}`,'error')
        throw error.response?error.response.data:error});
    const forecast = weatherResult.data;
    if (forecast.code !== undefined) {
        Sentry.captureMessage(`got error code ${forecast.code}`,'error')
        throw forecast.message;
    }
    const current = forecast.currentConditions;
    if (current === undefined) {
        Sentry.captureMessage(`Throwing error because no current conditions were returned`,'error');
        throw Error({details:"No current conditions"});
    }
    const now = moment.unix(current.datetimeEpoch).tz(zone);
    const hasWind = current.windspeed !== undefined;
    const windBearing = current.winddir;
    const relativeBearing = hasWind && windBearing !== undefined ? getBearingDifference(bearing, windBearing) : null;
    const rainy = current.precip !== 0;
    const precip = current.precipprob !== undefined ? current.precipprob : 0;
    return new Promise((resolve) => {resolve({
        'time':now.toISOString(),
        zone:zone,
        'distance':distance,
        'summary':forecast.days[0].conditions,
        'precip':`${precip.toFixed(1)}%`,
        'humidity':Math.round(current.humidity),
        'cloudCover':current.cloudcover===undefined?'<unavailable>':`${current.cloudcover.toFixed(1)}%`,
        'windSpeed':!hasWind?'<unavailable>':`${Math.round(current.windspeed)}`,
        'lat':lat,
        'lon':lon,
        'temp':`${Math.round(current.temp)}`,
        'relBearing':relativeBearing,
        'rainy':rainy,
        'windBearing':Math.round(windBearing),
        'vectorBearing':bearing,
        'gust':current.windgust===undefined?`${Math.round(current.windspeed)}`:`${Math.round(current.windgust)}`,
        'feel':current.feelslike===undefined?Math.round(current.temperature):Math.round(current.feelslike),
        isControl:isControl
    })})
};

module.exports = callVisualCrossing;