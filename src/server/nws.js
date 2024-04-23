const { DateTime, Interval } = require("luxon");
const axios = require('axios');
const Sentry = require("@sentry/node")
const milesToMeters = 1609.34;
const axiosRetry = require('axios-retry').default

const getForecastUrl = async (lat, lon) => {
    const url = `https://api.weather.gov/points/${lat},${lon}`;
    const gridResult = await axios.get(url).catch(
        error => {throw error.response.data.detail});
    return gridResult.data.properties.forecastGridData;
}

const findNearestTime = (data, time) => {
    let newerThan = data.values.filter(value => {return Interval.fromISO(value.validTime).contains(time)});
    if (newerThan.length === 0) {
        throw Error("No matching weather data");
    }
    return newerThan[0].value;
};

const extractForecast = (forecastGridData, currentTime) => {
    const temperatureInC = findNearestTime(forecastGridData.data.properties.temperature, currentTime);
    const apparentTemperatureInC = findNearestTime(forecastGridData.data.properties.apparentTemperature, currentTime);
    const cloudCover = findNearestTime(forecastGridData.data.properties.skyCover, currentTime);
    const windBearing = findNearestTime(forecastGridData.data.properties.windDirection, currentTime);
    const windSpeed = findNearestTime(forecastGridData.data.properties.windSpeed, currentTime);
    const gust = findNearestTime(forecastGridData.data.properties.windGust, currentTime);
    const precip = findNearestTime(forecastGridData.data.properties.probabilityOfPrecipitation, currentTime);
    const summary = findNearestTime(forecastGridData.data.properties.weather, currentTime).weather;
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

axiosRetry(axios, {
    retries: 10,
    retryDelay: (...arg) => axiosRetry.exponentialDelay(...arg, 200),
    retryCondition (error) {
        if (!error.response) {return false}
        switch (error.response.status) {
        case 500:
            return true;
        default:
            return false;
        }
    },
    onRetry: (retryCount) => {
        console.log(`axios retry count: `, retryCount);
    }
});

const getForecastFromNws = async (forecastUrl) => {
    const forecastGridData = await axios.get(forecastUrl, { headers: { "User-Agent": '(randoplan.com, randoplan.ltd@gmail.com)' } }).catch(
        error => {
            Sentry.captureException(error)
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
  * @returns {Promise<{time: *, distance: *, summary: *, precip: string, humidity: number, cloudCover: string, windSpeed: string,
 * lat: *, lon: *, temp: string, fullTime: *, relBearing: null, rainy: boolean, windBearing: number,
 * vectorBearing: *, gust: string} | never>} a promise to evaluate to get the forecast results
 */
const callNWS = async function (lat, lon, currentTime, distance, zone, bearing, getBearingDifference) {
    const forecastUrl = await getForecastUrl(lat, lon);
    Sentry.setContext('url', {'forecastUrl': forecastUrl})
    const forecastGridData = await getForecastFromNws(forecastUrl);
    const startTime = DateTime.fromISO(currentTime, {zone:zone});
    const forecastValues = extractForecast(forecastGridData, startTime, bearing, getBearingDifference);
    const rainy = forecastValues.precip > 30;
    // eslint-disable-next-line no-mixed-operators
    const temperatureInF = forecastValues.temperatureInC * 9/5 + 32;
    // eslint-disable-next-line no-mixed-operators
    const apparentTemperatureInF = forecastValues.apparentTemperatureInC * 9/5 + 32;
    const windSpeedInMph = forecastValues.windSpeedInKph * 1000/milesToMeters;
    const windGustInMph = forecastValues.gustInKph * 1000/milesToMeters;

    return new Promise((resolve) => {resolve({
        'time':startTime.toFormat('h:mm a'),
        'distance':distance,
        'summary':forecastValues.summary,
        'precip':`${forecastValues.precip.toFixed(1)}%`,
        'humidity':forecastValues.humidity,
        'cloudCover':`${forecastValues.cloudCover.toFixed(1)}%`,
        'windSpeed':`${Math.round(windSpeedInMph)}`,
        'lat':lat,
        'lon':lon,
        'temp':`${Math.round(temperatureInF)}`,
        'fullTime':startTime.toFormat('EEE MMM d h:mma yyyy'),
        'relBearing':getBearingDifference(bearing, forecastValues.windBearing),
        'rainy':rainy,
        'windBearing':Math.round(forecastValues.windBearing),
        'vectorBearing':bearing,
        'gust':`${Math.round(windGustInMph)}`,
        'feel':Math.round(apparentTemperatureInF)
    }
    )
    }
 )
};

module.exports = callNWS;