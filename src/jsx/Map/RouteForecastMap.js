import React, {Component} from 'react';
import PropTypes from 'prop-types';
import rainCloud from "Images/rainCloud.png";
import {connect} from 'react-redux';
import ErrorBoundary from "../shared/ErrorBoundary";
import circus_tent from 'Images/circus tent.png';
import {Map, InfoWindow, Marker, GoogleApiWrapper, Polyline} from 'google-maps-react-17';
import {formatTemperature} from "../resultsTables/ForecastTable";
// import {withRouter} from 'react-router-dom';
import {setMapViewed} from "../../redux/actions";
import { routeLoadingModes } from '../../data/enums';
import { getRouteInfo, milesToMeters } from '../../utils/util';
import stravaRouteParser from '../../utils/stravaRouteParser';

/*global google*/
const arrow = "M16.317,32.634c-0.276,0-0.5-0.224-0.5-0.5V0.5c0-0.276,0.224-0.5,0.5-0.5s0.5,0.224,0.5,0.5v31.634\n" +
    "\t\tC16.817,32.41,16.594,32.634,16.317,32.634z,M28.852,13.536c-0.128,0-0.256-0.049-0.354-0.146L16.319,1.207L4.135,13.39c-0.195,0.195-0.512,0.195-0.707,0 s-0.195-0.512,0-0.707L15.966,0.146C16.059,0.053,16.186,0,16.319,0l0,0c0.133,0,0.26,0.053,0.354,0.146l12.533,12.536 c0.195,0.195,0.195,0.512,0,0.707C29.108,13.487,28.98,13.536,28.852,13.536z";

class RouteForecastMap extends Component {
    static propTypes = {
        forecast:PropTypes.arrayOf(PropTypes.object).isRequired,
        bounds:PropTypes.shape({
            min_latitude:PropTypes.number.isRequired, max_latitude:PropTypes.number.isRequired,
            min_longitude:PropTypes.number.isRequired, max_longitude:PropTypes.number.isRequired}),
        points:PropTypes.arrayOf(PropTypes.shape({
            lat:PropTypes.number.isRequired, lon:PropTypes.number,elevation:PropTypes.number,
            dist:PropTypes.number})),
        maps_api_key:PropTypes.string.isRequired,
        controls:PropTypes.arrayOf(PropTypes.shape({lat:PropTypes.number,lon:PropTypes.number})),
        controlNames:PropTypes.arrayOf(PropTypes.string),
        subrange:PropTypes.arrayOf(PropTypes.number),
        google:PropTypes.object,
        metric:PropTypes.bool.isRequired,
        routeLoadingMode:PropTypes.number.isRequired,
        setMapViewed:PropTypes.func.isRequired,
        zoomToRange:PropTypes.bool.isRequired
    };

    constructor(props) {
        super(props);
        this.map = null;
        // this.onDesktop = window.matchMedia("(min-width: 1000px)").matches;
        props.setMapViewed();
    }

    static pickArrowColor(distance, subrange) {
        if (subrange.length!==2) {
            return 'blue';
        }
        const distanceInMeters = distance * milesToMeters;
        return (distanceInMeters >= subrange[0] && distanceInMeters <= subrange[1]) ? 'deeppink' : 'blue';
    }

    addRainIcon(latitude, longitude, value, title, isRainy) {
        const markerIcon = {
            url: rainCloud,
            size: new google.maps.Size(320, 320),
            scaledSize: new google.maps.Size(45, 50),
            labelOrigin: new google.maps.Point(22,15),
            anchor: new google.maps.Point(-15, -15)
        };
        if (isRainy) {
            return <Marker key={latitude+longitude+Math.random()} position={{lat:latitude,lng:longitude}} label={value.toString()} icon={markerIcon} title={title}/>;
        }
        return null;
    }

    static addTempMarker(latitude, longitude, value, title, bearing, windSpeed, subrange) {
    // Add the marker at the specified location
        if (parseInt(windSpeed) > 3) {
            const flippedBearing = (bearing > 180) ? bearing - 180 : bearing + 180;
            // const anchor = new google.maps.Point(16.317-19*Math.cos((Math.PI / 180)*bearing),16.317+(25*Math.sin((Math.PI / 180)*bearing)));
            const anchor = new google.maps.Point(16.317,16.317);
            return <Marker key={latitude+longitude+Math.random().toString(10)} position={{lat:latitude,lng:longitude}} label={value.toString()}
                           icon={{path:arrow,rotation:flippedBearing,labelOrigin:new google.maps.Point(0,32),anchor:anchor,
                strokeWeight:2, strokeColor:RouteForecastMap.pickArrowColor(value, subrange),strokeOpacity:0.9}} title={title}/>;
/*
            markers.push(new google.maps.Marker({
                position: {lat:latitude,lng:longitude},
                // label: value.toString(),
                map: map,
                icon: {path:google.maps.SymbolPath.CIRCLE, scale:5}
            }));
*/
        }
        else {
            return <Marker key={latitude+longitude+Math.random().toString(10)} position={{lat:latitude,lng:longitude}} label={value.toString()} title={title}/>
        }
    }

    findMarkerInfo(forecast, subrange) {
        if (subrange.length!==2) {
            return [];
        }
        return forecast.filter((point) => point.distance*milesToMeters > subrange[0] && point.distance*milesToMeters < subrange[1] );
    }

    static buildControlMarker(latitude, longitude, value='') {
        const controlIcon = {
            url: circus_tent,
            size: new google.maps.Size(225, 225),
            scaledSize: new google.maps.Size(32, 32),
            labelOrigin: new google.maps.Point(22,15),
            anchor: new google.maps.Point(0, 0)
        };
        return <Marker key={latitude+longitude} position={{lat: latitude, lng: longitude}} title={value} icon={controlIcon}/>;
    }

    getMapBounds(points, bounds, zoomToRange) {
        let southWest = { lat:bounds.min_latitude, lng:bounds.min_longitude };
        let northEast = { lat:bounds.max_latitude, lng:bounds.max_longitude };
        if (isNaN(bounds.min_latitude) || isNaN(bounds.max_latitude)) {
            console.error(`Bad latitude in bounds`);
            return new google.maps.LatLngBounds({lat:0,lng:0},{lat:0,lng:0});
        }
        const defaultBounds = new google.maps.LatLngBounds(southWest,northEast);
        if (zoomToRange && this.props.subrange.length === 2 && !isNaN(this.props.subrange[1])) {
            let bounds = new google.maps.LatLngBounds();
            points.filter(point => (point.dist !== undefined) && (point.dist >= this.props.subrange[0] &&
                (isNaN(this.props.subrange[1]) || point.dist <= this.props.subrange[1])))
                .forEach(point => bounds.extend(point));
            if (bounds.isEmpty()) {
                return defaultBounds;
            }
            return bounds;
        }
        return defaultBounds;
    }

    getRoutePoints(points) {
        return points;
    }

    getHighlight(points,subrange) {
        if (subrange.length !== 2) {
            return null;
        }
        const highlightPoints = points.filter(point => point.dist >= subrange[0] &&
            (isNaN(subrange[1]) || point.dist <= subrange[1]));
        return <Polyline path={highlightPoints} strokeColor={'#67ff99'} strokeOpacity={0.9} strokeWeight={3}/>;
    }

    cvtDistance = (distance) => {
            return (this.props.metric ? ((distance * milesToMeters)/1000).toFixed(0) : distance);
    };

    buildMarkers(forecast, controls, controlNames, subrange) {
        // marker title now contains both temperature and mileage
        return forecast.map((point) =>
            this.addRainIcon(point.lat, point.lon, this.cvtDistance(point.distance), `${point.fullTime}\n${formatTemperature(point.temp,this.props.metric)}`,
                point.rainy)).concat(
            forecast.map((point) =>
                RouteForecastMap.addTempMarker(point.lat, point.lon, this.cvtDistance(point.distance), `${point.fullTime}\n${formatTemperature(point.temp,this.props.metric)}`,
                    point.windBearing, point.windSpeed, subrange))
        ).concat(
            controls.filter(control => control.lat!==undefined && control.lon!==undefined)
                .map((control,index) => RouteForecastMap.buildControlMarker(control.lat, control.lon, controlNames[index]))
        );
    }

    // shouldComponentUpdate(nextProps, nextState) {
    //     Object.keys(nextProps).forEach(prop => {
    //         console.log(prop)
    //         console.log(nextProps[prop] === this.props[prop])
    //     })
    //     return true
    // }

    render() {
        const bounds = getBounds(
            this.props.rwgpsRouteData,
            this.props.routeStartTime,
            this.props.routePace,
            this.props.forecastInterval,
            this.props.userControlPoints,
            this.props.timeZoneId,
            this.props.stravaActivityStream,
            this.props.routeLoadingMode,
            this.props.metric
        )

        const points = getPoints(
            this.props.rwgpsRouteData,
            this.props.routeStartTime,
            this.props.routePace,
            this.props.forecastInterval,
            this.props.userControlPoints,
            this.props.timeZoneId,
            this.props.stravaActivityStream,
            this.props.routeLoadingMode,
            this.props.metric
        )

        const controlNames = this.props.userControlPoints.map(control => control.name)

        let highlight = this.getHighlight(points, this.props.subrange);
        let markedInfo = this.findMarkerInfo(this.props.forecast, this.props.subrange);
        let infoPosition = {lat:0, lng:0};
        let infoVisible = false;
        let infoContents = '';
        if (markedInfo.length > 0) {
            infoPosition = {lat:markedInfo[0].lat, lng:markedInfo[0].lon};
            infoContents = `Temperature ${markedInfo[0].tempStr} Wind speed ${markedInfo[0].windSpeed} Wind bearing ${markedInfo[0].windBearing}`;
            infoVisible = true;
        }
        const mapBounds = bounds !== null ? this.getMapBounds(points, bounds, this.props.zoomToRange) : null;
        const mapCenter = (mapBounds !== null && mapBounds !== undefined) ? mapBounds.getCenter() : null;
        return (
            <ErrorBoundary>
                <div id="map" style={{'height':'95%'}}>
                    {(this.props.forecast.length > 0 || this.props.routeLoadingMode === routeLoadingModes.STRAVA) && bounds !== null ?
                        <Map google={this.props.google}
                             mapType={'ROADMAP'} scaleControl={true} bounds={mapBounds}
                             initialCenter={(mapCenter === null || mapCenter === undefined) ? undefined : mapCenter.toJSON()}
                             onReady={(mapProps, map) => {map.fitBounds(mapBounds)}}>
                            <Polyline path={this.getRoutePoints(points)} strokeColor={'#ff0000'} strokeWeight={2} strokeOpacity={1.0}/>
                            {highlight}
                            {this.buildMarkers(this.props.forecast, this.props.controls, controlNames, this.props.subrange)}
                            <InfoWindow position={infoPosition} visible={infoVisible}>
                                <div>{infoContents}</div>
                            </InfoWindow>
                        </Map> :
                        <h2 style={{padding:'18px', textAlign:"center"}}>Forecast map</h2>
                    }
                </div>
            </ErrorBoundary>
        );
    }

}

const getBounds = (
    rwgpsRouteData,
    routeStartTime,
    routePace,
    forecastInterval,
    userControlPoints,
    timeZoneId,
    stravaActivityStream,
    routeLoadingMode,
    metric
) => {
    const fakeStateObject = {
        routeInfo: { rwgpsRouteData, timeZoneId },
        uiInfo: { routeParams: { start: routeStartTime, pace: routePace, interval: forecastInterval } },
        controls: { userControlPoints, metric },
    }
    
    const stravaMode = routeLoadingMode === routeLoadingModes.STRAVA
    return stravaMode ? 
        (stravaActivityStream !== null ? stravaRouteParser.computePointsAndBounds(stravaActivityStream).bounds : null)
    : getRouteInfo(fakeStateObject).bounds
}

const getPoints = (
    rwgpsRouteData,
    routeStartTime,
    routePace,
    forecastInterval,
    userControlPoints,
    timeZoneId,
    stravaActivityStream,
    routeLoadingMode,
    metric
) => {
    const fakeStateObject = {
        routeInfo: { rwgpsRouteData, timeZoneId },
        uiInfo: { routeParams: { start: routeStartTime, pace: routePace, interval: forecastInterval } },
        controls: { userControlPoints, metric },
    }

    const stravaMode = routeLoadingMode === routeLoadingModes.STRAVA
    const points = stravaMode ?
        (stravaActivityStream !== null ? stravaRouteParser.computePointsAndBounds(stravaActivityStream).points : [])
    : getRouteInfo(fakeStateObject).points

    return points.filter(point => point.lat !== undefined && point.lon !== undefined).map((point) =>
    { return { lat: point.lat, lng: point.lon, dist: point.dist } })
};

const mapStateToProps = (state) =>
    ({
        rwgpsRouteData: state.routeInfo.rwgpsRouteData,
        routeStartTime: state.uiInfo.routeParams.start,
        routePace: state.uiInfo.routeParams.pace,
        forecastInterval: state.uiInfo.routeParams.interval,
        userControlPoints: state.controls.userControlPoints,
        timeZoneId: state.routeInfo.timeZoneId,
        stravaActivityStream: state.strava.activityStream,

        forecast: state.forecast.forecast,
        controls: state.controls.calculatedControlValues,
        subrange: state.uiInfo.routeParams.routeLoadingMode === routeLoadingModes.STRAVA ? state.strava.subrange : state.forecast.range,
        routeLoadingMode: state.uiInfo.routeParams.routeLoadingMode,
        metric: state.controls.metric,
        zoomToRange: state.forecast.zoomToRange
    });

const mapDispatchToProps = {
    setMapViewed
};

// eslint-disable-next-line new-cap
/*
export default RouteForecastMap.onDesktop ? connect(mapStateToProps)(GoogleApiWrapper((props) => (
    {apiKey: props.maps_api_key}
))(RouteForecastMap)) :
    withRouter(connect(mapStateToProps)(GoogleApiWrapper((props) => (
        {apiKey: props.maps_api_key}
    ))(RouteForecastMap)));
*/
// eslint-disable-next-line new-cap
export default connect(mapStateToProps, mapDispatchToProps)(GoogleApiWrapper((props) => (
    {apiKey: props.maps_api_key}
))(RouteForecastMap));
