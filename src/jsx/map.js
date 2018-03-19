import React, {Component} from 'react';
import loadGoogleMapsAPI from 'load-google-maps-api';
import PropTypes from 'prop-types';
import se_arrow from 'Images/arrow_down_right.png';
import north_arrow from "Images/arrow_up.png";
import ne_arrow from "Images/arrow_up_right.png";
import south_arrow from "Images/arrow_down.png";
import sw_arrow from "Images/arrow_down_left.png";
import west_arrow from "Images/arrow_left.png";
import nw_arrow from "Images/arrow_up_left.png";
import east_arrow from "Images/arrow_right.png";
import rainCloud from "Images/rainCloud.png";
import {connect} from 'react-redux';
import ErrorBoundary from "./errorBoundary";
import circus_tent from 'Images/circus tent.png';

/*global google*/

class RouteForecastMap extends Component {
    static propTypes = {
        forecast:PropTypes.arrayOf(PropTypes.array).isRequired,
        routeInfo:PropTypes.shape({bounds:PropTypes.object,points:PropTypes.array}).isRequired,
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
        this.googleMapsApi = null;
        this.googleMapsPromise = null;
        this.state = {map:null};
    }

    static selectWindIcon(bearing) {
        if (bearing < 22 || bearing >= 338) {
            return {
                url:south_arrow,
                size: new google.maps.Size(40,40),
                labelOrigin: new google.maps.Point(-5,0),
                origin: new google.maps.Point(0,0),
                anchor: new google.maps.Point(0, 0)
            };
        }
        if (bearing >= 22 && bearing < 67) {
            return {
                url:sw_arrow,
                size: new google.maps.Size(55,55),
                labelOrigin: new google.maps.Point(-5,-15),
                origin: new google.maps.Point(0,0),
                anchor: new google.maps.Point(0,0)
            };
        }
        if (bearing >= 67 && bearing <112) {
            return {
                url:west_arrow,
                size: new google.maps.Size(40, 40),
                origin: new google.maps.Point(0,0),
                labelOrigin: new google.maps.Point(-5,-15),
                anchor: new google.maps.Point(0, 0)
            };
        }
        if (bearing >=112 && bearing < 157) {
            return {
                url:nw_arrow,
                size: new google.maps.Size(45, 45),
                origin: new google.maps.Point(0,0),
                labelOrigin: new google.maps.Point(-5,-15),
                anchor: new google.maps.Point(0, 0)
            };
        }
        if (bearing >=157 && bearing < 202) {
            return {
                url:north_arrow,
                size: new google.maps.Size(50, 50),
                origin: new google.maps.Point(0,0),
                labelOrigin: new google.maps.Point(-5,-15),
                anchor: new google.maps.Point(0, 0)
            };
        }
        if (bearing >= 202 && bearing < 247) {
            return {
                url:ne_arrow,
                size: new google.maps.Size(52, 52),
                origin: new google.maps.Point(0,0),
                labelOrigin: new google.maps.Point(-5,-5),
                anchor: new google.maps.Point(0, 0)
            };

        }
        if (bearing >= 247 && bearing < 302) {
            return {
                url:east_arrow,
                size: new google.maps.Size(45, 45),
                origin: new google.maps.Point(0,0),
                labelOrigin: new google.maps.Point(-5,2),
                anchor: new google.maps.Point(0, 0)
            };

        }
        return {
            url:se_arrow,
            size: new google.maps.Size(42,42),
            origin: new google.maps.Point(0,0),
            labelOrigin: new google.maps.Point(-3,15),
            anchor: new google.maps.Point(0, 0)
        };
    }

    static addMarker(latitude, longitude, map, value, title, isRainy, bearing, windSpeed) {
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
            markers.push(new google.maps.Marker({
                position: {lat:latitude,lng:longitude},
                label: value.toString(),
                map: map,
                icon: RouteForecastMap.selectWindIcon(bearing),
                title: title
            }));
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
        const highlightPoints = points.filter(point => point.dist >= subrange[0] && point.dist <= subrange[1]);
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

    static addMarkers(forecast, controls, controlNames, map) {
        // marker title now contains both temperature and mileage
        return (
            forecast.map((point) =>
                RouteForecastMap.addMarker(point[7], point[8], map, point[1], point[10] + '\n' + point[3],
                    point[12], point[13], point[6])
            ).reduce((acc, cur) => acc.concat(cur)).concat(
                controls.map((control,index) => RouteForecastMap.addControlMarker(control.lat, control.lon, map, controlNames[index]))));
    }

    initMap(forecast, routeInfo) {
        if (this.state.map === null) {
            return;
        }
        let southWest = { lat:routeInfo.bounds.min_latitude, lng:routeInfo.bounds.min_longitude };
        let northEast = { lat:routeInfo.bounds.max_latitude, lng:routeInfo.bounds.max_longitude };
        let mapBounds = new google.maps.LatLngBounds(southWest,northEast);
        this.state.map.fitBounds(mapBounds);
        RouteForecastMap.clearMarkers(this.markers);
        this.markers = RouteForecastMap.addMarkers(forecast, this.props.controls, this.props.controlNames, this.state.map);
        let routePoints = routeInfo.points.map((point) => {return {lat:point.lat, lng: point.lon, dist:point.dist}});
        // clear out old route path line if any
        if (this.routePath !== null) {
            this.routePath.setMap(null);
            this.routePath = null;
        }
        if (this.highlightPath !== null) {
            this.highlightPath.setMap(null);
            this.highlightPath = null;
        }
        this.routePath = RouteForecastMap.drawRoute(routePoints,this.state.map);
        this.highlightPath = RouteForecastMap.drawHighlight(routePoints,this.props.subrange,this.state.map);
    }

    drawTheMap(gmaps,forecast,routeInfo) {
        if (forecast.length > 0 && routeInfo.bounds !== null) {
            this.initMap(forecast, routeInfo);
        }
    }

    componentWillReceiveProps(newProps) {
        if (newProps.forecast.length > 0) {
            if (this.googleMapsPromise === null) {
                this.googleMapsPromise = loadGoogleMapsAPI({key:this.props.maps_api_key});
            }
            if (this.googleMapsApi === null) {
                this.googleMapsPromise.then((googleMaps) => {
                    this.googleMapsApi = googleMaps;
                    const mapRef = this.mapDiv;
                    if (mapRef === null) {
                        return;
                    }
                    if (this.googleMapsApi === null) {
                        return;
                    }
                    let map = new this.googleMapsApi.Map(mapRef, {mapTypeId: google.maps.MapTypeId.ROADMAP});
                    if (map === null) {
                        return;
                    }
                    this.setState({map : map});
                }).catch((err) => {
                    console.error(err);
                });
            }
        }
    }

    render() {
        return (
            <ErrorBoundary>
                <div id="map" ref={mapDiv => this.mapDiv = mapDiv} style={{'height':'100%'}}>
                    <h2 style={{padding:'18px', textAlign:"center"}}>Forecast map</h2>
                </div>
            </ErrorBoundary>
        );
    }

    componentDidUpdate() {
        this.drawTheMap(this.googleMapsApi, this.props.forecast, this.props.routeInfo);
    }

}

const mapStateToProps = (state) =>
    ({
        forecast: state.forecast.forecast,
        routeInfo: state.routeInfo,
        maps_api_key: state.params.maps_api_key,
        controls: state.controls.calculatedControlValues,
        controlNames: state.controls.userControlPoints.map(control => control.name),
        subrange: state.strava.subrange
    });


export default connect(mapStateToProps)(RouteForecastMap);