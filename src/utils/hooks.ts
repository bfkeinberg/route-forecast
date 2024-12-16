import * as Sentry from "@sentry/react";
import { DateTime, Interval } from 'luxon';
import { useEffect, useMemo, useRef, useState } from "react"
import { useDispatch, useSelector, useStore } from "react-redux"
import type { AppDispatch, RootState } from '../jsx/app/topLevel'

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()

import { routeLoadingModes } from "../data/enums"
import gpxParser from "./gpxParser"
import stravaRouteParser from "./stravaRouteParser"
import { getRouteInfo, getForecastRequest, milesToMeters } from "./util"
import type {ControlsState} from '../redux/controlsSlice'
import type { RouteInfoState } from "../redux/routeInfoSlice";
import type { WindAdjustResults, Point } from "./gpxParser";
import type {Bounds} from './util'

const useDelay = (delay: number, startCondition = true) => {
  const [
    ready,
    setReady
  ] = useState(false)
  useEffect(() => {
    if (startCondition) {
      setTimeout(() => {
        Sentry.addBreadcrumb({category:"No stack", level:"info", message:"useDelay"})
        setReady(true)
      }, delay)
    }
  }, [
    delay,
    startCondition
  ])
  return ready
}

const useReusableDelay = <Type>(delay: number, startCondition = true) => {
  const [
    ready,
    setReady
  ] = useState(false)
  const [
    restartedAt,
    setRestartedAt
  ] = useState<number|null>(null)
  const timeout = useRef<NodeJS.Timeout|null>(null)

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
        Sentry.addBreadcrumb({ category: "No stack", level: "info", message: "useReusableDelay" })
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

const useValueHasChanged = <Type>(value: Type, startValue?: Type) => {
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

const usePreviousPersistent = <Type>(value: Type) => {
  const [
    oldValue,
    setOldValue
  ] = useState<Type | null>(null)
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
  const activityData = useAppSelector(state => state.strava.activityData)
  return activityData !== null ? stravaRouteParser.computeWWPaceForActivity(activityData) : null
}

const useActualFinishTime = () => {
  const activityData = useAppSelector(state => state.strava.activityData)
  return activityData !== null ? stravaRouteParser.computeActualFinishTime(activityData) : null
}

const useActualArrivalTimes = () => {
  const activityData = useAppSelector(state => state.strava.activityData)
  const activityStream = useAppSelector(state => state.strava.activityStream)
  const controls = useAppSelector(state => state.controls.userControlPoints)

  return activityData !== null && activityStream !== null ? 
  stravaRouteParser.computeControlPointArrivalTimes(activityData, activityStream, controls) : null
}

const usePrevious = <Type>(value : Type) => {
  const ref = useRef<Type>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const useFormatSpeed = () => {
  const metric = useAppSelector(state => state.controls.metric)
  return (speed : number) => (metric ?
    `${((speed * milesToMeters) / 1000).toFixed(1)} kph` :
    `${speed.toFixed(1)} mph`);
}

export type MapPoint = {lat:number, lng:number, dist?:number}
export type MapPointList = Array<MapPoint>

export type PointsAndBounds = {
  points?: MapPointList
  pointList: Array<Point>
  bounds: Bounds
}
const usePointsAndBounds = () : PointsAndBounds => {
  const rwgpsRouteData = useAppSelector(state => state.routeInfo.rwgpsRouteData)
  const gpxRouteData = useAppSelector(state => state.routeInfo.gpxRouteData)

  const routeLoadingMode = useAppSelector(state => state.uiInfo.routeParams.routeLoadingMode)
  const stravaRouteUsed = useAppSelector(state => state.strava.route) !== ''
  const stravaActivityStream = useAppSelector(state => state.strava.activityStream)
  const stravaMode = routeLoadingMode === routeLoadingModes.STRAVA

  let pointsAndBounds : PointsAndBounds = {pointList:[], bounds:{min_latitude: 90, min_longitude: 180, max_latitude: -90, max_longitude: -180}}

  if (stravaMode) {
    if (stravaActivityStream !== null) {
      pointsAndBounds = useMemo(() => stravaRouteParser.computePointsAndBounds(stravaActivityStream), [stravaActivityStream])
    } else if (stravaRouteUsed && gpxRouteData) {
      // we import strava routes as gpx - so we expect the second half of the above condition to 
      // always be true
      pointsAndBounds = useMemo(() => gpxParser.computePointsAndBounds(
        gpxParser.parseGpxRouteStream(gpxRouteData)), [gpxRouteData])
    }
  } else if (rwgpsRouteData !== null) {
    pointsAndBounds = useMemo(() => gpxParser.computePointsAndBounds(gpxParser.parseRwgpsRouteStream(rwgpsRouteData)), [rwgpsRouteData])
    // pointsAndBounds = gpxParser.computePointsAndBounds(gpxParser.parseRwgpsRouteStream(rwgpsRouteData))
    if (!pointsAndBounds) {
      console.log(`no points and bounds from RWGPS data with ${rwgpsRouteData[rwgpsRouteData.type].track_points.length} points`)
    }
  } else if (gpxRouteData !== null) {
    pointsAndBounds = useMemo(() => gpxParser.computePointsAndBounds(gpxParser.parseGpxRouteStream(gpxRouteData)), [gpxRouteData])
  }
  if (pointsAndBounds.pointList.length === 0) {
    Sentry.captureMessage(
      `Empty points and bounds :Strava activity empty=${stravaActivityStream === null} Strava route empty: ${stravaRouteUsed} RWGPS empty:${rwgpsRouteData === null} GPX empty:${gpxRouteData === null}`)
  }
  if (pointsAndBounds.pointList.length > 0) {
    pointsAndBounds.points = useMemo(() => pointsAndBounds.pointList
      .map(point => ({ lat: point.lat, lng: point.lon, dist: point.dist })), [pointsAndBounds.pointList])
  }

  return pointsAndBounds
}


///
//  routeInfo, routeParams, controls, timeZoneId, forecast, segment
const dependencies = [
  'routeInfo',
  'routeParams',
  'controls',
  'timeZoneId',
  'forecast'
]
interface WindResultInputs {
  controls: ControlsState
  routeInfo: RouteInfoState
  [index:string]:any
}
type WalkRouteResult = {
    forecastRequest:[],
    points:[],
    values:[],
    finishTime:String,
    timeInHours:number
}
type CachedWindResult = {
  result : WindAdjustResults
  dependencyValues: WindResultInputs | {[index:string]:any}
}

let lastWindResult : CachedWindResult = {result: {weatherCorrectionMinutes:0, calculatedControlPointValues:[],
   maxGustSpeed:0, finishTime:"", adjustedTimes:[]}, dependencyValues: {}}
const calculateWindResult = (inputs : WindResultInputs) : WindAdjustResults => {
  if (dependencies.every(dependency => inputs[dependency] === lastWindResult.dependencyValues[dependency]) ) {
    return lastWindResult.result
  }
  const {routeInfo, routeParams, controls, timeZoneId, forecast, segment} = inputs
  const stateStuff = {routeInfo, uiInfo: {routeParams}, controls}

  let result
  if (forecast.length > 0 && (routeInfo?.rwgpsRouteData || routeInfo?.gpxRouteData)) {
    const { points, values, finishTime} = getRouteInfo(stateStuff, timeZoneId, segment)

    let sortedControls = controls.userControlPoints.slice();
    sortedControls?.sort((a,b) => a['distance']-b['distance']);

    let sortedValues = values.slice();
    sortedValues.sort((a,b) => a['distance']-b['distance']);

    const { weatherCorrectionMinutes, calculatedControlPointValues, maxGustSpeed, finishTime: adjustedFinishTime, adjustedTimes } = gpxParser.adjustForWind(
        forecast,
        points,
        routeParams.pace,
        sortedControls,
        sortedValues,
        DateTime.fromMillis(routeParams.startTimestamp, {zone:routeParams.zone}),
        finishTime,
        timeZoneId
    )
    result = { weatherCorrectionMinutes: weatherCorrectionMinutes, calculatedControlPointValues: calculatedControlPointValues, maxGustSpeed: maxGustSpeed, finishTime: adjustedFinishTime, adjustedTimes}
  } else {
    result = { weatherCorrectionMinutes: 0, calculatedControlPointValues: [], maxGustSpeed: 0, finishTime: null, adjustedTimes:[] }
  }
  lastWindResult = {result, dependencyValues: inputs}
  return result
}

const useForecastDependentValues = () => {
  const routeInfo = useAppSelector(state => state.routeInfo)
  const routeParams = useAppSelector(state => state.uiInfo.routeParams)
  const controls = useAppSelector(state => state.controls)
  const timeZoneId = useAppSelector(state => state.forecast.timeZoneId)
  const forecast = useAppSelector(state => state.forecast.forecast)
  const segment = useAppSelector(state => state.uiInfo.routeParams.segment)

  const windAdjustmentResult = calculateWindResult({routeInfo, routeParams, controls, timeZoneId, forecast, segment})
  return windAdjustmentResult
}

const useWhenChanged = <Type>(value : Type, callback : () => void, changedCondition = true) => {
  const previousValue = usePrevious(value)
  const valueChanged = previousValue !== undefined && previousValue !== value && value !== null && changedCondition
  useEffect(() => {
    if (valueChanged) {
      return callback()
    }
  }, [value])
}

const useForecastRequestData = () => {
  const rwgpsRouteData = useAppSelector(state => state.routeInfo.rwgpsRouteData)
  const gpxRouteData = useAppSelector(state => state.routeInfo.gpxRouteData)
  const type = rwgpsRouteData ? "rwgps" : (gpxRouteData ? "gpx" : null)
  const timeZoneId = useAppSelector(state => state.uiInfo.routeParams.zone)
  const routeData = useAppSelector(state => state.routeInfo[type === "rwgps" ? "rwgpsRouteData" : "gpxRouteData"])
  const startTimestamp = useAppSelector(state => state.uiInfo.routeParams.startTimestamp)
  const pace = useAppSelector(state => state.uiInfo.routeParams.pace)
  const interval = useAppSelector(state => state.uiInfo.routeParams.interval)
  const controlPoints = useAppSelector(state => state.controls.userControlPoints)
  const segment = useAppSelector(state => state.uiInfo.routeParams.segment)
  const getForecastRequestData = () => {
    if (!type || !routeData) {
      Sentry.captureMessage(`useForecastRequestData() called before route loaded : ${!!rwgpsRouteData} ${!!gpxRouteData}`)
        const replay = Sentry.getReplay();
        if (replay) {
            replay.stop();
        }
      return { length: 0, daysInFuture:0, last:DateTime.now().toString() }
    }
    const forecastRequest = getForecastRequest(
      routeData,
      startTimestamp,
      timeZoneId, pace,
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