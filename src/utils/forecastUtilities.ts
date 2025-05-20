import * as Sentry from '@sentry/browser';
import { DateTime } from 'luxon';
import { getRouteInfo } from './util';
import type { RootState } from "../redux/store";

interface TimeZoneResult {
    offset: number
    zoneId: string
}
const findTimezoneForPoint = (lat : number, lon : number, time : DateTime, timezone_api_key : string, abortSignal : AbortSignal): Promise<TimeZoneResult|Error> => {
    return fetch(`https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${time.toSeconds()}&key=${timezone_api_key}`, {signal: abortSignal})
    .then( response => {
        if (response.ok) {
            return response.json();
        }
        throw Error(response.statusText);
    })
    .then (body => {
        // check for error in body of message
        if (body.errorMessage !== undefined) {
            throw Error(body.errorMessage);
        }
        // determine total timezone offset in seconds
        let tzOffset = body.dstOffset + body.rawOffset;
        return ({offset:tzOffset,zoneId:body.timeZoneId});
    })
    .catch(error => {return Error(error.message + " time zone")});
}

import type { RouteInfoState } from 'redux/routeInfoSlice';
interface TimeZoneIdSuccess {
    result: "success"
    value: {offset: number, zoneId: string}
}
interface TimeZoneIdFailure {
    result: "error"
    error: string | Error
}
type TimeZoneIdType = TimeZoneIdSuccess | TimeZoneIdFailure

const getTimeZoneId = async (routeInfo : RouteInfoState, routeStart : DateTime, timezoneApiKey : string, abortSignal : AbortSignal) : Promise<TimeZoneIdType> => {
  const rwgpsRouteData = routeInfo.rwgpsRouteData
  if (routeInfo.type === "rwgps") {
      const rwgpsType = rwgpsRouteData.type
      const rwgpsRouteDatum = rwgpsRouteData[rwgpsType];
      if (!rwgpsRouteDatum) {
        return { result: "error", error: "RWGPS route data missing" }  
      }
      const point = rwgpsRouteDatum['track_points'][0]
      const zoneInfo = await findTimezoneForPoint(point.y, point.x, routeStart, timezoneApiKey, abortSignal);
      if (zoneInfo instanceof Error) {
          return { result : "error", error : zoneInfo}
      }
      return { result: "success", value: zoneInfo}
  } else if (routeInfo.gpxRouteData !== null) {
      if (routeInfo.gpxRouteData.tracks[0] === undefined) {
          Sentry.captureMessage(JSON.stringify(routeInfo.gpxRouteData));
          return { result: "error", error: "GPX route missing tracks" }
      }
      const point = routeInfo.gpxRouteData.tracks[0].points[0];
      const zoneInfo = await findTimezoneForPoint(point.lat, point.lon, routeStart, timezoneApiKey, abortSignal)
      if (zoneInfo instanceof Error) {
        return { result : "error", error : zoneInfo}
    }
    return { result: "success", value: zoneInfo }
  } else {
      return { result: "error", error: "Route data missing" }
  }
}

const getError = async (response : Response) => {
    try {
        let details = await response.clone().json();
        return details;
    } catch {
        let details = response.text();
        return {details:details}
    }
}

const doForecastFetch = async (path : string, formData : BodyInit, abortSignal : AbortSignal) => {
  try {
      const response = await fetch(path, {
          method: 'POST',
          body: formData,
          signal: abortSignal
      })
      if (response.ok) {
          return { result: "success", value: await response.json() }
      } else {
          let details = await getError(response);
          if (details !== undefined) {
              if (details.details !== undefined) {
                  throw new Error(details.details);
              } else {
                  throw new Error(details.status);
              }
          }
          let error = response.statusText !== undefined ? response.statusText : response.status.toString();
          throw new Error(error);
      }
  } catch (error : any) {
      let errorMessage = "message" in error ? error.message : error;
      return { result: "error", error: errorMessage }
  }
}

export const requestTimeZoneForRoute = async (routeInfo : RouteInfoState, routeStart: DateTime, apiKey: string) => {
    const fetchController = new AbortController()
    const timeZoneResults = await getTimeZoneId(routeInfo, routeStart, apiKey, fetchController.signal)
    if (timeZoneResults.result === "error") {
        return { result: "error", error: timeZoneResults.error }
    }
        
    return { result: timeZoneResults.value.zoneId }
}

export const doForecast = async (state : RootState, abortSignal : AbortSignal) => {
    const timeZoneResults = await getTimeZoneId(state.routeInfo, DateTime.fromMillis(state.uiInfo.routeParams.startTimestamp, { zone: state.uiInfo.routeParams.zone }),
        state.params.timezone_api_key, abortSignal)
    if (timeZoneResults.result === "error") {
        return { result: "error", error: timeZoneResults.error }
    }
    const { zoneId: timeZoneId } = timeZoneResults.value

    const parsedRouteInfo = getRouteInfo(state, timeZoneId, state.uiInfo.routeParams.segment)
    if (parsedRouteInfo === undefined) {
        return { result: "error", error: "No route could be loaded" }
    }
    const { forecastRequest } = parsedRouteInfo
    const formdata = new FormData();
    formdata.append('locations', JSON.stringify(forecastRequest));
    formdata.append('timezone', timeZoneId);
    formdata.append('service', state.forecast.weatherProvider);
    formdata.append('routeName', state.routeInfo.name);
    formdata.append('routeNumber', state.uiInfo.routeParams.rwgpsRoute);

    const forecastResults = await doForecastFetch(state.params.action, formdata, abortSignal)
    if (forecastResults.result === "success") {
        let forecast = { result: "success", value: { forecast: forecastResults.value, timeZoneId }, error: undefined }
        if (state.forecast.fetchAqi) {
            const aqiResults = await doForecastFetch("/aqi", formdata, abortSignal)
            if (aqiResults.result === "success") {
                for (let indx = 0;indx < forecastResults.value.forecast.length;indx++) {
                    forecastResults.value.forecast[indx].aqi = aqiResults.value.forecast[indx].aqi;
                }
            }
        }
        return forecast;
    } else {
        if (forecastResults.error === "The user aborted a request.") {
            return { result: "canceled", value: undefined }
        } else {
            return { result: "error", error: forecastResults.error, value: undefined }
        }
    }
}