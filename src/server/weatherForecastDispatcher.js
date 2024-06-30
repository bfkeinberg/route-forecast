const callTomorrowIo = require('./tomorrowio');
const callWeatherApi = require('./weatherApi');
const callVisualCrossing = require('./visualCrossing');
const callNWS = require('./nws');
const callMeteomatics = require('./meteomatics');
const callWeatherKit = require('./weatherKit');
const callOneCall = require('./oneCall')
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
 * @param {boolean} isControl the forecast point is from a controle
 * @returns {Promise<{time: *, distance: *, summary: *, precip: string, cloudCover: string, windSpeed: string,
 * lat: *, lon: *, temp: string, relBearing: null, rainy: boolean, windBearing: number,
 * vectorBearing: *, gust: string} | never>} a promise to evaluate to get the forecast results
 */
const callWeatherService = function (service, lat, lon, currentTime, distance, zone, bearing, isControl) {
    switch (service) {
    case 'climacell':
        return Sentry.startSpan({ name: "tomorrow.io" }, () => {
            return callTomorrowIo(lat, lon, currentTime, distance, zone, bearing, getBearingDifference, isControl)
        })
    case 'weatherapi':
        return Sentry.startSpan({ name: "weatherapi" }, () => {
            return callWeatherApi(lat, lon, currentTime, distance, zone, bearing, getBearingDifference, isControl)
        })
    case 'visualcrossing':
        return Sentry.startSpan({ name: "visualcrossing" }, () => {
            return callVisualCrossing(lat, lon, currentTime, distance, zone, bearing, getBearingDifference, isControl)
        })
    case 'nws':
        return Sentry.startSpan({ name: "nws" }, () => {
            return callNWS(lat, lon, currentTime, distance, zone, bearing, getBearingDifference, isControl)
        })
    case 'meteomatics':
        return callMeteomatics(lat, lon, currentTime, distance, zone, bearing, getBearingDifference, isControl);
    case 'weatherKit':
        return Sentry.startSpan({ name: "weatherkit" }, () => {
            return callWeatherKit(lat, lon, currentTime, distance, zone, bearing, getBearingDifference, isControl)
        })
    case 'oneCall':
        return Sentry.startSpan({ name: "oneCall" }, () => {
            return callOneCall(lat, lon, currentTime, distance, zone, bearing, getBearingDifference, isControl)
        })
    default:
        return null;
    }
}

module.exports = callWeatherService;