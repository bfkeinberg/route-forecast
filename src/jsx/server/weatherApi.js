const { DateTime } = require("luxon");
const axios = require('axios');

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
 * @returns {Promise<{time: *, distance: *, summary: *, precip: string, cloudCover: string, windSpeed: string,
 * lat: *, lon: *, temp: string, fullTime: *, relBearing: null, rainy: boolean, windBearing: number,
 * vectorBearing: *, gust: string} | never>} a promise to evaluate to get the forecast results
 */
const callWeatherApi = async function (lat, lon, currentTime, distance, zone, bearing, getBearingDifference) {
    const weatherApiKey = process.env.WEATHER_API_KEY;
    const startTime = DateTime.fromISO(currentTime, {zone:zone});
    let hour = startTime.minute > 30 ? startTime.hour + 1 : startTime.hour;
    if (hour > 23) {
        hour = 0;
    }
    const forecastUrl = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${lat},${lon}&days=1&hour=${hour}&aqi=yes&unixdt=${startTime.toUnixInteger()}`;
    const historyUrl = `https://api.weatherapi.com/v1/history.json?key=${weatherApiKey}&q=${lat},${lon}&hour=${hour}&unixdt=${startTime.toUnixInteger()}`;
    const url = startTime < DateTime.now() ? historyUrl : forecastUrl;
    const forecastResult = await axios.get(url).catch(error => {
        throw Error(error.response.data.error.message);
    });
    if (forecastResult.data.error !== undefined && forecastResult.data.error.code !== undefined) {
        console.error(`got error code ${forecastResult.error.message}`);
        throw Error(forecastResult.error.message);
    }
    const current = forecastResult.data.forecast.forecastday[0].hour[0];
    const now = DateTime.fromSeconds(current.time_epoch, {zone:zone});
    const hasWind = current.wind_mph !== undefined;
    const windBearing = current.wind_degree;
    const relativeBearing = hasWind && windBearing !== undefined ? getBearingDifference(bearing, windBearing) : null;
    const rainy = current.will_it_rain !== 0;
    return {
        'time':now.toFormat('h:mm a'),
        'distance':distance,
        'summary':current.condition.text,
        'precip':current.chance_of_rain===undefined?'<unavailable>':`${current.chance_of_rain}%`,
        'humidity':current.humidity,
        'cloudCover':current.cloud===undefined?'<unavailable>':`${current.cloud.toFixed(1)}%`,
        'windSpeed':!hasWind?'<unavailable>':`${Math.round(current.wind_mph)}`,
        'lat':lat,
        'lon':lon,
        'temp':`${Math.round(current.temp_f)}`,
        'fullTime':now.toFormat('EEE MMM d h:mma yyyy'),
        'relBearing':relativeBearing,
        'rainy':rainy,
        'windBearing':windBearing,
        'vectorBearing':bearing,
        'gust':current.gust_mph===undefined?'<unavailable>':`${Math.round(current.gust_mph)}`,
        'feel':current.feelslike_f===undefined?Math.round(current.temp_f):Math.round(current.feelslike_f)
    }
};

module.exports = callWeatherApi;