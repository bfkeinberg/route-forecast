import * as Sentry from "@sentry/react";
import { DateTime } from 'luxon';
import { useEffect, useMemo,useRef, useState } from "react"
import { useSelector } from "react-redux"

import { routeLoadingModes } from "../data/enums"
import gpxParser from "./gpxParser"
import stravaRouteParser from "./stravaRouteParser"
import { getRouteInfo, milesToMeters } from "./util"
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
  const stravaActivityStream = useSelector(state => state.strava.activityStream)
  const stravaMode = routeLoadingMode === routeLoadingModes.STRAVA

  let pointsAndBounds

  if (stravaMode) {
    if (stravaActivityStream !== null) {
      pointsAndBounds = useMemo(() => stravaRouteParser.computePointsAndBounds(stravaActivityStream), [stravaActivityStream])
    }
  } else if (rwgpsRouteData !== null) {
    pointsAndBounds = useMemo(() => gpxParser.computePointsAndBounds(rwgpsRouteData, "rwgps"), [rwgpsRouteData])
  } else if (gpxRouteData !== null) {
    pointsAndBounds = useMemo(() => gpxParser.computePointsAndBounds(gpxRouteData, "gpx"), [gpxRouteData])
  }
  if (pointsAndBounds && pointsAndBounds.pointList && pointsAndBounds.pointList.length > 0) {
    pointsAndBounds.points = useMemo(() => pointsAndBounds.pointList
      .map(point => ({ lat: point.lat, lng: point.lon, dist: point.dist })), [pointsAndBounds.pointList])
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
  const {routeInfo, routeParams, controls, timeZoneId, forecast} = inputs
  const stateStuff = {routeInfo, uiInfo: {routeParams}, controls}

  let result
  if (forecast.length > 0 && (routeInfo.rwgpsRouteData || routeInfo.gpxRouteData)) {
    const { points, values, finishTime} = getRouteInfo(stateStuff, routeInfo.rwgpsRouteData !== null ? "rwgps" : "gpx", timeZoneId)

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
  return Sentry.startSpan({ name: "forecastCalculations" },
    () => {
      const routeInfo = useSelector(state => state.routeInfo)
      const routeParams = useSelector(state => state.uiInfo.routeParams)
      const controls = useSelector(state => state.controls)
      const timeZoneId = useSelector(state => state.forecast.timeZoneId)
      const forecast = useSelector(state => state.forecast.forecast)

      const windAdjustmentResult = calculateWindResult({ routeInfo, routeParams, controls, timeZoneId, forecast })
      return windAdjustmentResult
    })
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

export { useValueHasChanged, useActualPace, useActualFinishTime, useActualArrivalTimes, usePrevious, useFormatSpeed, usePointsAndBounds, useDelay, useReusableDelay, usePreviousPersistent, useForecastDependentValues, useWhenChanged }