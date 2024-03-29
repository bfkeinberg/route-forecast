const moment = require('moment-timezone');
const axios = require('axios');

const weatherCodes = {
    "0": "Unknown",
    "1000": "Clear",
    "1001": "Cloudy",
    "1100": "Mostly Clear",
    "1101": "Partly Cloudy",
    "1102": "Mostly Cloudy",
    "2000": "Fog",
    "2100": "Light Fog",
    "3000": "Light Wind",
    "3001": "Wind",
    "3002": "Strong Wind",
    "4000": "Drizzle",
    "4001": "Rain",
    "4200": "Light Rain",
    "4201": "Heavy Rain",
    "5000": "Snow",
    "5001": "Flurries",
    "5100": "Light Snow",
    "5101": "Heavy Snow",
    "6000": "Freezing Drizzle",
    "6001": "Freezing Rain",
    "6200": "Light Freezing Rain",
    "6201": "Heavy Freezing Rain",
    "7000": "Ice Pellets",
    "7101": "Heavy Ice Pellets",
    "7102": "Light Ice Pellets",
    "8000": "Thunderstorm"
};

let sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getFromTomorrowIoWithBackoff = async (forecastUrl) => {
    let timeout = 400;
    let lastError = "";
    do {
        // eslint-disable-next-line no-await-in-loop
        const forecastResult = await axios.get(forecastUrl).catch(
            error => {
                lastError = JSON.stringify(error.response.data);
                console.log(forecastUrl,lastError);
                console.info('will sleep for ',timeout);
            }
        );
        if (forecastResult !== undefined) {
            const forecast = forecastResult.data;
            if (forecast.code !== undefined) {
                console.error(`got error code ${forecast.code}`);
                console.log(forecast);
                if (forecast.code === 429001) {
                    console.log(`no Tomorrow.io forecast, sleeping ${timeout}ms after ${lastError}`);
                    // eslint-disable-next-line no-await-in-loop
                    await sleep(timeout);
                    timeout += 500;
                } else {
                    console.error('Tomnorrow.io error',forecast.message);
                    throw Error(forecast.message);
                }
            }
            if (forecast.apiCalls < 50) {
                throw Error('Daily count exceeded');
            }
            if (forecast.apiCallsHour < 3) {
                throw Error('Hourly count exceeded');
            }
            // console.info('returning forecast');
            // eslint-disable-next-line no-await-in-loop
            await sleep(timeout);
            return forecast;
        }
            // eslint-disable-next-line no-else-return
        else {
            // eslint-disable-next-line no-await-in-loop
            await sleep(timeout);
            timeout += 500;
        }
    } while (timeout < 3000);
    console.log(lastError);
    throw Error(`Failed to get Tomorrow.io forecast from ${forecastUrl}:${lastError}`);
}
/* eslint-disable max-params,max-lines-per-function */

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
const callClimacell = async function (lat, lon, currentTime, distance, zone, bearing, getBearingDifference) {
    const climacellKey = process.env.CLIMACELL_KEY;
    const startTime = moment(currentTime);
    const endTime = startTime.clone();
    endTime.add(1, 'hours');
    const startTimeString = startTime.utc().format('YYYY-MM-DD[T]HH:mm:ss[Z]');
    const endTimeString = endTime.utc().format('YYYY-MM-DD[T]HH:mm:ss[Z]');
    const now = startTime.tz(zone);
    const url = `https://data.climacell.co/v4/timelines?location=${lat},${lon}&fields=windSpeed,precipitationProbability,windDirection,temperature,temperatureApparent,windGust,cloudCover,precipitationType,weatherCode,humidity&timezone=${zone}&startTime=${startTimeString}&endTime=${endTimeString}&timesteps=1h&units=imperial&apikey=${climacellKey}`;
    const forecast = await getFromTomorrowIoWithBackoff(url);

/*
        result.apiCalls = response.headers.get('X-RateLimit-Remaining-day');
        result.apiCallsHour = response.headers.get('X-RateLimit-Remaining-hour');
        console.log(`${result.apiCalls}/${response.headers.get('X-RateLimit-Limit-day')} calls for today`);
        console.log(`${response.headers.get('X-RateLimit-Remaining-hour')}/${response.headers.get('X-RateLimit-Limit-hour')} calls remaining this hour`);
 */
    const current = forecast.data.timelines[0];
    const values = current.intervals[0].values;
    const hasWind = values.windSpeed !== undefined;
    const windBearing = values.windDirection;
    const relativeBearing = hasWind && windBearing !== undefined ? getBearingDifference(bearing, windBearing) : null;
    const rainy = current.precipitationType === 1;
    return {
        'time':now.format('h:mmA'),
        'distance':distance,
        'summary':weatherCodes[values.weatherCode],
        'precip':values.precipitationProbability===undefined?'<unavailable>':`${values.precipitationProbability.toFixed(1)}%`,
        'humidity':Math.round(values.humidity),
        'cloudCover':values.cloudCover===undefined?'<unavailable>':`${values.cloudCover.toFixed(1)}%`,
        'windSpeed':!hasWind?'<unavailable>':`${Math.round(values.windSpeed)}`,
        'lat':lat,
        'lon':lon,
        'temp':`${Math.round(values.temperature)}`,
        'fullTime':now.format('ddd MMM D h:mmA YYYY'),
        'relBearing':relativeBearing,
        'rainy':rainy,
        'windBearing':Math.round(windBearing),
        'vectorBearing':bearing,
        'gust':values.windGust===undefined?'<unavailable>':`${Math.round(values.windGust)}`,
        'feel':values.temperatureApparent===undefined?Math.round(values.temperature):Math.round(values.temperatureApparent)
    }
};

module.exports = callClimacell;