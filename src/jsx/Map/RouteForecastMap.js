import {APIProvider, Map, InfoWindow, useMap, AdvancedMarker, Pin} from '@vis.gl/react-google-maps';
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

const arrowPath = "m16.317 32.634c-.276 0-.5-.224-.5-.5v-31.634c0-.276.224-.5.5-.5s.5.224.5.5v31.634c0 .276-.223.5-.5.5zm12.535-19.098c-.128 0-.256-.049-.354-.146l-12.179-12.183-12.184 12.183c-.195.195-.512.195-.707 0s-.195-.512 0-.707l12.538-12.537c.093-.093.22-.146.353-.146l0 0c.133 0 .26.053.354.146l12.533 12.536c.195.195.195.512 0 .707-.098.098-.226.147-.354.147z"

const findMarkerInfo = (forecast, subrange) => {
    if (!subrange || subrange.length !== 2) {
        return [];
    }
    return forecast.filter((point) => Math.round(point.distance * milesToMeters) >= subrange[0] && Math.round(point.distance * milesToMeters) <= subrange[1]);
}

const getMapBounds = (points, bounds, zoomToRange, subrange) => {
    const defaultBounds = {north:bounds.max_latitude, south:bounds.min_latitude, east:bounds.max_longitude, west:bounds.min_longitude}
    if (zoomToRange && subrange.length === 2 && !isNaN(subrange[1])) {
        let segmentBounds = new window.google.maps.LatLngBounds();
        points.filter(point => (point.dist !== undefined) && (point.dist >= subrange[0] &&
            (isNaN(subrange[1]) || point.dist <= subrange[1])))
            .forEach(point => segmentBounds.extend(point));
        if (segmentBounds.isEmpty()) {
            return defaultBounds;
        }
        return segmentBounds;
    }
    return defaultBounds;
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

const findMapBounds = (points, bounds, zoomToRange, subrange) => {
    const mapBounds = useMemo(() => (getMapBounds(points, bounds, zoomToRange, subrange)), [
        points,
        points.length,
        bounds,
        zoomToRange,
        subrange,
        subrange.length
    ])
    addBreadcrumb(`conputed mapBounds ${mapBounds} from ${points.length} points in route`)
    return mapBounds
}

const SegmentZoomer = ({bounds}) => {
    const map = useMap();
    const [
        savedMap,
        setMap
    ] = useState(null);    
    useEffect(() => {
        if (!map) return;
        setMap(map)
    }, [map]);

    if (savedMap && savedMap.getBounds() && !savedMap.getBounds().equals(bounds)) {
        savedMap.fitBounds(bounds, 0)
    }
}

const RouteForecastMap = ({maps_api_key}) => {

    const userControlPoints = useSelector(state => state.controls.userControlPoints)
    const forecast = useSelector(state => state.forecast.forecast)
    let subrange = useSelector(state => (state.uiInfo.routeParams.routeLoadingMode === routeLoadingModes.STRAVA ?
        state.strava.subrange :
        state.forecast.range))
    if (subrange.length == 2 && isNaN(subrange[1])) {
        subrange = []
    }
    const routeLoadingMode = useSelector(state => state.uiInfo.routeParams.routeLoadingMode)
    const metric = useSelector(state => state.controls.metric)
    const zoomToRange = useSelector(state => state.forecast.zoomToRange)

    const { calculatedControlPointValues: controls } = useForecastDependentValues()

    const dispatch = useDispatch()
    useEffect(() => { dispatch(mapViewedSet()) }, [])

    const controlNames = userControlPoints.map(control => control.name)

    let markedInfo = findMarkerInfo(forecast, subrange);

    const { points, bounds } = usePointsAndBounds()
    
    let infoVisible = false;
    if (markedInfo.length > 0) {
        infoVisible = true;
    }

    const getInfoWindow  = (markedInfo) => {
        //TODO: localize below
        const infoContents = 
        `Temperature ${formatTemperature(markedInfo[0].temp, metric)} Wind speed ${cvtDistance(markedInfo[0].windSpeed, metric).toFixed(1)} Wind bearing ${markedInfo[0].windBearing}`
        const infoWindow = (<InfoWindow position={{ lat: markedInfo[0].lat, lng: markedInfo[0].lon }}><div>{infoContents}</div></InfoWindow>)
        return infoWindow
    }

    try {
        return (
            <ErrorBoundary>
                <div id="map" style={{ height: "calc(100vh - 60px)", position: "relative" }}>
                    {(forecast.length > 0 || routeLoadingMode === routeLoadingModes.STRAVA) && bounds !== null ?
                    <APIProvider apiKey={maps_api_key}>
                        <Map
                            mapTypeId={'roadmap'}
                            mapId={"11147ffcb9b103dc"}
                            options={{ scaleControl: true }}
                            defaultBounds={findMapBounds(points, bounds, zoomToRange, subrange)}
                        >
                            {controls !== null && <MapMarkers forecast={forecast}
                                controls={controls} controlNames={controlNames} 
                                subrange={subrange} metric={metric} 
                            />}
                            {infoVisible && getInfoWindow(markedInfo)}
                            <Polyline path={points} strokeWeight={3} strokeColor={'#3244a8'} strokeOpacity={1.0} />
                            <MapHighlight points={points} subrange={subrange} />
                        </Map>
                        <SegmentZoomer bounds={findMapBounds(points, bounds, zoomToRange, subrange)}/>
                        </APIProvider> :
                        // TODO: localize
                        <h2 style={{ padding: '18px', textAlign: "center" }}>Forecast map</h2>
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
            <img src={rainCloud} width={45} height={50} />
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

export const RotatedArrow = ({rotation, distance, subrange}) => {
    return (
        <svg viewBox='-22 0 58 66'
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            width="100"
            height="75"
        >
            <path
                stroke={pickArrowColor(distance,subrange)}
                strokeLinecap="round"
                strokeWidth="2"
                d={arrowPath}
                transform={`rotate(${rotation}, 16.3, 32.6)`}
            />
            <text x={rotation<179?"-10":"25"} y="45" fill="black" textLength={24} fontSize={14}>{distance.toFixed()}</text>
        </svg>
    )
}// class="markerText
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