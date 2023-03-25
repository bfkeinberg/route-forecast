const { DateTime } = require("luxon");
const axios = require('axios');
const MeteomaticsUser = process.env.METEOMATICS_USERNAME;
const MeteomaticsPassword = process.env.METEOMATICS_PASSWORD;
const encodedBase64Token = Buffer.from(`${MeteomaticsUser}:${MeteomaticsPassword}`).toString('base64');

const authorization = `Basic ${encodedBase64Token}`;
const axiosConfig = {
    headers: {
        Authorization: authorization
    }
}

const getForecastUrl = (lat, lon) => {
    const url = `https://api.meteomatics.com/2023-03-25T11:15:00.000-07:00/t_2m:F,wind_speed_FL10:mph,wind_dir_FL10:d,wind_gusts_10m_1h:mph,prob_precip_1h:p,low_cloud_cover_10y_mean:p,t_apparent:F,weather_code_1h:idx,weather_symbol_20min:idx/${lat},${lon}/json?model=mix`;
    return url;
}

const extractForecast = (forecastGridData) => {
    const temperatureInF = forecastGridData[0].coordinates[0].dates[0].value;
    const apparentTemperatureInF = forecastGridData[6].coordinates[0].dates[0].value;
    const cloudCover = forecastGridData[5].coordinates[0].dates[0].value;
    const windBearing = forecastGridData[2].coordinates[0].dates[0].value;
    const windSpeedInMph = forecastGridData[1].coordinates[0].dates[0].value;
    const windGustInMph = forecastGridData[3].coordinates[0].dates[0].value;
    const precipitationProbability = forecastGridData[4].coordinates[0].dates[0].value;
    const summary = forecastGridData[7].coordinates[0].dates[0].value;

    return {
        temperatureInF:temperatureInF,
        apparentTemperatureInF:apparentTemperatureInF,
        cloudCover:cloudCover,
        windBearing:windBearing,
        windSpeedInMph:windSpeedInMph,
        windGustInMph:windGustInMph,
        precipitationProbability:precipitationProbability,
        summary:summary
    }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const get_API_usage = async () => {
    const usageData = await axios.get("https://api.meteomatics.com/user_stats_json", axiosConfig).catch(
        error => {console.error(`Failed to get Meteomatics usage ${error}}`);return 0}
    );
    if (usageData === 0) {
        return usageData;
    }
    return usageData.data["user statistics"]["requests total"].used;
}

const getForecastFromMeteomatics = async (forecastUrl) => {
    const MAX_API_CALLS_PER_DAY = 800;
    let timeout = 200;
    const usage = await get_API_usage();
    console.log(`Meteomatics API usage ${usage}`);
    if (usage > MAX_API_CALLS_PER_DAY) {
        throw Error({'details':'Daily count exceeded'});
    }
    do {
        // eslint-disable-next-line no-await-in-loop
        const forecastGridData = await axios.get(forecastUrl, axiosConfig).catch(
            error => {console.error(`Failed to get Meteomatics forecast from ${forecastUrl}:${JSON.stringify(error.response.data)}`)});
        if (forecastGridData !== undefined) {
            if (forecastGridData.data !== undefined && forecastGridData.data.status === "OK") {
                return forecastGridData.data;
            }
            throw Error(forecastGridData.data!==undefined?forecastGridData.data.messsage:`Failed to get Meteomatics forecast from ${forecastUrl}`);
        }
        // eslint-disable-next-line no-await-in-loop
        await sleep(timeout);
        timeout += 100;
    } while (timeout < 1000);
    throw Error(`Failed to get Meteomatics forecast from ${forecastUrl}`);
};
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
  * @returns {Promise<{time: *, distance: *, summary: *, tempStr: string, precip: string, cloudCover: string, windSpeed: string,
 * lat: *, lon: *, temp: string, fullTime: *, relBearing: null, rainy: boolean, windBearing: number,
 * vectorBearing: *, gust: string} | never>} a promise to evaluate to get the forecast results
 */
const callMeteomatics = async function (lat, lon, currentTime, distance, zone, bearing, getBearingDifference) {
    const forecastUrl = await getForecastUrl(lat, lon);
    const forecastGridData = await getForecastFromMeteomatics(forecastUrl);
    const startTime = DateTime.fromISO(currentTime, {zone:zone});
    const forecastValues = extractForecast(forecastGridData.data);
    const rainy = forecastValues.precipitationProbability > 30;
    return new Promise((resolve) => {resolve({
        'time':startTime.toFormat('h:mm a'),
        'distance':distance,
        'summary':forecastValues.summary,
        'tempStr':`${Math.round(forecastValues.temperatureInF)}F`,
        'precip':`${forecastValues.precipitationProbability.toFixed(1)}%`,
        'cloudCover':`${forecastValues.cloudCover.toFixed(1)}%`,
        'windSpeed':`${Math.round(forecastValues.windSpeedInMph)}`,
        'lat':lat,
        'lon':lon,
        'temp':`${Math.round(forecastValues.temperatureInF)}`,
        'fullTime':startTime.toFormat('EEE MMM d h:mma yyyy'),
        'relBearing':getBearingDifference(bearing, forecastValues.windBearing),
        'rainy':rainy,
        'windBearing':Math.round(forecastValues.windBearing),
        'vectorBearing':bearing,
        'gust':`${Math.round(forecastValues.windGustInMph)}`,
        'feel':Math.round(forecastValues.apparentTemperatureInF)
    }
    )
    }
 )
};

module.exports = callMeteomatics;