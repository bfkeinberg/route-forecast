import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import stravaRouteParser from "./stravaRouteParser"
import { getRouteInfo, milesToMeters } from "./util"
import gpxParser from "./gpxParser"
import { routeLoadingModes } from "../data/enums"

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

  let pointsAndBounds = { bounds: null, points: null }


  if (stravaMode) {
    if (stravaActivityStream !== null) {
      pointsAndBounds = stravaRouteParser.computePointsAndBounds(stravaActivityStream)
    }
  } else if (rwgpsRouteData !== null) {
    pointsAndBounds = gpxParser.computePointsAndBounds(rwgpsRouteData, "rwgps")
  } else if (gpxRouteData !== null) {
    pointsAndBounds = gpxParser.computePointsAndBounds(gpxRouteData, "gpx")
  }

  if (pointsAndBounds.points !== null) {
    pointsAndBounds.points = pointsAndBounds.points
      .filter(point => point.lat !== undefined && point.lon !== undefined)
      .map(point => ({ lat: point.lat, lng: point.lon, dist: point.dist }))
  }

  return pointsAndBounds
}

const useForecastDependentValues = () => {

  const routeInfo = useSelector(state => state.routeInfo)
  const routeParams = useSelector(state => state.uiInfo.routeParams)
  const controls = useSelector(state => state.controls)
  const timeZoneId = useSelector(state => state.forecast.timeZoneId)
  const forecast = useSelector(state => state.forecast.forecast)

  const stateStuff = {routeInfo, uiInfo: {routeParams}, controls}

  if (forecast.length > 0) {
    const { points, values, finishTime} = getRouteInfo(stateStuff, routeInfo.rwgpsRouteData !== null ? "rwgps" : "gpx", timeZoneId)

    const { time, values: calculatedControlPointValues, gustSpeed, finishTime: adjustedFinishTime } = gpxParser.adjustForWind(
        forecast,
        points,
        routeParams.pace,
        controls.userControlPoints,
        values,
        routeParams.start,
        controls.metric,
        finishTime,
        timeZoneId
    )
    return { weatherCorrectionMinutes: time, calculatedControlPointValues: calculatedControlPointValues, maxGustSpeed: gustSpeed, finishTime: adjustedFinishTime}
  } else {
    return { weatherCorrectionMinutes: null, calculatedControlPointValues: [], maxGustSpeed: null, finishTime: null }
  }
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