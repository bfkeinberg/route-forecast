import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import stravaRouteParser from "./stravaRouteParser"

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

export { useValueHasChanged, useActualPace, useActualFinishTime, useActualArrivalTimes }