import { useEffect, useRef, useState } from "react"
import { useSelector } from "react-redux"
import stravaRouteParser from "./stravaRouteParser"
import { milesToMeters } from "./util"
import gpxParser from "./gpxParser"
import { routeLoadingModes } from "../data/enums"

const useDelay = (delay, startCondition = true) => {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (startCondition) {
      setTimeout(() => {
        setReady(true)
      }, delay)
    }
  }, [delay, startCondition])
  return ready
}

const useValueHasChanged = (value, startValue) => {
  const [oldValue, setOldValue] = useState(value)
  const [hasChanged, setHasChanged] = useState(false)
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
  return speed => metric ?
    `${((speed * milesToMeters) / 1000).toFixed(1)} kph` :
    `${speed.toFixed(1)} mph`;
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

export { useValueHasChanged, useActualPace, useActualFinishTime, useActualArrivalTimes, usePrevious, useFormatSpeed, usePointsAndBounds, useDelay }