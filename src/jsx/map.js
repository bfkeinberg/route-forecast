import React, {Component} from 'react';
import loadGoogleMapsAPI from 'load-google-maps-api';
import PropTypes from 'prop-types';
import rainCloud from "Images/rainCloud.png";
import {connect} from 'react-redux';
import ErrorBoundary from "./errorBoundary";
import circus_tent from 'Images/circus tent.png';

/*global google*/
const arrow = "M16.317,32.634c-0.276,0-0.5-0.224-0.5-0.5V0.5c0-0.276,0.224-0.5,0.5-0.5s0.5,0.224,0.5,0.5v31.634\n" +
    "\t\tC16.817,32.41,16.594,32.634,16.317,32.634z,M28.852,13.536c-0.128,0-0.256-0.049-0.354-0.146L16.319,1.207L4.135,13.39c-0.195,0.195-0.512,0.195-0.707,0 s-0.195-0.512,0-0.707L15.966,0.146C16.059,0.053,16.186,0,16.319,0l0,0c0.133,0,0.26,0.053,0.354,0.146l12.533,12.536 c0.195,0.195,0.195,0.512,0,0.707C29.108,13.487,28.98,13.536,28.852,13.536z";
const milesToMeters = 1609.34;

class RouteForecastMap extends Component {
    static propTypes = {
        forecast:PropTypes.arrayOf(PropTypes.object).isRequired,
        bounds:PropTypes.shape({
            min_latitude:PropTypes.number.isRequired, max_latitude:PropTypes.number.isRequired,
            min_longitude:PropTypes.number.isRequired, max_longitude:PropTypes.number.isRequired}),
        points:PropTypes.arrayOf(PropTypes.shape({
            lat:PropTypes.number.isRequired, lon:PropTypes.number.isRequired,elevation:PropTypes.number.isRequired,
            dist:PropTypes.number.isRequired})),
        maps_api_key:PropTypes.string.isRequired,
        controls:PropTypes.arrayOf(PropTypes.shape({lat:PropTypes.number,lon:PropTypes.number})),
        controlNames:PropTypes.arrayOf(PropTypes.string),
        subrange:PropTypes.arrayOf(PropTypes.number)
    };

    constructor(props) {
        super(props);
        this.initMap = this.initMap.bind(this);
        this.map = null;
        this.markers = [];
        this.routePath = null;
        this.highlightPath = null;
        this.state = {map:null};
    }

    static pickArrowColor(distance, subrange) {
        if (subrange.length!==2) {
            return 'blue';
        }
        const distanceInMeters = distance * milesToMeters;
        return (distanceInMeters >= subrange[0] && distanceInMeters <= subrange[1]) ? 'deeppink' : 'blue';
    }

    static addMarker(latitude, longitude, map, value, title, isRainy, bearing, windSpeed, subrange) {
    // Add the marker at the specified location
        const markerIcon = {
                url: rainCloud,
                size: new google.maps.Size(320, 320),
                scaledSize: new google.maps.Size(45, 50),
                labelOrigin: new google.maps.Point(22,15),
                anchor: new google.maps.Point(-15, -15)
        };
        let markers = [];
        if (isRainy) {
            markers.push(new google.maps.Marker({
                position: {lat:latitude,lng:longitude},
                label: value.toString(),
                map: map,
                icon: markerIcon,
                title: title
            }));
        }
        if (parseInt(windSpeed) > 3) {
            const flippedBearing = (bearing > 180) ? bearing - 180 : bearing + 180;
            // const anchor = new google.maps.Point(16.317-19*Math.cos((Math.PI / 180)*bearing),16.317+(25*Math.sin((Math.PI / 180)*bearing)));
            const anchor = new google.maps.Point(16.317,16.317);
            markers.push(new google.maps.Marker({
                position: {lat:latitude,lng:longitude},
                label: value.toString(),
                map: map,
                icon: {path:arrow,rotation:flippedBearing,labelOrigin:new google.maps.Point(0,32),anchor:anchor,
                    strokeWeight:2, strokeColor:RouteForecastMap.pickArrowColor(value, subrange),strokeOpacity:0.9},
                title: title
            }));
/*
            markers.push(new google.maps.Marker({
                position: {lat:latitude,lng:longitude},
                // label: value.toString(),
                map: map,
                icon: {path:google.maps.SymbolPath.CIRCLE, scale:5}
            }));
*/
        }
        else markers.push(new google.maps.Marker({
            position: {lat:latitude,lng:longitude},
            label: value.toString(),
            map: map,
            title: title
        }));
        return markers;
    }

    static addControlMarker(latitude, longitude, map, value='') {
        const controlIcon = {
            url: circus_tent,
            size: new google.maps.Size(225, 225),
            scaledSize: new google.maps.Size(32, 32),
            labelOrigin: new google.maps.Point(22,15),
            anchor: new google.maps.Point(0, 0)
        };
        return new google.maps.Marker({
            position: {lat: latitude, lng: longitude},
            title: value,
            icon:controlIcon,
            map: map
        });
    }

    static drawRoute(points, map) {
        let routeLine = new google.maps.Polyline({
            path: points,
            geodesic: true,
            strokeColor: '#ff0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        routeLine.setMap(map);
        return routeLine;
    }

    static drawHighlight(points,subrange,map) {
        if (subrange.length!==2) {
            return null;
        }
        const highlightPoints = points.filter(point => point.dist >= subrange[0] &&
            (isNaN(subrange[1]) || point.dist <= subrange[1]));
        const highlight = new google.maps.Polyline({
            path:highlightPoints, geodesic:true,
            strokeColor: '#67ff99',
            strokeOpacity: 0.9,
            strokeWeight: 3
        });
        highlight.setMap(map);
        return highlight;
    }

    static clearMarkers(markers) {
        markers.forEach(marker => marker.setMap(null));
        markers.length = 0;
    }

    static addMarkers(forecast, controls, controlNames, map, subrange) {
        // marker title now contains both temperature and mileage
        return (
            forecast.map((point) =>
                RouteForecastMap.addMarker(point.lat, point.lon, map, point.distance, `${point.fullTime}\n${point.tempStr}`,
                    point.rainy, point.windBearing, point.windSpeed, subrange)
            ).reduce((acc, cur) => acc.concat(cur)).concat(
                controls.filter(control => control.lat!==undefined && control.lon!==undefined)
                    .map((control,index) => RouteForecastMap.addControlMarker(control.lat, control.lon, map, controlNames[index]))))
    }

    clearRoutePath = (routePath) => {if (routePath !== null) {routePath.setMap(null);this.routePath = null}};

    clearHighlight = (highlightPath) => {if (highlightPath !== null) {highlightPath.setMap(null);this.highlightPath = null}};

    initMap(forecast, bounds,points) {
        if (this.state.map === null) {
            return;
        }
        let southWest = { lat:bounds.min_latitude, lng:bounds.min_longitude };
        let northEast = { lat:bounds.max_latitude, lng:bounds.max_longitude };
        let mapBounds = new google.maps.LatLngBounds(southWest,northEast);
        this.state.map.fitBounds(mapBounds);
        let routePoints = points.filter(point => point.lat !== undefined && point.lon !== undefined).map((point) => {return {lat:point.lat, lng: point.lon, dist:point.dist}});
        // clear out old route path line if any
        this.clearRoutePath(this.routePath);
        this.clearHighlight(this.highlightPath);
        this.routePath = RouteForecastMap.drawRoute(routePoints,this.state.map);
        this.highlightPath = RouteForecastMap.drawHighlight(routePoints,this.props.subrange,this.state.map);
        RouteForecastMap.clearMarkers(this.markers);
        this.markers = RouteForecastMap.addMarkers(forecast, this.props.controls, this.props.controlNames, this.state.map, this.props.subrange);
    }

    drawTheMap(forecast,bounds, points) {
        if (forecast.length > 0 && bounds !== null) {
            this.initMap(forecast, bounds, points);
        }
    }

/*    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.forecast.length > 0) {
            loadGoogleMapsAPI({key: nextProps.maps_api_key}).then(googleMaps => {
                const mapRef = prevState.mapDiv;
                if (mapRef === null) {
                    reject("No map div");
                    return null;
                }
                let map = new googleMaps.Map(mapRef, {mapTypeId: google.maps.MapTypeId.ROADMAP, scaleControl: true});
                if (map === null) {
                    reject('Cannot create map');
                    return null;
                }
                return {...prevState, map: map};
            }, error => {
                console.log(error)
            }).catch((err) => {
                    console.error(err);
            });
        }
        return null;
    }*/

    UNSAFE_componentWillReceiveProps(newProps) {
        if (newProps.forecast.length > 0) {
            loadGoogleMapsAPI({key:this.props.maps_api_key}).then((googleMaps) => {
                const mapRef = this.mapDiv;
                if (mapRef === null) {
                    return;
                }
                let map = new googleMaps.Map(mapRef, {mapTypeId: google.maps.MapTypeId.ROADMAP, scaleControl:true});
                if (map === null) {
                    return;
                }
                this.setState({map : map});
            },error => {console.log(error)})
                .catch((err) => {console.error(err);
            });
        } else {
            this.clearRoutePath(this.routePath);
            this.clearHighlight(this.highlightPath);
        }
    }

    render() {
        return (
            <ErrorBoundary>
                <div id="map" ref={mapDiv => this.mapDiv = mapDiv} style={{'height':'95%'}}>
                    <h2 style={{padding:'18px', textAlign:"center"}}>Forecast map</h2>
                </div>
            </ErrorBoundary>
        );
    }

    componentDidUpdate() {
        this.drawTheMap(this.props.forecast, this.props.bounds, this.props.points);
    }

}

const mapStateToProps = (state) =>
    ({
        forecast: state.forecast.forecast,
        bounds:state.routeInfo.bounds,
        points:state.routeInfo.points,
        maps_api_key: state.params.maps_api_key,
        controls: state.controls.calculatedControlValues,
        controlNames: state.controls.userControlPoints.map(control => control.name),
        subrange: state.strava.subrange.length > 0 ? state.strava.subrange : state.forecast.range
    });


export default connect(mapStateToProps)(RouteForecastMap);