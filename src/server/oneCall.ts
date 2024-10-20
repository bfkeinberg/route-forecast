import { AxiosError } from "axios";
import { WeatherFunc } from "./weatherForecastDispatcher";

const { DateTime } = require("luxon");
const axios = require('axios');
const Sentry = require("@sentry/node")
const axiosInstance = axios.create()
const axiosRetry = require('axios-retry').default

axiosRetry(axiosInstance, {
    retries: 5,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error: { response: { status: any; }; }) => {
        // in the weird case that we don't get a response field in the error then report to Sentry and fail the request
        if (!error.response) {
            Sentry.captureMessage(`Error object reported to OneCall was missing the response`)
            Sentry.captureMessage(`Defective error object from OneCall:${JSON.stringify(error)}`)
            return false
        }
        switch (error.response.status) {
        case 501:
        case 429:
            return true;
        default:
            return false;
        }
    },
    onRetry: (retryCount: number, error: any, requestConfig: { url: string; }) => {
        console.log(`OneCall axios retry count ${retryCount} for ${requestConfig.url}`);
    },
    onMaxRetryTimesExceeded: (err: any) => {
        console.log(`last OneCall axios error after retrying was ${err}`)
    }
});

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
 * @param {boolean} isControl the forecast point is from a controle
 * @returns {Promise<{time: *, distance: *, summary: *, precip: string, cloudCover: string, windSpeed: string,
 * lat: *, lon: *, temp: string, relBearing: null, rainy: boolean, windBearing: number,
 * vectorBearing: *, gust: string} | never>} a promise to evaluate to get the forecast results
 */
const callOneCall = async function callWeatherApi (lat, lon, currentTime, distance, zone, bearing, getBearingDifference, isControl) {
    const oneCallKey = process.env.OPEN_WEATHER_KEY;
    const startTime = DateTime.fromISO(currentTime, {zone:zone});
    const url = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&units=imperial&dt=${startTime.toUTC().toUnixInteger()}&appid=${oneCallKey}`
    Sentry.setContext('url',{'url':url})
    const forecastResult = await axios.get(url).catch((error : AxiosError) => {
        if ("response" in error && error.response && "data" in error.response && error.response.data && error.response.data) {
            throw Error((error.response.data as string));
        } else {
            throw Error(error.message);
        }
    });
    if (forecastResult.data.error !== undefined && forecastResult.data.error.code !== undefined) {
        Sentry.captureMessage(`OneCall error ${forecastResult.error.message}`,'error')
        throw Error(forecastResult.error.message);
    }
    const current = forecastResult.data.data[0]
    const now = DateTime.fromSeconds(current.dt, {zone:zone});
    const windBearing = current.wind_deg;
    const relativeBearing = getBearingDifference(bearing, windBearing)
    const rainy = current.weather[0].main.match(/rain/i) ? true : false
    return {
        'time':now.toISO(),
        zone:zone,
        'distance':distance,
        'summary':current.weather[0].description,
        'precip':current.rain?'100%':`0%`,
        'humidity':current.humidity,
        'cloudCover':`${current.clouds.toFixed(1)}%`,
        'windSpeed':`${Math.round(current.wind_speed)}`,
        'lat':lat,
        'lon':lon,
        'temp':`${Math.round(current.temp)}`,
        'relBearing':relativeBearing,
        'rainy':rainy,
        'windBearing':windBearing,
        'vectorBearing':bearing,
        'gust':`${Math.round(current.wind_gust)}`,
        'feel':Math.round(current.feels_like),
        isControl:isControl
    }
} as WeatherFunc

module.exports = callOneCall;