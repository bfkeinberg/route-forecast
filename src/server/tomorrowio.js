const { DateTime } = require("luxon");
const axios = require('axios');
const axiosInstance = axios.create()
const Sentry = require("@sentry/node")
const axiosRetry = require('axios-retry').default

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

axiosRetry(axiosInstance, {
    retries: 4,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        switch (error.response.status) {
        case 429:
            return true;
        default:
            return false;
        }
    },
    onRetry: (retryCount) => {
        console.info(`tommorow.io axios retry count: ${retryCount}`);
    },
    onMaxRetryTimesExceeded: (err) => {
        console.log(`last tomorrow.io axios error after retrying was ${err}`)
    }
});

const getFromTomorrowIoWithBackoff = async (forecastUrl) => {
    const forecastResult = await axiosInstance.get(forecastUrl).catch(error => {
        Sentry.captureException(error)
        console.error('Axios error', error.response.statusText)
        throw Error(`Failed to get Tomorrow.io forecast from ${forecastUrl}:${error}`)
    })
    if (forecastResult !== undefined) {
        const forecast = forecastResult.data;
        if (forecast.code !== undefined) {
            Sentry.captureMessage(`got error code ${forecast.code} with ${forecast.message}`,'error')
            console.log(forecast);
        }
        return forecast;
    }
    Sentry.captureMessage(`No forecast returned from Tomrrow.io on ${forecastUrl}`)
    throw Error("No forecast from Tomorrow.io")
}

/* eslint-disable max-params */
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
 * lat: *, lon: *, temp: string, fullTime: *, relBearing: null, rainy: boolean, windBearing: number,
 * vectorBearing: *, gust: string} | never>} a promise to evaluate to get the forecast results
 */
const callTomorrowIo = async function callTomorrowIo (lat, lon, currentTime, distance, zone, bearing, getBearingDifference, isControl) {
    const climacellKey = process.env.CLIMACELL_KEY;
    const startTime = DateTime.fromISO(currentTime, {zone:zone});
    const endTime = startTime.plus({hours:1})

    const startTimeString = startTime.toISO()
    const endTimeString = endTime.toISO()
    const baseUrl = `https://api.tomorrow.io/v4/timelines?location=${lat},${lon}` +
        '&fields=windSpeed,precipitationProbability,windDirection,temperature,temperatureApparent,windGust,cloudCover,precipitationType,weatherCode,humidity,epaIndex' +
        `&timezone=${zone}&startTime=${startTimeString}&endTime=${endTimeString}&timesteps=1h&units=imperial`
    const url = `${baseUrl}&apikey=${climacellKey}`
    Sentry.setContext('url',{'url':baseUrl})
    const forecast = await getFromTomorrowIoWithBackoff(url);

    const current = forecast.data.timelines[0];
    const now = DateTime.fromISO(current.startTime, {zone:zone})
    const values = current.intervals[0].values;
    const hasWind = values.windSpeed !== undefined;
    const windBearing = values.windDirection;
    const relativeBearing = hasWind && windBearing !== undefined ? getBearingDifference(bearing, windBearing) : null;
    const rainy = current.precipitationType === 1;
    return {
        'time':current.startTime,
        zone:zone,
        'distance':distance,
        'summary':weatherCodes[values.weatherCode],
        'precip':values.precipitationProbability===undefined?'<unavailable>':`${values.precipitationProbability.toFixed(1)}%`,
        'humidity':Math.round(values.humidity),
        'cloudCover':values.cloudCover===undefined?'<unavailable>':`${values.cloudCover.toFixed(1)}%`,
        'windSpeed':!hasWind?'<unavailable>':`${Math.round(values.windSpeed)}`,
        'lat':lat,
        'lon':lon,
        'temp':`${Math.round(values.temperature)}`,
        'fullTime':now.toFormat('EEE MMM d h:mma yyyy'),
        'relBearing':relativeBearing,
        'rainy':rainy,
        'windBearing':Math.round(windBearing),
        'vectorBearing':bearing,
        'gust':values.windGust===undefined?'<unavailable>':`${Math.round(values.windGust)}`,
        'feel':values.temperatureApparent===undefined?Math.round(values.temperature):Math.round(values.temperatureApparent),
        'aqi':values.epaIndex,
        isControl:isControl
    }
};

module.exports = callTomorrowIo