import {APIProvider, Map, InfoWindow, useMap, useApiIsLoaded, CollisionBehavior} from '@vis.gl/react-google-maps';
import * as Sentry from "@sentry/react"
import sandwich from 'Images/sandwich.png'
import rainCloud from "Images/lightning-and-blue-rain-cloud-16533.svg"
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import 'Images/style.css';
import { DateTime } from 'luxon';
import { routeLoadingModes } from '../../data/enums';
import { MapPoint, MapPointList, useForecastDependentValues, usePointsAndBounds } from '../../utils/hooks';
import { Bounds, milesToMeters } from '../../utils/util';
import { formatTemperature } from "../resultsTables/ForecastTable";
import { Polyline } from './polyline';
import {useTranslation} from 'react-i18next'
import { Forecast, mapViewedSet } from '../../redux/forecastSlice';
import { CalculatedValue } from 'utils/gpxParser';
import { useAppSelector, useAppDispatch } from '../../utils/hooks';
import SafeAdvancedMarker from './SafeMarker';

const curvedArrowPath = "m-68.4149 61.4815c-.5904 2.8312 1.5113 7.0934 7.6748 12.4358 19.1536 16.6019 60.8005 28.3549 91.4489-7.6894 30.0099-35.2935 21.5071-80.7594 21.1555-98.2548l14.7087-.0371-32.3276-55.688-32.0602 55.8545 16.4983-.0557c2.8274 19.3736 6.2889 57.8645-6.5882 79.4056-17.0631 28.5432-39.6439 26.2329-52.4747 19.0262-13.994-7.8596-26.7357-11.2308-28.0345-5.0021z"
const findMarkerInfo = (forecast : Array<Forecast>, subrange : [number,number] | []) => {
    if (!forecast || !forecast.length || !subrange || subrange.length !== 2) {
        return [];
    }
    return forecast.filter((point) => point &&
        typeof point.distance === 'number' && 
        Math.round(point.distance * milesToMeters) >= subrange[0] && 
        Math.round(point.distance * milesToMeters) <= subrange[1]);
}

const matchesSegment = (point : MapPoint, range : Array<number>) => {
    return ((point.dist===undefined) ||
    (point.dist >= range[0] && point.dist <= range[1]))
}

type calculatedBounds = { min_latitude: number, min_longitude: number, max_latitude: number, max_longitude: number };
const getMapBounds = (points : MapPointList, bounds : Bounds, zoomToRange : boolean, subrange  : [number,number] | [], userSubrange : [number,number]) => {
    const defaultBounds = {north:bounds.max_latitude, south:bounds.min_latitude, east:bounds.max_longitude, west:bounds.min_longitude}
    const preferDefault = userSubrange[0] === userSubrange[1]
    if (preferDefault && subrange.length !== 2) {
        return defaultBounds
    }
    let userBounds = new google.maps.LatLngBounds();
    points.filter(point => matchesSegment(point,userSubrange))
        .forEach(point => userBounds.extend(point));
    if (zoomToRange && subrange.length === 2) {
        let segmentBounds = new google.maps.LatLngBounds();
        points.filter(point => matchesSegment(point, subrange))
            .forEach(point => segmentBounds.extend(point));
        if (segmentBounds.isEmpty()) {
            return preferDefault ? defaultBounds : userBounds;
        }
        return segmentBounds;
    }
    return preferDefault ? defaultBounds : userBounds;
}

const cvtDistance = (distanceStr : string, metric : boolean) => {
    const distance = Number.parseInt(distanceStr)
    return (metric ? ((distance * milesToMeters) / 1000).toFixed(0) : distanceStr);
};

const findMapBounds = (points : MapPointList, bounds : Bounds, zoomToRange : boolean, subrange : [number,number] | [], userSubrange : [number,number]) => {
    const mapBounds = getMapBounds(points, bounds, zoomToRange, subrange, userSubrange)
    return mapBounds
}

const RouteForecastMap = ({maps_api_key} : {maps_api_key: string}) => {
    const userControlPoints = useAppSelector(state => state.controls.userControlPoints)
    const forecast = useAppSelector(state => state.forecast.forecast)
    const doingAnalysis = useAppSelector(state=>state.strava.activityData) !== null
    let subrange = useAppSelector(state => state.strava.activityData !== null ? state.strava.subrange : state.forecast.range)
    if (subrange.length == 2 && isNaN(subrange[1])) {
        subrange = []
    }
    const routeLoadingMode = useAppSelector(state => state.uiInfo.routeParams.routeLoadingMode)
    const metric = useAppSelector(state => state.controls.metric)
    const celsius = useAppSelector(state => state.controls.celsius)
    const zoomToRange = useAppSelector(state => state.forecast.zoomToRange)
    const { t } = useTranslation()
    const userSegment = useAppSelector(state => state.uiInfo.routeParams.segment)
    const [isMapApiReady, setIsMapApiReady] = useState(false)

    const { calculatedControlPointValues: controls } = useForecastDependentValues()

    const dispatch = useAppDispatch()
    useEffect(() => { dispatch(mapViewedSet()) }, [])
    
    const handleApiLoad = () => {
        setIsMapApiReady(true)
    }

    const handleApiError = (error: unknown) => {
        Sentry.captureException(error, {tags: {where:'Google Maps API Load Error'}})
        setIsMapApiReady(false)
    }
        
    const BoundSetter = ({points} : {points: MapPointList}) => {
        const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds|google.maps.LatLngBoundsLiteral|null>(null)
        const apiIsLoaded = useApiIsLoaded()
        const map = useMap()
        useEffect(() => {
            if (!apiIsLoaded) return;
            try {
                const theBounds = findMapBounds(points, bounds, zoomToRange, subrange, userSegment)
                setMapBounds(theBounds)    
            } catch (error) {
                console.error("Error setting map bounds:", error)
                Sentry.captureException(error, {tags: {where:'Error setting map bounds'}})
            }
            // when the maps library is loaded, apiIsLoaded will be true and the API can be
            // accessed using the global `google.maps` namespace.
        }, [apiIsLoaded, zoomToRange, subrange, userSegment[0], userSegment[1]])
        useEffect(() => {
            if (!map || !mapBounds) {
                return;
            }
            let isValidAndNotEmpty = false;
            if ('north' in mapBounds && 'south' in mapBounds && 'east' in mapBounds && 'west' in mapBounds) {
                isValidAndNotEmpty = true;
            } else if (typeof (mapBounds as google.maps.LatLngBounds).isEmpty === 'function') {
                if (!(mapBounds as google.maps.LatLngBounds).isEmpty()) {
                    isValidAndNotEmpty = true;
                }
            }                        
            if (isValidAndNotEmpty) {
                map.fitBounds(mapBounds, 0)
                const zoom = map.getZoom()
                if (typeof zoom === 'number' && zoom > 0) {
                    map.setZoom(zoom - 1);
                }                
            }
        }, [map, mapBounds])
        return <div/>
    }
    
    const controlNames = userControlPoints.map(control => control.name)

    let markedInfo = findMarkerInfo(forecast, subrange);

    const { points, bounds } = usePointsAndBounds()
    if (!points || points === undefined) {
        return (<h2>No map points to display</h2>)
    }
    let infoVisible = false;
    if (!doingAnalysis && markedInfo.length > 0) {
        infoVisible = true;
    }

    const getInfoWindow  = (markedInfo : Forecast[]) => {
        if (!markedInfo || !markedInfo.length || !markedInfo[0]) {
            return null;
        }
        
        const point = markedInfo[0];
        if (!point.temp || !point.windSpeed || !point.windBearing || 
            !point.lat || !point.lon) {
            return null;
        }
                
        const infoContents = (<span>
            {t('data.info.temperature')} &nbsp;
            <strong>{formatTemperature(point.temp, celsius)}</strong> &nbsp;
            {t('data.wind.speed')} &nbsp;
            <strong>{cvtDistance(point.windSpeed, metric)}</strong> &nbsp;
            {t('tableHeaders.windBearing')} &nbsp;
            <strong>{point.windBearing}</strong>
        </span>)
        const infoWindow = (<InfoWindow disableAutoPan headerDisabled position={{ lat: point.lat, lng: point.lon }}>{infoContents}</InfoWindow>)
        return infoWindow
    }

    const initialBounds = {north:37.34544, south:37.30822, east:-121.98912, west:-122.06169}
    try {
        return (
            <Sentry.ErrorBoundary fallback=<h2>Cannot render map</h2>>
                <div id="map" style={{ width:'auto', height: "calc(100vh - 115px)", position: "relative" }}>
                    {(Array.isArray(forecast) && forecast.length > 0 || routeLoadingMode === routeLoadingModes.STRAVA) && bounds !== null ?
                        <APIProvider apiKey={maps_api_key} onLoad={handleApiLoad} onError={handleApiError}>
                            {isMapApiReady ? (
                                <>
                                    <BoundSetter points={points} />
                                    <Map
                                        mapTypeId={'roadmap'}
                                        mapId={"11147ffcb9b103dc"}
                                        scaleControl={true}
                                        defaultBounds={initialBounds}
                                    >
                                        {controls !== null && <MapMarkers forecast={forecast}
                                            controls={controls} controlNames={controlNames}
                                            subrange={subrange} metric={metric}
                                        />}
                                        <Polyline path={points} strokeWeight={3} strokeColor={'#3244a8'} strokeOpacity={1.0} />
                                        {infoVisible && getInfoWindow(markedInfo)}
                                        <MapHighlight points={points} subrange={subrange} />
                                    </Map>
                                </>
                            ) : (
                                <div>Initializing map...</div>
                            )}
                        </APIProvider> :
                        <h2 style={{ padding: '18px', textAlign: "center" }}>{t('titles.map')}</h2>
                    }
                </div>
            </Sentry.ErrorBoundary>
        )
    } catch (err : any) {
        Sentry.captureException(err, {tags: {where:'Error rendering Google Map'}})
        return (<div>No map due to error</div>)
    }
}

interface MapMarkerProps {
    forecast: Array<Forecast>
    controls : Array<CalculatedValue>
    metric: boolean
    controlNames: string[]
    subrange: [number, number] | []
}
const MapMarkers = ({ forecast, controls, controlNames, subrange, metric} : MapMarkerProps) => {
    const { i18n } = useTranslation()
    const celsius = useAppSelector(state => state.controls.celsius)

    const validForecastPoints = forecast.filter(point => 
        point && 
        typeof point.lat === 'number' && 
        typeof point.lon === 'number' &&
        point.time &&
        point.zone &&
        point.temp &&
        point.windBearing !== undefined &&
        point.relBearing !== undefined &&
        point.windSpeed
    );

    const validControls = Array.isArray(controls) ? controls.filter(control => 
        control && 
        typeof control.lat === 'number' && 
        typeof control.lon === 'number'
    ) : [];

    // Filter rainy forecast points
    const validRainPoints = Array.isArray(forecast) ? forecast.filter(point => 
        point && 
        typeof point.lat === 'number' && 
        typeof point.lon === 'number' &&
        typeof point.distance === 'number' &&
        point.time !== undefined &&
        point.zone !== undefined &&
        point.temp !== undefined &&
        point.rainy !== undefined
    ) : [];

    // marker title now contains both temperature and mileage
    return (validForecastPoints.map((point) =>
                <TempMarker latitude={point.lat}
                    longitude={point.lon}
                    value={cvtDistance(point.distance.toString(), metric)}
                    title={`${DateTime.fromISO(point.time, {zone:point.zone, locale:i18n.language}).toFormat('EEE MMM d h:mma yyyy')}\n${formatTemperature(point.temp, celsius)}`}
                    bearing={point.windBearing}
                    relBearing={point.relBearing}
                    windSpeed={point.windSpeed}
                    key={`${point.lat}${point.lon}_${cvtDistance(point.distance.toString(), metric)}_temp_${Math.random().toString(10)}`}
                />
            )
        ).concat(
            validControls
                .map((control, index) =>
                    <ControlMarker
                        latitude={control.lat}
                        longitude={control.lon}
                        value={index < controlNames.length ? controlNames[index] : ''}
                        key={`${control.lat}${control.lon}_${index < controlNames.length ? controlNames[index] : ''}${index}_control_${Math.random().toString(10)}`}
                    />
                )
        ).concat(
            validRainPoints.map((point) =>
                <RainIcon
                    latitude={point.lat}
                    longitude={point.lon}
                    value={parseInt(cvtDistance(point.distance.toString(), metric))}
                    title={`${DateTime.fromISO(point.time, {zone:point.zone, locale:i18n.language}).toFormat('EEE MMM d h:mma yyyy')}\n${formatTemperature(point.temp, celsius)}`}
                    isRainy={point.rainy}
                    key={`${point.lat}${point.lon}_${cvtDistance(point.distance.toString(), metric)}_rain_${Math.random().toString(10)}`}
                />
            )
        )
}

const RainIcon = ({ latitude, longitude, value, title, isRainy } : {latitude: number, longitude: number, value: number, title: string, isRainy: boolean}) => {
    const apiIsLoaded = useApiIsLoaded();
    if (!apiIsLoaded) {
      return null;
    }
    if (isRainy) {
        return <SafeAdvancedMarker position={{ lat: latitude, lng: longitude }} /* label={value.toFixed(0)} */ title={title}>
            <img style={{position:'relative',margin:'2px'}} src={rainCloud} width={45} height={50} />
        </SafeAdvancedMarker>
    }
    return null;
}

const pickArrowColor = (relBearing : number, windSpeed : number) => {
    if (relBearing <90) {
        if (Math.cos((Math.PI / 180) * relBearing) * windSpeed >= 10) {
            return '#e60a0a'
        } else {
            return '#ff9900'
        }
    } else {
        return '#2a57df '
    }
}

const viewbox_0 = "-93 -93 380 235"
const viewbox_90 = "-93 -93 380 299"
const viewbox_180 = "-93 -93 380 235"
const viewbox_270 = "-93 -93 380 235"

const pickViewbox = (rotation : number) => {
    if (rotation < 90) return viewbox_0
    if (rotation < 180) return viewbox_90
    if (rotation < 270) return viewbox_180
    return viewbox_270
}

const pickWidth = (rotation : number) => {
    if (rotation < 90) return 93
    if (rotation < 180) return 93
    if (rotation < 270) return 93
    return 93
}

const pickHeight = (rotation : number) => {
    if (rotation < 90) return 45
    if (rotation < 180) return 93
    if (rotation < 270) return 45
    return 40
}

type ArrowProps = {
    rotation: number
    relBearing: number
    windSpeed: number
    distance: string
}
export const RotatedArrow = ({rotation, relBearing, windSpeed, distance} : ArrowProps) => {
    const gradientId = `gradualFill-${distance}`
    return (
        <svg viewBox={pickViewbox(rotation)}
            preserveAspectRatio='xMaxYMax meet'
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            width={pickWidth(rotation)}
            height={pickHeight(rotation)}
            x="-93"
            y="-93"
        >
            <defs>
                <linearGradient id={gradientId} >
                    <stop offset="0" stopColor={pickArrowColor(relBearing, windSpeed)}>
                        <animate dur="1s" attributeName='offset' from="0" to="1" begin="1s" fill="freeze" repeatCount="4" />
                    </stop>
                    <stop offset='0' stopColor='#ffffff'>
                        <animate dur="1s" attributeName='offset' from="0" to="1" begin="1s" fill="freeze" repeatCount="4" />
                    </stop>
                </linearGradient>
            </defs>
            <path
                stroke='gray'
                strokeLinecap="round"
                strokeOpacity={'40%'}
                d={curvedArrowPath}
                fill={`url(#${gradientId}`}
                transform={`rotate(${rotation}, 0, 0)`}
            />
        </svg>
    )
}

type TempMarkerProps = {
    latitude: number
    longitude: number
    value: string
    title: string
    bearing: number
    relBearing: number
    windSpeed: string
}
const TempMarker = ({ latitude, longitude, value, title, bearing, relBearing, windSpeed } : TempMarkerProps ) => {
    const apiIsLoaded = useApiIsLoaded();
    if (!apiIsLoaded) {
      return null;
    }
    // Add the marker at the specified location
    if (parseInt(windSpeed) > 3) {
        const flippedBearing = (bearing > 180) ? bearing - 180 : bearing + 180;
        return <SafeAdvancedMarker
            position={{ lat: latitude, lng: longitude }}
            title={title}
            collisionBehavior={CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY}
        >
            <>
            <RotatedArrow rotation={flippedBearing} relBearing={relBearing} windSpeed={parseInt(windSpeed)} distance={value}/>
            <div style={{
                    width: 30,
                    height: 30,
                    position: 'relative',
                    top: -2,
                    left: 0,
                    background: '#1ee3dc',
                    border: '2px solid #0e6443',
                    borderRadius: '40%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>{value}</div>
            </>
        </SafeAdvancedMarker>
    }
    else {
        return <SafeAdvancedMarker position={{ lat: latitude, lng: longitude }} 
            title={title} collisionBehavior={CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY}>
            <div style={{
                width: 30,
                height: 30,
                position: 'relative',
                top: -2,
                left: 0,
                background: '#1ee3dc',
                border: '2px solid #0e6443',
                borderRadius: '40%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>{value}</div>
        </SafeAdvancedMarker>
    }
}

const ShowControlName = (latitude : number, longitude : number, name : string, closeFunc : React.Dispatch<React.SetStateAction<boolean>>) => {
    return (<InfoWindow  shouldFocus={true} headerDisabled pixelOffset={[-30 ,-30]} 
        onClose={() => {closeFunc(false)}} maxWidth={320}
        position={{ lat: latitude, lng: longitude }}>{name}</InfoWindow>)    
}
interface ControlMarkerProps {
    latitude: number
    longitude: number
    value: string
}
const ControlMarker = ({ latitude, longitude, value = '' } : ControlMarkerProps) => {
    const apiIsLoaded = useApiIsLoaded();
    if (!apiIsLoaded) {
      return null;
    }
    const [showTheText, setShowTheText] = React.useState<boolean>(false)
    if (!latitude || !longitude) {
        return <div/>
    }
    return <SafeAdvancedMarker position={{ lat: latitude, lng: longitude }} 
        zIndex={5} collisionBehavior={CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL}
        onMouseEnter={(event : google.maps.MapMouseEvent['domEvent']) => {setShowTheText(true)}}
        onMouseLeave={(event  : google.maps.MapMouseEvent['domEvent']) => {setShowTheText(false)}}
        onClick={(event : google.maps.MapMouseEvent )=> setShowTheText(false)}
        >
        <img src={sandwich} style={{backgroundColor: 'transparent'}}/>
        {showTheText && ShowControlName(latitude, longitude, value, setShowTheText)}
    </SafeAdvancedMarker>;
}

const MapHighlight = ({ points, subrange } : { points: MapPointList, subrange: [number,number]|[]}) => {
    if (subrange.length !== 2) {
        return null;
    }
    const highlightPoints = points.filter(point => point.dist && point.dist >= subrange[0] &&
        (isNaN(subrange[1]) || point.dist <= subrange[1]));
    return <Polyline path={highlightPoints} strokeColor='#ff9900' //'#67ff99',
        strokeOpacity={1.0} strokeWeight={5}
    />;
}

MapHighlight.propTypes = {
    points: PropTypes.array.isRequired,
    subrange: PropTypes.arrayOf(PropTypes.number)
}

export default React.memo(RouteForecastMap)