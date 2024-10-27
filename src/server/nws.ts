import { WeatherFunc } from "./weatherForecastDispatcher";

import { DateTime, Interval } from "luxon"
const axios = require('axios');
const axiosInstance = axios.create()
const Sentry = require("@sentry/node")
const milesToMeters = 1609.34;
const axiosRetry = require('axios-retry').default

axiosRetry(axiosInstance, {
    retries: 5,
    retryDelay: (...arg: any) => axiosRetry.exponentialDelay(...arg, 400),
    retryCondition: (error: { response: { status: any; }; message: any; }) => {
        // in the weird case that we don't get a response field in the error then report to Sentry and fail the request
        if (!error.response) {
            Sentry.addBreadcrumb({category:'nws',level:'error',message:`NWS error ${error.message}`})
            return false
        }
        switch (error.response.status) {
        case 500:
            return true;
        default:
            return false;
        }
    },
    onRetry: (retryCount: any, error: any, requestConfig: { url: any; }) => {
        console.log(`nws axios retry count: ${retryCount} for ${requestConfig.url}`)
    },
    onMaxRetryTimesExceeded: (err: any) => {
        console.log(`last nws axios error after retrying was ${err}`)
    }
})

const getForecastUrl = async (lat : number, lon : number) => {
    const url = `https://api.weather.gov/points/${lat},${lon}`;
    const gridResult = await axiosInstance.get(url).catch(
        (        error: { response: { data: { detail: any; }; }; }) => {throw error.response.data.detail});
    if (!gridResult.data.properties.forecastGridData) {
        Sentry.addBreadcrumb({category:'nws', 
            level:'error',
            message:`NWS API call returned ${JSON.stringify(gridResult.data.properties)} but no forecast URL`
        })
    }
    return gridResult.data.properties.forecastGridData;
}

interface ValueType<T> {
    values: Array<{validTime: string, value: T}>
}
interface ForecastGridType {
    data : {
        properties: {
            temperature: ValueType<number>
            apparentTemperature: ValueType<number>
            skyCover: ValueType<number>
            windDirection : ValueType<number>
            windSpeed: ValueType<number>
            windGust: ValueType<number>
            probabilityOfPrecipitation : ValueType<number>
            weather: ValueType<{weather:string}>
            relativeHumidity : ValueType<number>
        }
    }
}
const findNearestTime = <T>(data : {values: Array<{validTime: string, value: T}>}, time : DateTime) : T => {
    let newerThan = data.values.filter(value => {return Interval.fromISO(value.validTime).contains(time)});
    if (newerThan.length === 0) {
        throw Error("No matching weather data");
    }
    return newerThan[0].value;
};

const extractForecast = (forecastGridData : ForecastGridType, currentTime : DateTime) => {
    const temperatureInC = findNearestTime(forecastGridData.data.properties.temperature, currentTime);
    const apparentTemperatureInC = findNearestTime(forecastGridData.data.properties.apparentTemperature, currentTime);
    const cloudCover = findNearestTime(forecastGridData.data.properties.skyCover, currentTime);
    const windBearing = findNearestTime(forecastGridData.data.properties.windDirection, currentTime);
    const windSpeed = findNearestTime(forecastGridData.data.properties.windSpeed, currentTime);
    const gust = findNearestTime(forecastGridData.data.properties.windGust, currentTime);
    const precip = findNearestTime(forecastGridData.data.properties.probabilityOfPrecipitation, currentTime);
    const summary = findNearestTime<{weather:string}>(forecastGridData.data.properties.weather, currentTime).weather;
    const humidity = findNearestTime(forecastGridData.data.properties.relativeHumidity, currentTime);

    return {
        temperatureInC:temperatureInC,
        apparentTemperatureInC:apparentTemperatureInC,
        cloudCover:cloudCover,
        windBearing:windBearing,
        windSpeedInKph:windSpeed,
        gustInKph:gust,
        precip:precip,
        summary:summary,
        humidity:humidity
    }
};

const getForecastFromNws = async (forecastUrl : string) => {
    const forecastGridData = await axiosInstance.get(forecastUrl, { headers: { "User-Agent": '(randoplan.com, randoplan.ltd@gmail.com)' } }).catch(
        (        error: any) => {
            Sentry.addBreadcrumb({
                category:'nws',level:'error',message:`Failed to get NWS forecast from ${forecastUrl}`
            })
            throw Error(`Failed to get NWS forecast from ${forecastUrl}`)
        }
    );
    return forecastGridData;
};
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
  * @returns {Promise<{time: *, distance: *, summary: *, precip: string, humidity: number, cloudCover: string, windSpeed: string,
 * lat: *, lon: *, temp: string, fullTime: *, relBearing: null, rainy: boolean, windBearing: number,
 * vectorBearing: *, gust: string} | never>} a promise to evaluate to get the forecast results
 */
const callNWS = async function (lat, lon, currentTime, distance, zone, bearing, getBearingDifference, isControl) {
    const forecastUrl = await getForecastUrl(lat, lon);
    Sentry.setContext('forecastUrl', {'forecastUrl': forecastUrl})
    if (!forecastUrl) {
        Sentry.captureMessage(`NWS forecast url for ${lat} ${lon} was null`)
    }
    const forecastGridData = await getForecastFromNws(forecastUrl);
    const startTime = DateTime.fromISO(currentTime, {zone:zone});
    const forecastValues = extractForecast(forecastGridData, startTime);
    const rainy = forecastValues.precip > 30;
    // eslint-disable-next-line no-mixed-operators
    const temperatureInF = forecastValues.temperatureInC * 9/5 + 32;
    // eslint-disable-next-line no-mixed-operators
    const apparentTemperatureInF = forecastValues.apparentTemperatureInC * 9/5 + 32;
    const windSpeedInMph = forecastValues.windSpeedInKph * 1000/milesToMeters;
    const windGustInMph = forecastValues.gustInKph * 1000/milesToMeters;

    return new Promise((resolve) => {resolve({
        'time':currentTime,
        'zone':zone,
        'distance':distance,
        'summary':forecastValues.summary,
        'precip':`${forecastValues.precip.toFixed(1)}%`,
        'humidity':forecastValues.humidity,
        'cloudCover':`${forecastValues.cloudCover.toFixed(1)}%`,
        'windSpeed':`${Math.round(windSpeedInMph)}`,
        'lat':lat,
        'lon':lon,
        'temp':`${Math.round(temperatureInF)}`,
        'relBearing':getBearingDifference(bearing, forecastValues.windBearing),
        'rainy':rainy,
        'windBearing':Math.round(forecastValues.windBearing),
        'vectorBearing':bearing,
        'gust':`${Math.round(windGustInMph)}`,
        'feel':Math.round(apparentTemperatureInF),
        isControl:isControl
    }
    )
    }
 )
} as WeatherFunc

export default callNWS