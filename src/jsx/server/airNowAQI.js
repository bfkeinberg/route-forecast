const axios = require('axios');
const { DateTime } = require("luxon");

const airNowKey = process.env.AIRNOW_KEY;
const forecastDay = DateTime.now().toFormat("y-MM-dd");
const getAirNowAQI = async function (lat, lon) {
    const url = `https://www.airnowapi.org/aq/forecast/latLong/?format=application/json&latitude=${lat}&longitude=${lon}&date=${forecastDay}&API_KEY=${airNowKey}`;
    let airNowResult = await axios.get(url).catch(error => {
        console.log(error);
    });
    if (airNowResult.data.length===0) {
        return undefined;
    }
    let filteredResults = airNowResult.data.filter((obj) => obj.ParameterName==="PM2.5" && obj.AQI!==-1);
    if (filteredResults.length===0) {
        return undefined;
    }
    return filteredResults[filteredResults.length-1].AQI;
}

module.exports = getAirNowAQI;