import * as Sentry from "@sentry/react";
import { DateTime, Interval } from 'luxon';
import { useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"

import { routeLoadingModes } from "../data/enums"
import gpxParser from "./gpxParser"
import stravaRouteParser from "./stravaRouteParser"
import { getRouteInfo, getForecastRequest, milesToMeters } from "./util"
const useDelay = (delay, startCondition = true) => {
  const [
ready,
setReady
] = useState(false)
  useEffect(() => {
    if (startCondition) {
      setTimeout(() => {
        setReady(true)
      }, delay)
    }
  }, [
delay,
startCondition
])
  return ready
}

const useReusableDelay = (delay, startCondition = true) => {
  const [
ready,
setReady
] = useState(false)
  const [
restartedAt,
setRestartedAt
] = useState(null)
  const timeout = useRef(null)

  const cancel = () => {
    if (timeout.current !== null) {
      clearTimeout(timeout.current)
    }
  }

  useEffect(() => {
    if (timeout.current !== null) {
      clearTimeout(timeout.current)
    }
    if (startCondition) {
      timeout.current = setTimeout(() => {
        setReady(true)
        timeout.current = null
      }, delay)
    } else {
      setReady(false)
    }

    return cancel
  }, [
delay,
startCondition,
restartedAt
])

  const restart = () => {
    setReady(false)
    setRestartedAt(Date.now())
  }
  return [
ready,
restart,
cancel
]
}

const useValueHasChanged = (value, startValue) => {
  const [
oldValue,
setOldValue
] = useState(value)
  const [
hasChanged,
setHasChanged
] = useState(false)
  useEffect(() => {
    if (oldValue !== value) {
      if (startValue === oldValue || startValue === undefined) {
        setHasChanged(true)
      } else {
        setOldValue(value)
      }
    }
  }, [value])
  return hasChanged
}

const usePreviousPersistent = (value) => {
  const [
oldValue,
setOldValue
] = useState(null)
  const [
newValue,
setNewValue
] = useState(value)
  useEffect(() => {
    setOldValue(newValue)
    setNewValue(value)
  }, [value])

  return oldValue
}

const useActualPace = () => {
  const activityData = useSelector(state => state.strava.activityData)
  return activityData !== null ? stravaRouteParser.computeWWPaceForActivity(activityData) : null
}

const useActualFinishTime = () => {
  const activityData = useSelector(state => state.strava.activityData)
  return activityData !== null ? stravaRouteParser.computeActualFinishTime(activityData) : null
}

const useActualArrivalTimes = () => {
  const activityData = useSelector(state => state.strava.activityData)
  const activityStream = useSelector(state => state.strava.activityStream)
  const controls = useSelector(state => state.controls.userControlPoints)

  return activityData !== null ? stravaRouteParser.computeControlPointArrivalTimes(activityData, activityStream, controls) : null
}

const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const useFormatSpeed = () => {
  const metric = useSelector(state => state.controls.metric)
  return speed => (metric ?
    `${((speed * milesToMeters) / 1000).toFixed(1)} kph` :
    `${speed.toFixed(1)} mph`);
}

const usePointsAndBounds = () => {
  const rwgpsRouteData = useSelector(state => state.routeInfo.rwgpsRouteData)
  const gpxRouteData = useSelector(state => state.routeInfo.gpxRouteData)

  const routeLoadingMode = useSelector(state => state.uiInfo.routeParams.routeLoadingMode)
  const stravaRouteUsed = useSelector(state => state.strava.route) !== ''
  const stravaActivityStream = useSelector(state => state.strava.activityStream)
  const stravaMode = routeLoadingMode === routeLoadingModes.STRAVA

  let pointsAndBounds

  if (stravaMode) {
    if (stravaActivityStream !== null) {
      pointsAndBounds = useMemo(() => stravaRouteParser.computePointsAndBounds(stravaActivityStream), [stravaActivityStream])
    } else if (stravaRouteUsed) {
      // we import strava routes as gpx
      pointsAndBounds = useMemo(() => gpxParser.computePointsAndBounds(gpxRouteData, "gpx"), [gpxRouteData])
    }
  } else if (rwgpsRouteData !== null) {
    console.log('computing points and bounds for RWGPS case');
    // pointsAndBounds = useMemo(() => gpxParser.computePointsAndBounds(rwgpsRouteData, "rwgps"), [rwgpsRouteData])
    pointsAndBounds = gpxParser.computePointsAndBounds(rwgpsRouteData, "rwgps")
    if (!pointsAndBounds) {
      console.log(`no points and bounds from RWGPS data with ${rwgpsRouteData[rwgpsRouteData.type][track_points].length} points`)
    }
  } else if (gpxRouteData !== null) {
    pointsAndBounds = useMemo(() => gpxParser.computePointsAndBounds(gpxRouteData, "gpx"), [gpxRouteData])
  }
  if (!pointsAndBounds) {
    Sentry.captureMessage(`Empty points and bounds :Strava=${stravaActivityStream === null} Strava route: ${stravaRouteUsed} RWGPS:${rwgpsRouteData === null} GPX:${gpxRouteData === null}`)
  }
  if (pointsAndBounds && pointsAndBounds.pointList && pointsAndBounds.pointList.length > 0) {
    pointsAndBounds.points = useMemo(() => pointsAndBounds.pointList
      .map(point => ({ lat: point.lat, lng: point.lon, dist: point.dist })), [pointsAndBounds.pointList])
    // pointsAndBounds.points = pointsAndBounds.pointList
    // .map(point => ({ lat: point.lat, lng: point.lon, dist: point.dist }))
  }

  return pointsAndBounds
}

const dependencies = [
  'routeInfo',
'routeParams',
'controls',
'timeZoneId',
'forecast'
]
let lastWindResult = {result: null, dependencyValues: {}}
const calculateWindResult = (inputs) => {
  if (dependencies.every(dependency => inputs[dependency] === lastWindResult.dependencyValues[dependency]) ) {
    return lastWindResult.result
  }
  const {routeInfo, routeParams, controls, timeZoneId, forecast, segment} = inputs
  const stateStuff = {routeInfo, uiInfo: {routeParams}, controls}

  let result
  if (forecast.length > 0 && (routeInfo.rwgpsRouteData || routeInfo.gpxRouteData)) {
    const { points, values, finishTime} = getRouteInfo(stateStuff, routeInfo.rwgpsRouteData !== null ? "rwgps" : "gpx", timeZoneId, segment)

    let sortedControls = controls.userControlPoints.slice();
    sortedControls.sort((a,b) => a['distance']-b['distance']);

    let sortedValues = values.slice();
    sortedValues.sort((a,b) => a['distance']-b['distance']);

    const { time, values: calculatedControlPointValues, gustSpeed, finishTime: adjustedFinishTime, adjustedTimes } = gpxParser.adjustForWind(
        forecast,
        points,
        routeParams.pace,
        sortedControls,
        sortedValues,
        DateTime.fromMillis(routeParams.startTimestamp, {zone:routeParams.zone}),
        finishTime,
        timeZoneId
    )
    result = { weatherCorrectionMinutes: time, calculatedControlPointValues: calculatedControlPointValues, maxGustSpeed: gustSpeed, finishTime: adjustedFinishTime, adjustedTimes}
  } else {
    result = { weatherCorrectionMinutes: null, calculatedControlPointValues: [], maxGustSpeed: null, finishTime: null, adjustedTimes:[] }
  }
  lastWindResult = {result, dependencyValues: inputs}
  return result
}

const useForecastDependentValues = () => {
  const routeInfo = useSelector(state => state.routeInfo)
  const routeParams = useSelector(state => state.uiInfo.routeParams)
  const controls = useSelector(state => state.controls)
  const timeZoneId = useSelector(state => state.forecast.timeZoneId)
  const forecast = useSelector(state => state.forecast.forecast)
  const segment = useSelector(state => state.uiInfo.routeParams.segment)

  const windAdjustmentResult = calculateWindResult({routeInfo, routeParams, controls, timeZoneId, forecast, segment})
  return windAdjustmentResult
}

const useWhenChanged = (value, callback, changedCondition = true) => {
  const previousValue = usePrevious(value)
  const valueChanged = previousValue !== undefined && previousValue !== value && value !== null && changedCondition
  useEffect(() => {
      if (valueChanged) {
          return callback()
      }
  }, [value])
}

const useForecastRequestData = () => {
  const rwgpsRouteData = useSelector(state => state.routeInfo.rwgpsRouteData)
  const gpxRouteData = useSelector(state => state.routeInfo.gpxRouteData)
  const type = rwgpsRouteData ? "rwgps" : (gpxRouteData ? "gpx" : null)
  const timeZoneId = useSelector(state => state.uiInfo.routeParams.zone)
  const routeData = useSelector(state => state.routeInfo[type === "rwgps" ? "rwgpsRouteData" : "gpxRouteData"])
  const startTimestamp = useSelector(state => state.uiInfo.routeParams.startTimestamp)
  const pace = useSelector(state => state.uiInfo.routeParams.pace)
  const interval = useSelector(state => state.uiInfo.routeParams.interval)
  const controlPoints = useSelector(state => state.controls.userControlPoints)
  const segment = useSelector(state => state.uiInfo.routeParams.segment)
  const getForecastRequestData = () => {
    if (!type) {
      return { length: 0, daysInFuture:0 }
    }
    const forecastRequest = getForecastRequest(
      routeData,
      startTimestamp,
      type, timeZoneId, pace,
      interval, controlPoints,
      segment)
    return { length: forecastRequest.length, last: forecastRequest[forecastRequest.length - 1].time }
  }
  const forecastData = useMemo(getForecastRequestData, [routeData, interval, startTimestamp])
  const daysInFuture = Interval.fromDateTimes(DateTime.now(), DateTime.fromISO(forecastData.last)).length('days')

  return {length: forecastData.length, daysInFuture:daysInFuture}
}

export { useValueHasChanged, useActualPace, useActualFinishTime, useActualArrivalTimes, 
  usePrevious, useFormatSpeed, usePointsAndBounds, useDelay, useReusableDelay, 
  usePreviousPersistent, useForecastDependentValues, useWhenChanged, useForecastRequestData }