import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import loadGoogleMapsAPI from 'load-google-maps-api';

const se_arrow = "static/arrow_down_right.png";
const north_arrow = "/static/arrow_up.png";
const ne_arrow = "/static/arrow_up_right.png";
const south_arrow = "/static/arrow_down.png";
const sw_arrow = "/static/arrow_down_left.png";
const west_arrow = "/static/arrow_left.png";
const nw_arrow = "/static/arrow_up_left.png";
const east_arrow = "/static/arrow_right.png";

class RouteForecastMap extends Component {

    constructor(props) {
        super(props);
        this.initMap = this.initMap.bind(this);
        this.map = null;
        this.markers = [];
        this.routePath = null;
        this.googleMapsApi = null;
        this.state = {googleMapsPromise: loadGoogleMapsAPI({key:this.props.maps_api_key})};
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
        let markerIcon = {
                url: "http://cdn.mysitemyway.com/etc-mysitemyway/icons/legacy-previews/icons/blue-chrome-rain-icons-natural-wonders/050175-blue-chrome-rain-icon-natural-wonders-rain-cloud1.png",
                size: new google.maps.Size(320, 320),
                scaledSize: new google.maps.Size(45, 50),
                labelOrigin: new google.maps.Point(22,15),
                anchor: new google.maps.Point(0, 0)
        };
        if (isRainy) {
            return new google.maps.Marker({
                position: {lat:latitude,lng:longitude},
                label: value.toString(),
                map: map,
                icon: markerIcon,
                title: title
            });
        }
        else if (parseInt(windSpeed) > 3) {
            return new google.maps.Marker({
                position: {lat:latitude,lng:longitude},
                label: value.toString(),
                map: map,
                icon: RouteForecastMap.selectWindIcon(bearing),
                title: title
            });
        }
        else return new google.maps.Marker({
            position: {lat:latitude,lng:longitude},
            label: value.toString(),
            map: map,
            title: title
        });
    }

    drawRoute(points,map) {
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

    static clearMarkers(markers) {
        markers.forEach(marker => marker.setMap(null));
        markers.length = 0;
    }

    static addMarkers(forecast, map, markers) {
        // marker title now contains both temperature and mileage
        return (
            forecast.map((point, index, data) =>
                RouteForecastMap.addMarker(point[7], point[8], map, point[1], point[10] + '\n' + point[3], point[12], point[13], point[6])
            )
        );
    }

    initMap(forecast, routeInfo) {
        if (this.map===null) {
            return;
        }
        let southWest = { lat:routeInfo['bounds']['min_latitude'], lng:routeInfo['bounds']['min_longitude'] };
        let northEast = { lat:routeInfo['bounds']['max_latitude'], lng:routeInfo['bounds']['max_longitude'] };
        let mapBounds = new google.maps.LatLngBounds(southWest,northEast);
        this.map.fitBounds(mapBounds);
        RouteForecastMap.clearMarkers(this.markers);
        this.markers = RouteForecastMap.addMarkers(forecast, this.map, this.markers);
        let routePoints = routeInfo['points'].map((point) => {return {lat:point.latitude, lng: point.longitude}});
        // clear out old route path line if any
        if (this.routePath != null) {
            this.routePath.setMap(null);
            this.routePath = null;
        }
        this.routePath = this.drawRoute(routePoints,this.map);
    };

    drawTheMap(gmaps,forecast,routeInfo) {
        if (forecast.length > 0) {
            this.initMap(forecast, routeInfo);
        }
    }

    render() {
        return (
            <div id="map" ref='mapDiv' style={{'height':'100%'}}>
                <h2 style={{padding:'18px', textAlign:"center"}}>Forecast map</h2>
            </div>
        );
    }

    componentDidUpdate(prevProps,prevState) {
        if (this.googleMapsApi == null) {
            this.state.googleMapsPromise.then((googleMaps) => {
                this.googleMapsApi = googleMaps;
                const mapRef = this.refs.mapDiv;
                const node = ReactDOM.findDOMNode(mapRef);
                if (node === null) {
                    return;
                }
                if (this.googleMapsApi === null) {
                    return;
                }
                let map = new this.googleMapsApi.Map(node, {mapTypeId: google.maps.MapTypeId.ROADMAP});
                if (map === null) {
                    return;
                }
                this.map = map;
            }).catch((err) => {
                console.error(err);
            });
        }
        this.drawTheMap(this.googleMapsApi, this.props.forecast, this.props.routeInfo);
    }

}

export default RouteForecastMap;