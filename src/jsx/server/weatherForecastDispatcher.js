const callClimacell = require('./climacell');
const callWeatherApi = require('./weatherApi');
const callVisualCrossing = require('./visualCrossing');
const callNWS = require('./nws');
const callMeteomatics = require('./meteomatics');
const callWeatherKit = require('./weatherKit');
const Sentry = require('@sentry/node')

const getBearingDifference = function (bearing,windBearing) {
    return Math.min(bearing - windBearing < 0 ? bearing - windBearing + 360 : bearing - windBearing,
        windBearing - bearing < 0 ? windBearing - bearing + 360 : windBearing - bearing);
};

/* eslint-disable max-params*/

/**
 *
 * @param {string} service - which service to call
 * @param {number} lat - latitude
 * @param {number} lon - longitude
 * @param {date} currentTime - time at which to obtain forecast
 * @param {number} distance - used only in the return value, not the call
 * @param {string} zone time zone
 * @param {number} bearing the direction of travel at the time of the forecast
 * @returns {Promise<{time: *, distance: *, summary: *, precip: string, cloudCover: string, windSpeed: string,
 * lat: *, lon: *, temp: string, fullTime: *, relBearing: null, rainy: boolean, windBearing: number,
 * vectorBearing: *, gust: string} | never>} a promise to evaluate to get the forecast results
 */
const callWeatherService = function (service, lat, lon, currentTime, distance, zone, bearing) {
    switch (service) {
    case 'climacell':
        return Sentry.startSpan({ name: "tomorrow.io" }, () => {
            return callClimacell(lat, lon, currentTime, distance, zone, bearing, getBearingDifference)
        })
    case 'weatherapi':
        return Sentry.startSpan({ name: "weatherapi" }, () => {
            return callWeatherApi(lat, lon, currentTime, distance, zone, bearing, getBearingDifference)
        })
    case 'visualcrossing':
        return Sentry.startSpan({ name: "visualcrossing" }, () => {
            return callVisualCrossing(lat, lon, currentTime, distance, zone, bearing, getBearingDifference)
        })
    case 'nws':
        return Sentry.startSpan({ name: "nws" }, () => {
            return callNWS(lat, lon, currentTime, distance, zone, bearing, getBearingDifference)
        })
    case 'meteomatics':
        return callMeteomatics(lat, lon, currentTime, distance, zone, bearing, getBearingDifference);
    case 'weatherKit':
        return Sentry.startSpan({ name: "weatherkit" }, () => {
            return callWeatherKit(lat, lon, currentTime, distance, zone, bearing, getBearingDifference)
        })
    default:
        return null;
    }
}

module.exports = callWeatherService;