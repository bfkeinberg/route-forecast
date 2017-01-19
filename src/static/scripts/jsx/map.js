import React, { Component } from 'react';
import loadGoogleMapsAPI from 'load-google-maps-api';

class RouteForecastMap extends Component {

    constructor(props) {
        super(props);
        this.initMap = this.initMap.bind(this);

        this.state = {googleMapsApi:null, googleMapsPromise: loadGoogleMapsAPI({key:this.props.maps_api_key})};
    }

    static addMarker(latitude, longitude, map, value, title) {
    // Add the marker at the specified location
        let marker = new google.maps.Marker({
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
    }

    static addMarkers(forecast,map) {
        return (
            forecast.map((point, index, data) =>
                RouteForecastMap.addMarker(point[6], point[7], map, point[8], point[9])
            )
        );
    }

    /*
     (point) =>
     {lat:point.latitude, lng: point.longitude});
     */

    makePoint(point) {
        return {lat:point.latitude, lng:point.longitude};
    }

    initMap(forecast, routeInfo) {
        let mapDiv = document.getElementById('map');
        if (mapDiv == null) {
            return;
        }
        if (this.state.googleMapsApi == null) {
            return;
        }
        let map = new this.state.googleMapsApi.Map(mapDiv, {
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        if (map == null) {
            return;
        }
        let southWest = { lat:routeInfo['bounds']['min_latitude'], lng:routeInfo['bounds']['min_longitude'] };
        let northEast = { lat:routeInfo['bounds']['max_latitude'], lng:routeInfo['bounds']['max_longitude'] };
        let mapBounds = new google.maps.LatLngBounds(southWest,northEast);
        map.fitBounds(mapBounds);
        RouteForecastMap.addMarkers(forecast,map);
        let routePoints = routeInfo['points'].map(this.makePoint);
        this.drawRoute(routePoints,map)
    };

    drawTheMap(gmaps,forecast,routeInfo) {
        if (forecast.length > 0) {
            this.initMap(forecast, routeInfo);
        }
        else {
            return (<h2 style={{padding:'18px', textAlign:"center"}}>Forecast map</h2>);
        }
    }

    render() {
        return (
            <div id="map" style={{'height': '400px'}}>
                {this.drawTheMap(this.state.googleMapsApi, this.props.forecast, this.props.routeInfo)}
            </div>
        );
    }

    componentWillReceiveProps() {
        this.state.googleMapsPromise.then((googleMaps) => {
            this.setState ({googleMapsApi:googleMaps});
        }).catch((err) => {
            console.error(err);
        });
    }
}

module.exports=RouteForecastMap;
export default RouteForecastMap;