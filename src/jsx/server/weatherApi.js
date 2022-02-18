const moment = require('moment-timezone');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

//
//
/* eslint-disable max-params*/

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
const callWeatherApi = function (lat, lon, currentTime, distance, zone, bearing, getBearingDifference) {
    const weatherApiKey = process.env.WEATHER_API_KEY;
    const startTime = moment(currentTime).tz(zone);
    let hour = startTime.minute() > 30 ? startTime.hour() + 1 : startTime.hour();
    if (hour > 23) {
        hour = 0;
    }
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${lat},${lon}&days=1&hour=${hour}&unixdt=${startTime.unix()}`;
    const forecastResult = fetch(url).then(response => {
        const result = response.json();
        return result;
    }).
    then(forecast => {
        if (forecast.error !== undefined && forecast.error.code !== undefined) {
            console.error(`got error code ${forecast.error.message}`);
            throw forecast.error.message;
        }
        const current = forecast.forecast.forecastday[0].hour[0];
        const now = moment.unix(current.time_epoch).tz(zone)
        const hasWind = current.wind_mph !== undefined;
        const windBearing = current.wind_degree;
        const relativeBearing = hasWind && windBearing !== undefined ? getBearingDifference(bearing, windBearing) : null;
        const rainy = current.will_it_rain !== 0;
        return {
            'time':now.format('h:mmA'),
            'distance':distance,
            'summary':current.condition.text,
            'tempStr':`${Math.round(current.temp_f)}F`,
            'precip':current.chance_of_rain===undefined?'<unavailable>':`${current.chance_of_rain}%`,
            'cloudCover':current.cloud===undefined?'<unavailable>':`${current.cloud.toFixed(1)}%`,
            'windSpeed':!hasWind?'<unavailable>':`${Math.round(current.wind_mph)}`,
            'lat':lat,
            'lon':lon,
            'temp':`${Math.round(current.temp_f)}`,
            'fullTime':now.format('ddd MMM D h:mmA YYYY'),
            'relBearing':relativeBearing,
            'rainy':rainy,
            'windBearing':windBearing,
            'vectorBearing':bearing,
            'gust':current.gust_mph===undefined?'<unavailable>':`${Math.round(current.gust_mph)}`,
            'feel':current.feelslike_f===undefined?Math.round(current.temp_f):Math.round(current.feelslike_f)
        }
    }).
    catch(error => {
        console.error('error',JSON.stringify(error));
        throw error;
    });
    return forecastResult;
};

module.exports = callWeatherApi;