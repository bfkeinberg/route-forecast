const moment = require('moment-timezone');
const callDarkSky = require('./weatherCalculator');
const callClimacell = require('./climacell');
const callWeatherApi = require('./weatherApi');

const getBearingDifference = function (bearing,windBearing) {
    return Math.min(bearing - windBearing < 0 ? bearing - windBearing + 360 : bearing - windBearing,
        windBearing - bearing < 0 ? windBearing - bearing + 360 : windBearing - bearing);
};

/* eslint-disable max-params*/

/**
 *
 * @param {string} which service to call
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
const callWeatherService = function (service, lat, lon, currentTime, distance, zone, bearing) {
    switch (service) {
        case 'darksky':
            return callDarkSky(lat, lon, currentTime, distance, zone, bearing);
            break;
        case 'climacell':
            return callClimacell(lat, lon, currentTime, distance, zone, bearing);
        case 'weatherapi':
            return callWeatherApi(lat, lon, currentTime, distance, zone, bearing);
        default:
            return null;
    }
}

module.exports = callWeatherService;