const { DateTime } = require("luxon");
const jwt = require("jsonwebtoken");
const Sentry = require("@sentry/node")
const axios = require('axios');
const axiosRetry = require('axios-retry').default

const milesToMeters = 1609.34;

const keyId = "4JSC7L3B75";
const teamId = "2B6A6N9QBQ";
const serviceId = "com.randoplan.weatherkit-client";
const privateKey = process.env.WEATHERKIT_KEY;
const makeJwt = () => {
    return jwt.sign(
        {
            sub: serviceId
        },
        privateKey,
        {
            algorithm: "ES256",
            expiresIn: "1h",
            issuer: teamId,
            header: {
                alg: "ES256",
                kid: keyId,
                id: `${teamId}.${serviceId}`
            }
        }
    )
}

axiosRetry(axios, {
    retries: 10,
    retryDelay: (...arg) => axiosRetry.exponentialDelay(...arg, 200),
    retryCondition (error) {
        if (!error.response) {return false}
        switch (error.response.status) {
        case 504:
        case 404:
            return true;
        default:
            return false;
        }
    },
    onRetry: (retryCount) => {
        console.log(`axios retry count: `, retryCount);
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
  * @returns {Promise<{time: *, distance: *, summary: *, precip: string, cloudCover: string, windSpeed: string,
 * lat: *, lon: *, temp: string, fullTime: *, relBearing: null, rainy: boolean, windBearing: number,
 * vectorBearing: *, gust: string} | never>} a promise to evaluate to get the forecast results
 */
const callWeatherKit = async function (lat, lon, currentTime, distance, zone, bearing, getBearingDifference) {
    const startTime = DateTime.fromISO(currentTime, { zone: 'utc' });
    const weatherKitKey = makeJwt();
    const when = startTime.toISO({ suppressMilliseconds: true });
    const later = startTime.plus({ hours: 1 }).toISO({ suppressMilliseconds: true });
    const url = `https://weatherkit.apple.com/api/v1/weather/en/${lat}/${lon}?timezone=${zone}&dataSets=currentWeather,forecastHourly,forecastNextHour,&countryCode=US&currentAsOf=${when}&hourlyStart=${when}&hourlyEnd=${later}`;
    Sentry.setContext('url', { 'url': url })
    const forecastResult = await axios.get(url, { headers: { 'Authorization': `Bearer ${weatherKitKey}` } }).
        catch(error => {
            Sentry.captureException(error)
            throw error;
        });
    const forecast = forecastResult.data
    const current = forecast.forecastHourly.hours[0];
    const now = DateTime.fromISO(forecast.currentWeather.asOf, { zone: zone });
    const windBearing = forecast.currentWeather.windDirection
    const relativeBearing = getBearingDifference(bearing, windBearing)
    const rainy = forecast.currentWeather.conditionCode === "Rain";
    const temperatureInC = forecast.currentWeather.temperature;
    // eslint-disable-next-line no-mixed-operators
    const temperatureInF = temperatureInC * 9 / 5 + 32;
    return {
        'time': now.toFormat('h:mm a'),
        'distance': distance,
        'summary': forecast.currentWeather.conditionCode,
        'precip': `${(current.precipitationChance * 100).toFixed(1)}%`,
        'humidity': Math.round(current.humidity * 100),
        'cloudCover': `${(forecast.currentWeather.cloudCover * 100).toFixed(1)}%`,
        'windSpeed': `${Math.round(forecast.currentWeather.windSpeed * 1000 / milesToMeters)}`,
        'lat': lat,
        'lon': lon,
        'temp': `${Math.round(temperatureInF)}`,
        'fullTime': now.toFormat('EEE MMM d h:mma yyyy'),
        'relBearing': relativeBearing,
        'rainy': rainy,
        'windBearing': windBearing,
        'vectorBearing': bearing,
        'gust': current.windGust === undefined ? '<unavailable>' : `${Math.round(forecast.currentWeather.windGust * 1000 / milesToMeters)}`,
        // eslint-disable-next-line no-mixed-operators
        'feel': Math.round(forecast.currentWeather.temperatureApparent * 9 / 5 + 32)
    }
};

module.exports = callWeatherKit;