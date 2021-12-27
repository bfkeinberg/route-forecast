import { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import stravaRouteParser from "./stravaRouteParser"
import { formatControlsForUrl, milesToMeters } from "./util"
import { recalcRoute, saveCookie } from "../redux/actions"

const useValueHasChanged = (value) => {
  const [initialValue] = useState(value)
  const [hasChanged, setHasChanged] = useState(false)
  useEffect(() => { if (initialValue !== value) setHasChanged(true) }, [value])
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

const useRecalcRoute = () => {
  const start = useSelector(state => state.uiInfo.routeParams.start)
  const pace = useSelector(state => state.uiInfo.routeParams.pace)
  const interval = useSelector(state => state.uiInfo.routeParams.interval)
  const metric = useSelector(state => state.controls.metric)
  const controls = useSelector(state => state.controls.userControlPoints)
  const rwgpsRoute = useSelector(state => state.uiInfo.routeParams.rwgpsRoute)
  const gpxRouteData = useSelector(state => state.routeInfo.gpxRouteData)

  const dispatch = useDispatch()
  if (!(rwgpsRoute === '' && gpxRouteData === null) && start !== null) {
    dispatch(recalcRoute)
  }
}

const useSaveControlsToCookie = () => {

  const controlPoints = useSelector(state => state.controls.userControlPoints)
  const routeInfo = useSelector(state => state.routeInfo)
  const firstUse = useSelector(state => state.params.newUserMode)

  useEffect(() => {
    if (routeInfo.name !== '') {
      document.title = `Forecast for ${routeInfo.name}`;
      if (!firstUse && controlPoints !== '' && controlPoints.length !== 0) {
        saveCookie(routeInfo.name, formatControlsForUrl(controlPoints));
      }
    }
  }, [routeInfo.name, firstUse, controlPoints])
}


export { useValueHasChanged, useActualPace, useActualFinishTime, useActualArrivalTimes, usePrevious, useFormatSpeed, useRecalcRoute, useSaveControlsToCookie }