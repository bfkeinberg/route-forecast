const moment = require('moment-timezone');
const fetch = require('node-fetch');

const getBearingDifference = function (bearing,windBearing) {
    return Math.min(bearing - windBearing < 0 ? bearing - windBearing + 360 : bearing - windBearing,
        windBearing - bearing < 0 ? windBearing - bearing + 360 : windBearing - bearing);
};

/*

const fetch = require('node-fetch');

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
const callWeatherApi = function (lat, lon, currentTime, distance, zone, bearing) {
    const MAX_API_CALLS_PER_DAY = 1000;

    const weatherApiKey = process.env.WEATHER_API_KEY;
    const startTime = moment(currentTime).tz(zone);
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${lat},${lon}&days=1&hour=${startTime.format('H')}&unixdt=${startTime.unix()}`;
    console.log(`url is ${url}`);
    const forecastResult = fetch(url).then(response => {
        const result = response.json();
        return result;
        }).
    then(forecast => {
        if (forecast.error != null && forecast.error.code != null) {
            console.error(`got error code ${forecast.error.message}`);
            throw forecast.error.message;
        }
        const current = forecast.forecast.forecastday[0].hour[0];
        console.log(`current is ${JSON.stringify(current)}`);
        const now = moment.unix(current.time_epoch).tz(zone)
        console.log(`now is ${now}`);
        const hasWind = current.wind_mph !== undefined;
        const windBearing = current.wind_degree;
        const relativeBearing = hasWind && windBearing !== undefined ? getBearingDifference(bearing, windBearing) : null;
        const rainy = current.will_it_rain != 0;
        console.log('return ' + JSON.stringify({
            'time':now.format('h:mmA'),
            'distance':distance,
            'summary':current.condition.text,
            'tempStr':`${Math.round(current.temp_f)}F`,
            'precip':current.chance_of_rain===undefined?'<unavailable>':`${current.chance_of_rain}%`,
            'cloudCover':current.cloud===undefined?'<unavailable>':`${(current.cloud).toFixed(1)}%`,
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
        }));
        return {
            'time':now.format('h:mmA'),
            'distance':distance,
            'summary':current.condition.text,
            'tempStr':`${Math.round(current.temp_f)}F`,
            'precip':current.chance_of_rain===undefined?'<unavailable>':`${current.chance_of_rain}%`,
            'cloudCover':current.cloud===undefined?'<unavailable>':`${(current.cloud).toFixed(1)}%`,
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

