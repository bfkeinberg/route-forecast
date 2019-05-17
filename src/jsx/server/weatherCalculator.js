import moment from 'moment-timezone';
import fetch from 'node-fetch';

const getBearingDifference = function (bearing,windBearing) {
    return Math.min(bearing - windBearing < 0 ? bearing - windBearing + 360 : bearing - windBearing,
        windBearing - bearing < 0 ? windBearing - bearing + 360 : windBearing - bearing);
};

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
export default function callWeatherService (lat, lon, currentTime, distance, zone, bearing) {
    const MAX_API_CALLS_PER_DAY = 2000;

    const darkSkyKey = process.env.DARKSKY_API_KEY;
    const url = `https://api.darksky.net/forecast/${darkSkyKey}/${lat},${lon},${currentTime}?exclude=hourly,daily,flags`;
    const forecastResult = fetch(url,{headers: {"Accept-Encoding": "gzip"}}).then(response => {
        if (!response.ok) {throw response.errorText}
        else {
            const result = response.json();
            result.apiCalls = response.headers.get('x-forecast-api-calls');
            return result;}}).
    then(forecast => {
        if (forecast.apiCalls > MAX_API_CALLS_PER_DAY) {
            throw Error({'details':'Daily count exceeded'});
        }
        const current = forecast.currently;
        const now = moment.unix(current.time).tz(zone);
        const hasWind = current.windSpeed !== undefined;
        const windBearing = current.windBearing;
        const relativeBearing = hasWind && windBearing !== undefined ? getBearingDifference(bearing, windBearing) : null;
        const rainy = current.icon !== undefined && current.icon === 'rain';
        return {
            'time':now.format('h:mmA'),
            'distance':distance,
            'summary':current.summary,
            'tempStr':`${Math.round(current.temperature)}F`,
            'precip':current.precipProbability===undefined?'<unavailable>':`${(current.precipProbability*100).toFixed(1)}%`,
            'cloudCover':current.cloudCover===undefined?'<unavailable>':`${(current.cloudCover*100).toFixed(1)}%`,
            'windSpeed':!hasWind?'<unavailable>':`${Math.round(current.windSpeed)}`,
            'lat':lat,
            'lon':lon,
            'temp':`${Math.round(current.temperature)}`,
            'fullTime':now.format('ddd MMM D h:mmA YYYY'),
            'relBearing':relativeBearing,
            'rainy':rainy,
            'windBearing':windBearing,
            'vectorBearing':bearing,
            'gust':current.windGust===undefined?'<unavailable>':`${Math.round(current.windGust)}`,
            'feel':current.apparentTemperature===undefined?Math.round(current.temperature):Math.round(current.apparentTemperature)
        }
    }).
    catch(error => {
        console.error('error',JSON.stringify(error));
        throw error;
    });
    return forecastResult;
}