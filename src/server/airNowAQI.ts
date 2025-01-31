import axios from "axios";
const { DateTime } = require("luxon");
import * as Sentry from "@sentry/node"
const axiosInstance = axios.create()
const axiosRetry = require('axios-retry').default
const airNowKey = process.env.AIRNOW_KEY;
const forecastDay = DateTime.now().toFormat("y-MM-dd");

axiosRetry(axiosInstance, {
    retries: 5,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error: { response: { status: any; }; }) => {
        switch (error.response.status) {
        case 504:
            return true;
        default:
            return false;
        }
    },
    onRetry: (retryCount: number, error: any, requestConfig: { url: string; }) => {
        console.log(`AirNow axios retry count ${retryCount} for ${requestConfig.url}`);
    },
    onMaxRetryTimesExceeded: (err: any) => {
        Sentry.captureMessage(`last AirNow axios error after retrying was ${err}`)
    }
});

const getAirNowAQI = async function (lat : number, lon : number) {
    const url = `https://www.airnowapi.org/aq/forecast/latLong/?format=application/json&latitude=${lat}&longitude=${lon}&date=${forecastDay}&API_KEY=${airNowKey}`;
    let airNowResult = await axiosInstance.get<Array<IqAirData>>(url).catch((error: any) => {
        Sentry.captureException(error)
    });
    if (!airNowResult || airNowResult.data.length===0) {
        return undefined;
    }
    interface IqAirData {
        ParameterName: string;
        AQI: number;
    }

    let filteredResults = airNowResult.data.filter((obj: IqAirData) => obj.ParameterName==="PM2.5" && obj.AQI!==-1);
    if (filteredResults.length===0) {
        return undefined;
    }
    return filteredResults[filteredResults.length-1].AQI;
}

export default getAirNowAQI;