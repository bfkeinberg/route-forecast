import {APIProvider, Map, InfoWindow, useMap, AdvancedMarker, useApiIsLoaded} from '@vis.gl/react-google-maps';
import * as Sentry from "@sentry/react"
import circus_tent from 'Images/circus tent.png';
import rainCloud from "Images/rainCloud.png";
import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import 'Images/style.css';

import { routeLoadingModes } from '../../data/enums';
import { mapViewedSet } from '../../redux/reducer';
import { useForecastDependentValues, usePointsAndBounds } from '../../utils/hooks';
import { milesToMeters } from '../../utils/util';
import { formatTemperature } from "../resultsTables/ForecastTable";
import ErrorBoundary from "../shared/ErrorBoundary"
import { Polyline } from './polyline';
import {useTranslation} from 'react-i18next'

const arrowPath = "m-.232.134c-1.104 0-2-.224-2-.5v-31.634c0-.276.896-.5 2-.5s2 .224 2 .5v31.634C1.768-.09.876.134-.232.134m12.651-20.5c-.128 0-.256-.049-.354-.146l-12.179-12.183-12.184 12.183c-.195.195-.512.195-.707 0s-.195-.512 0-.707l12.538-12.537c.093-.093.22-.146.353-.146l0 0c.133 0 .26.053.354.146l12.533 12.536c.195.195.195.512 0 .707-.098.098-.226.147-.354.147z"

const findMarkerInfo = (forecast, subrange) => {
    if (!subrange || subrange.length !== 2) {
        return [];
    }
    return forecast.filter((point) => Math.round(point.distance * milesToMeters) >= subrange[0] && Math.round(point.distance * milesToMeters) <= subrange[1]);
}

const getMapBounds = (points, zoomToRange, subrange, userSubrange) => {
    let userBounds = new google.maps.LatLngBounds();
    points.filter(point => (point.dist !== undefined) && (point.dist >= userSubrange[0] &&
        (isNaN(userSubrange[1]) || point.dist <= userSubrange[1])))
        .forEach(point => userBounds.extend(point));
    if (zoomToRange && subrange.length === 2 && !isNaN(subrange[1])) {
        let segmentBounds = new google.maps.LatLngBounds();
        points.filter(point => (point.dist !== undefined) && (point.dist >= subrange[0] &&
            (isNaN(subrange[1]) || point.dist <= subrange[1])))
            .forEach(point => segmentBounds.extend(point));
        if (segmentBounds.isEmpty()) {
            return userBounds;
        }
        return segmentBounds;
    }
    return userBounds;
}

const cvtDistance = (distance, metric) => {
    return (metric ? ((distance * milesToMeters) / 1000) : Number.parseInt(distance));
};

const addBreadcrumb = (msg) => {
    Sentry.addBreadcrumb({
        category: 'map centering',
        level: "info",
        message: msg
    })
}

const findMapBounds = (points, zoomToRange, subrange, userSubrange) => {
    const mapBounds = getMapBounds(points, zoomToRange, subrange, userSubrange)
    addBreadcrumb(`conputed mapBounds ${mapBounds} from ${points.length} points in route`)
    return mapBounds
}

const RouteForecastMap = ({maps_api_key}) => {
    const userControlPoints = useSelector(state => state.controls.userControlPoints)
    const forecast = useSelector(state => state.forecast.forecast)
    const doingAnalysis = useSelector(state=>state.strava.activityData) !== null
    let subrange = useSelector(state => state.strava.activityData !== null ? state.strava.subrange : state.forecast.range)
    if (subrange.length == 2 && isNaN(subrange[1])) {
        subrange = []
    }
    const routeLoadingMode = useSelector(state => state.uiInfo.routeParams.routeLoadingMode)
    const metric = useSelector(state => state.controls.metric)
    const zoomToRange = useSelector(state => state.forecast.zoomToRange)
    const { t } = useTranslation()
    const userSegment = useSelector(state => state.uiInfo.routeParams.segment)

    const { calculatedControlPointValues: controls } = useForecastDependentValues()

    const dispatch = useDispatch()
    useEffect(() => { dispatch(mapViewedSet()) }, [])
    
    const BoundSetter = () => {
        const [mapBounds, setMapBounds] = useState([])
        const apiIsLoaded = useApiIsLoaded()
        const map = useMap()
        useEffect(() => {
            if (!apiIsLoaded) return;
            const theBounds = findMapBounds(points, zoomToRange, subrange, userSegment)
            setMapBounds(theBounds)
            // when the maps library is loaded, apiIsLoaded will be true and the API can be
            // accessed using the global `google.maps` namespace.
        }, [apiIsLoaded, zoomToRange, subrange, userSegment[0], userSegment[1]])
        useEffect(() => {
            if (map && Object.keys(mapBounds).length===2) {
                map.fitBounds(mapBounds, 0)
            }
        }, [map, mapBounds])
    }
    
    const controlNames = userControlPoints.map(control => control.name)

    let markedInfo = findMarkerInfo(forecast, subrange);

    const { points, bounds } = usePointsAndBounds()
    
    let infoVisible = false;
    if (!doingAnalysis && markedInfo.length > 0) {
        infoVisible = true;
    }

    const getInfoWindow  = (markedInfo) => {
        const infoContents = 
        `${t('data.info.temperature')} ${formatTemperature(markedInfo[0].temp, metric)} ${t('data.wind.speed')} ${cvtDistance(markedInfo[0].windSpeed, metric).toFixed(1)} ${t('tableHeaders.windBearing')} ${markedInfo[0].windBearing}`
        const infoWindow = (<InfoWindow maxWidth={170} position={{ lat: markedInfo[0].lat, lng: markedInfo[0].lon }}>{infoContents}</InfoWindow>)
        return infoWindow
    }

    const initialBounds = {north:37.34544, south:37.30822, east:-121.98912, west:-122.06169}
    try {
        return (
            <ErrorBoundary>
                <div id="map" style={{ width:'auto', height: "calc(100vh - 115px)", position: "relative" }}>
                    {(forecast.length > 0 || routeLoadingMode === routeLoadingModes.STRAVA) && bounds !== null ?
                    <APIProvider apiKey={maps_api_key}>
                        <BoundSetter/>
                        <Map
                            mapTypeId={'roadmap'}
                            mapId={"11147ffcb9b103dc"}
                            options={{ scaleControl: true }}
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
                        </APIProvider> :
                        // TODO: localize
                        <h2 style={{ padding: '18px', textAlign: "center" }}>{t('titles.map')}</h2>
                    }
                </div>
            </ErrorBoundary>
        )
    } catch (err) {
        Sentry.captureException(err, 'Error rendering Google Map')
        return (<div>No map due to error</div>)
    }
}

const MapMarkers = ({ forecast, controls, controlNames, subrange, metric }) => {
    // marker title now contains both temperature and mileage
    return (forecast.map((point) =>
                <TempMarker latitude={point.lat}
                    longitude={point.lon}
                    value={cvtDistance(point.distance, metric)}
                    title={`${point.fullTime}\n${formatTemperature(point.temp, metric)}`}
                    bearing={point.windBearing}
                    windSpeed={point.windSpeed}
                    subrange={subrange}
                    key={`${point.lat}${point.lon}${cvtDistance(point.distance, metric)}temp`}
                />
            )
        ).concat(
            controls
                .filter(control => control.lat !== undefined && control.lon !== undefined)
                .map((control, index) =>
                    <ControlMarker
                        latitude={control.lat}
                        longitude={control.lon}
                        value={controlNames[index]}
                        key={`${control.lat}${control.lon}${controlNames[index]}${index}control`}
                    />
                )
        ).concat(
            forecast.map((point) =>
                <RainIcon
                    latitude={point.lat}
                    longitude={point.lon}
                    value={cvtDistance(point.distance, metric)}
                    title={`${point.fullTime}\n${formatTemperature(point.temp, metric)}`}
                    isRainy={point.rainy}
                    key={`${point.lat}${point.lon}${cvtDistance(point.distance, metric)}rain`}
                />
            )
        )
}

const RainIcon = ({ latitude, longitude, value, title, isRainy }) => {
    if (isRainy) {
        return <AdvancedMarker position={{ lat: latitude, lng: longitude }} /* label={value.toFixed(0)} */ title={title}>
            <img style={{position:'absolute',top:'3px'}} src={rainCloud} width={45} height={50} />
        </AdvancedMarker>
    }
    return null;
}

RainIcon.propTypes = {
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    isRainy: PropTypes.bool.isRequired
};

const pickArrowColor = (distance, subrange) => {
    if (subrange.length !== 2) {
        return 'blue';
    }
    const distanceInMeters = distance * milesToMeters;
    return (distanceInMeters >= subrange[0] && distanceInMeters <= subrange[1]) ? 'deeppink' : 'blue';
}

const viewbox_0 = "-25 -35 55 50"
const viewbox_90 = "-20 -20 55 55"
const viewbox_180 = "-35 -20 55 55"
const viewbox_270 = "-33 -35 60 60"

const pickViewbox = (rotation) => {
    if (rotation < 90) return viewbox_0
    if (rotation < 180) return viewbox_90
    if (rotation < 270) return viewbox_180
    return viewbox_270
}

const pickWidth = (rotation) => {
    if (rotation < 90) return 55
    if (rotation < 180) return 55
    if (rotation < 270) return 55
    return 60
}

const pickHeight = (rotation) => {
    if (rotation < 90) return 50
    if (rotation < 180) return 55
    if (rotation < 270) return 55
    return 60
}

export const RotatedArrow = ({rotation, distance, subrange}) => {
    return (
        <svg viewBox={pickViewbox(rotation)} //'-40 -70 73 73'
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            width={pickWidth(rotation)}
            height={pickHeight(rotation)}
            x="-24"
            y="-35"
        >
            <defs>
                <radialGradient id="movingShade" fy="90%">
                    <stop offset="0%" stop-color="lime" stop-opacity="90%"></stop>
                    <stop offset="50%" stop-color="ff8080" stop-opacity="50%"/>
                    <stop offset="100%" stop-color={pickArrowColor(distance,subrange)} stop-opacity="5%"></stop>
                    <animate attributeName="fy" dur="1800ms" from="90%" to="10%" repeatCount="indefinite" />
                </radialGradient>
            </defs>
            <path
                stroke={pickArrowColor(distance,subrange)}
                strokeLinecap="round"
                // strokeWidth="3"
                strokeOpacity={'20%'}
                d={arrowPath}
                fill={`url(#movingShade)`}
                transform={`rotate(${rotation},-0.234,0.134)`}
            />
            <text x={rotation<179?"7":"5"} y={rotation>90&&rotation<180?"-10":"13"} fill="black" fontSize={14}>{distance.toFixed()}</text>
        </svg>
    )
}

const TempMarker = ({ latitude, longitude, value, title, bearing, windSpeed, subrange }) => {
    // Add the marker at the specified location
    if (parseInt(windSpeed) > 3) {
        const flippedBearing = (bearing > 180) ? bearing - 180 : bearing + 180;
        return <AdvancedMarker
            position={{ lat: latitude, lng: longitude }}
            title={title}
        >
            <RotatedArrow rotation={flippedBearing} distance={value} subrange={subrange} />
        </AdvancedMarker>
    }
    else {
        return <AdvancedMarker position={{ lat: latitude, lng: longitude }} title={title}>
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
            }}>{value.toFixed(0)}</div>
        </AdvancedMarker>
    }
}

TempMarker.propTypes = {
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    value: PropTypes.number,
    title: PropTypes.string,
    bearing: PropTypes.number.isRequired,
    windSpeed: PropTypes.string.isRequired,
    subrange: PropTypes.arrayOf(PropTypes.number)
};

const ControlMarker = ({ latitude, longitude, value = '' }) => {
    return <AdvancedMarker position={{ lat: latitude, lng: longitude }} title={value} >
        <img src={circus_tent} width={32} height={32} />
    </AdvancedMarker>;
}

ControlMarker.propTypes = {
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    value: PropTypes.string.isRequired
};

const MapHighlight = ({ points, subrange }) => {
    if (subrange.length !== 2) {
        return null;
    }
    const highlightPoints = points.filter(point => point.dist >= subrange[0] &&
        (isNaN(subrange[1]) || point.dist <= subrange[1]));
        return <Polyline path={highlightPoints} options={{
        strokeColor: '#67ff99',
        strokeOpacity: 1.0,
        strokeWeight: 5
    }} />;
}

MapHighlight.propTypes = {
    points: PropTypes.array.isRequired,
    subrange: PropTypes.arrayOf(PropTypes.number)
}

export default React.memo(RouteForecastMap)