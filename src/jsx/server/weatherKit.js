const { DateTime } = require("luxon");
const jwt = require("jsonwebtoken");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
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

const showAvailability = (lat, lon, weatherKitKey) => {
    const aUrl = `https://weatherkit.apple.com/api/v1/availability/${lat}/${lon}`
    const aResult = fetch(aUrl,{headers: {'Authorization':`Bearer ${weatherKitKey}`}}).then(response => {return response.json()}).
    then(availablity => console.info(availablity))
}
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
const callWeatherKit = function (lat, lon, currentTime, distance, zone, bearing, getBearingDifference) {
    const startTime = DateTime.fromISO(currentTime, {zone:'utc'});
    const weatherKitKey = makeJwt();
    const when = startTime.toISO({suppressMilliseconds:true});
    const later = startTime.plus({hours:1}).toISO({suppressMilliseconds:true});
    // showAvailability(lat,lon,weatherKitKey)
    const url = `https://weatherkit.apple.com/api/v1/weather/en/${lat}/${lon}?timezone=${zone}&dataSets=currentWeather,forecastHourly,forecastNextHour,&countryCode=US&currentAsOf=${when}&hourlyStart=${when}&hourlyEnd=${later}`;
    console.info(`WeatherKit URL ${url}`);
    const forecastResult = fetch(url,{headers: {'Authorization':`Bearer ${weatherKitKey}`}}).then(response => {
        if (!response.ok) {throw response.errorText?response.errorText:`Error ${response.status}`}
        else {
            const result = response.json();
            return result;}}).
    then(forecast => {
        const current = forecast.forecastHourly.hours[0];
        const now = DateTime.fromISO(current.forecastStart, {zone:zone});
        const windBearing = current.windDirection;
        const relativeBearing = windBearing !== undefined ? getBearingDifference(bearing, windBearing) : null;
        const rainy = current.conditionCode === "Rain";
        const temperatureInC = current.temperature;
        // eslint-disable-next-line no-mixed-operators
        const temperatureInF = temperatureInC * 9/5 + 32;
        return {
            'time':now.toFormat('h:mm a'),
            'distance':distance,
            'summary':current.conditionCode,
            'precip':`${(current.precipitationChance*100).toFixed(1)}%`,
            'humidity':Math.round(current.humidity*100),
            'cloudCover':`${(current.cloudCover*100).toFixed(1)}%`,
            'windSpeed':`${Math.round(current.windSpeed * 1000/milesToMeters)}`,
            'lat':lat,
            'lon':lon,
            'temp':`${Math.round(temperatureInF)}`,
            'fullTime':now.toFormat('EEE MMM d h:mma yyyy'),
            'relBearing':relativeBearing,
            'rainy':rainy,
            'windBearing':windBearing,
            'vectorBearing':bearing,
            'gust':current.windGust===undefined?'<unavailable>':`${Math.round(current.windGust * 1000/milesToMeters)}`,
            // eslint-disable-next-line no-mixed-operators
            'feel':Math.round(current.temperatureApparent * 9/5 + 32)
        }
    }).
    catch(error => {
        console.error('error',JSON.stringify(error));
        throw error;
    });
    return forecastResult;
};

module.exports = callWeatherKit;