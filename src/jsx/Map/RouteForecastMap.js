import { GoogleMap, InfoWindow,MarkerF, Polyline } from '@react-google-maps/api';
import * as Sentry from "@sentry/react"
import circus_tent from 'Images/circus tent.png';
import rainCloud from "Images/rainCloud.png";
import PropTypes from 'prop-types';
import React, { useEffect, useMemo } from 'react';
import { useDispatch,useSelector } from 'react-redux';

import { routeLoadingModes } from '../../data/enums';
import { mapViewedSet } from '../../redux/reducer';
import { useForecastDependentValues, usePointsAndBounds } from '../../utils/hooks';
import { milesToMeters } from '../../utils/util';
import { formatTemperature } from "../resultsTables/ForecastTable";
import ErrorBoundary from "../shared/ErrorBoundary"

const arrow = "M16.317,32.634c-0.276,0-0.5-0.224-0.5-0.5V0.5c0-0.276,0.224-0.5,0.5-0.5s0.5,0.224,0.5,0.5v31.634\n" +
    "\t\tC16.817,32.41,16.594,32.634,16.317,32.634z,M28.852,13.536c-0.128,0-0.256-0.049-0.354-0.146L16.319,1.207L4.135,13.39c-0.195,0.195-0.512,0.195-0.707,0 s-0.195-0.512,0-0.707L15.966,0.146C16.059,0.053,16.186,0,16.319,0l0,0c0.133,0,0.26,0.053,0.354,0.146l12.533,12.536 c0.195,0.195,0.195,0.512,0,0.707C29.108,13.487,28.98,13.536,28.852,13.536z";

const findMarkerInfo = (forecast, subrange) => {
    if (!subrange || subrange.length !== 2) {
        return [];
    }
    return forecast.filter((point) => Math.round(point.distance * milesToMeters) >= subrange[0] && Math.round(point.distance * milesToMeters) <= subrange[1]);
}

const getMapBounds = (points, bounds, zoomToRange, subrange) => {
    let southWest = { lat: bounds.min_latitude, lng: bounds.min_longitude };
    let northEast = { lat: bounds.max_latitude, lng: bounds.max_longitude };
    if (isNaN(bounds.min_latitude) || isNaN(bounds.max_latitude)) {
        Sentry.captureMessage("Bad latitude in map bounds","error")
        return new window.google.maps.LatLngBounds({ lat: 0, lng: 0 }, { lat: 0, lng: 0 });
    }
    const defaultBounds = new window.google.maps.LatLngBounds(southWest, northEast);
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

const RouteForecastMap = () => {

      const [
        map,
        setMap
    ] = React.useState(null)

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

    const onLoad = React.useCallback((loadedMap) => {
        setMap(loadedMap);
    }, [])

    const onUnmount = React.useCallback(() => {
        setMap(null);
    }, [])

    const { points, bounds } = usePointsAndBounds()

    // try to address repeated errors with empty points
    if (points.length === 0 || Object.keys(bounds) === 0) {
        Sentry.captureMessage("Either points or bounds for map are empty","error")
        return
    }

    let mapBounds
    try {
        mapBounds = useMemo(() => (getMapBounds(points, bounds, zoomToRange, subrange)), [
            points,
            bounds,
            zoomToRange,
            subrange
        ])
    } catch (error) {
        Sentry.captureException(error, `Error creating map bounds`)
        return
    }

    let mapCenter
    try {
        mapCenter = useMemo( () => mapBounds.getCenter(), [mapBounds]);
    } catch (err) {
        Sentry.captureException(err,'Error finding map center')
        return
    }
    const initialCenter = useMemo( () => ((mapCenter === null || mapCenter === undefined) ? undefined : mapCenter.toJSON()), [mapCenter])

    let infoPosition = initialCenter
    let infoVisible = false;
    let infoContents = '';
    if (markedInfo.length > 0) {
        infoPosition = { lat: markedInfo[0].lat, lng: markedInfo[0].lon };
        infoContents = `Temperature ${formatTemperature(markedInfo[0].temp, metric)} Wind speed ${cvtDistance(markedInfo[0].windSpeed, metric).toFixed(1)} Wind bearing ${markedInfo[0].windBearing}`;
        infoVisible = true;
    }

    const onBoundsChanged = React.useCallback(() => {
        if (zoomToRange) {
            if (map) {map.fitBounds(mapBounds, 0)}
        }
    }, [mapBounds,map])

    const infoWindow = (<InfoWindow position={infoPosition}><div>{infoContents}</div></InfoWindow>)

    try {
        return (
            <ErrorBoundary>
                <div id="map" /*style={{ height: "calc(100vh - 50px)", position: "relative" }}*/>
                    {(forecast.length > 0 || routeLoadingMode === routeLoadingModes.STRAVA) && bounds !== null ?
                        <GoogleMap
                            mapTypeId={window.google.maps.MapTypeId.ROADMAP}
                            options={{ scaleControl: true }}
                            zoom={8}
                            center={initialCenter}
                            mapContainerStyle={{ width: 'auto', height: "calc(100vh - 70px)", position: 'relative' }}
                            onLoad={onLoad}
                            onUnmount={onUnmount}
                            onBoundsChanged={onBoundsChanged}
                        >
                            <Polyline path={points} options={{ strokeColor: '#ff0000', strokeWeight: 2, strokeOpacity: 1.0 }} />
                            <MapHighlight points={points} subrange={subrange} />
                            {controls !== null && <MapMarkers forecast={forecast} google={window.google}
                                controls={controls} controlNames={controlNames} subrange={subrange} metric={metric} map={map} mapCenter={mapCenter} />}
                            {infoVisible && infoWindow}
                        </GoogleMap> :
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

const MapMarkers = ({ forecast, controls, controlNames, subrange, metric, map, mapCenter, google }) => {
    // marker title now contains both temperature and mileage
    return (forecast.map((point) =>
        <RainIcon
            latitude={point.lat}
            longitude={point.lon}
            value={cvtDistance(point.distance, metric)}
            title={`${point.fullTime}\n${formatTemperature(point.temp, metric)}`}
            isRainy={point.rainy}
            key={`${point.lat}${point.lon}${cvtDistance(point.distance, metric)}rain`}
            map={map} mapCenter={mapCenter} google={google}
        />))
        .concat(
            forecast.map((point) =>
                <TempMarker latitude={point.lat}
                    longitude={point.lon}
                    value={cvtDistance(point.distance, metric)}
                    title={`${point.fullTime}\n${formatTemperature(point.temp, metric)}`}
                    bearing={point.windBearing}
                    windSpeed={point.windSpeed}
                    subrange={subrange}
                    key={`${point.lat}${point.lon}${cvtDistance(point.distance, metric)}temp`}
                    map={map} mapCenter={mapCenter} google={google}
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
                        map={map} mapCenter={mapCenter} google={google}
                    />
                )
        )
}

const RainIcon = ({ latitude, longitude, value, title, isRainy, map, mapCenter, google }) => {
    const markerIcon = {
        url: rainCloud,
        size: new google.maps.Size(320, 320),
        scaledSize: new google.maps.Size(45, 50),
        labelOrigin: new google.maps.Point(22, 15),
        anchor: new google.maps.Point(-15, -15)
    };
    if (isRainy) {
        return <MarkerF position={{ lat: latitude, lng: longitude }} label={value.toFixed(0)} icon={markerIcon} title={title} map={map} mapCenter={mapCenter} />;
    }
    return null;
}

RainIcon.propTypes = {
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    isRainy: PropTypes.bool.isRequired,
    map: PropTypes.object,
    mapCenter: PropTypes.object.isRequired,
    google: PropTypes.object.isRequired
};

const pickArrowColor = (distance, subrange) => {
    if (subrange.length !== 2) {
        return 'blue';
    }
    const distanceInMeters = distance * milesToMeters;
    return (distanceInMeters >= subrange[0] && distanceInMeters <= subrange[1]) ? 'deeppink' : 'blue';
}

const TempMarker = ({ latitude, longitude, value, title, bearing, windSpeed, subrange, map, google, mapCenter }) => {
    // Add the marker at the specified location
    if (parseInt(windSpeed) > 3) {
        const flippedBearing = (bearing > 180) ? bearing - 180 : bearing + 180;
        // const anchor = new google.maps.Point(16.317-19*Math.cos((Math.PI / 180)*bearing),16.317+(25*Math.sin((Math.PI / 180)*bearing)));
        const anchor = new google.maps.Point(16.317, 16.317);
        return <MarkerF
            position={{ lat: latitude, lng: longitude }}
            label={value.toFixed(0)}
            icon={{
                path: arrow,
                rotation: flippedBearing,
                labelOrigin: new google.maps.Point(0, 32),
                anchor: anchor,
                strokeWeight: 2,
                strokeColor: pickArrowColor(value, subrange),
                strokeOpacity: 0.9
            }}
            title={title}
            map={map}
            mapCenter={mapCenter}
        />
    }
    else {
        return <MarkerF position={{ lat: latitude, lng: longitude }} label={value.toFixed(0)} title={title} map={map} google={google} mapCenter={mapCenter} />
    }
}

TempMarker.propTypes = {
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    value: PropTypes.number,
    title: PropTypes.string,
    bearing: PropTypes.number.isRequired,
    windSpeed: PropTypes.string.isRequired,
    subrange: PropTypes.arrayOf(PropTypes.number),
    map: PropTypes.object,
    mapCenter: PropTypes.object,
    google: PropTypes.object.isRequired
};

const ControlMarker = ({ latitude, longitude, value = '', map, mapCenter, google }) => {
    const controlIcon = {
        url: circus_tent,
        size: new google.maps.Size(225, 225),
        scaledSize: new google.maps.Size(32, 32),
        labelOrigin: new google.maps.Point(22, 15),
        anchor: new google.maps.Point(0, 0)
    };
    return <MarkerF position={{ lat: latitude, lng: longitude }} title={value} icon={controlIcon} map={map} mapCenter={mapCenter} />;
}

ControlMarker.propTypes = {
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    value: PropTypes.string.isRequired,
    map: PropTypes.object,
    mapCenter: PropTypes.object,
    google: PropTypes.object.isRequired
};

const MapHighlight = ({ points, subrange, map, mapCenter }) => {
    if (subrange.length !== 2) {
        return null;
    }
    const highlightPoints = points.filter(point => point.dist >= subrange[0] &&
        (isNaN(subrange[1]) || point.dist <= subrange[1]));
    return <Polyline path={highlightPoints} options={{
        strokeColor: '#67ff99',
        strokeOpacity: 0.9,
        strokeWeight: 3
    }} map={map} mapCenter={mapCenter} />;
}

MapHighlight.propTypes = {
    points: PropTypes.array.isRequired,
    subrange: PropTypes.arrayOf(PropTypes.number),
    map: PropTypes.object,
    mapCenter: PropTypes.object
}

export default React.memo(RouteForecastMap)