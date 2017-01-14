import React, { Component } from 'react';
import loadGoogleMapsAPI from 'load-google-maps-api';

class RouteForecastMap extends React.Component {

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

    static addMarkers(values,map) {
        if (values['forecast'] != null) {
            return (
                values['forecast'].map((point, index, data) =>
                    RouteForecastMap.addMarker(point[6], point[7], map, point[8], point[9])
                )
            );
        }
    }

    /*
     (point) =>
     {lat:point.latitude, lng: point.longitude});
     */

    makePoint(point) {
        return {lat:point.latitude, lng:point.longitude};
    }

    initMap(min_lat,min_lon,max_lat,max_lon,values) {
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
        var southWest = { lat:min_lat, lng:min_lon };
        var northEast = { lat:max_lat, lng:max_lon };
        var bounds = new google.maps.LatLngBounds(southWest,northEast);
        map.fitBounds(bounds);
        RouteForecastMap.addMarkers(values,map);
        let routePoints = values['points'].map(this.makePoint);
        this.drawRoute(routePoints,map)
    };

    drawTheMap(gmaps,values) {
        if (values['forecast'] != null) {
            this.initMap(values['min_lat'],
                values['min_lon'],
                values['max_lat'],
                values['max_lon'],
                values
            );
        }
        else {
            return (<h2 style={{textAlign:"center"}}>Forecast map</h2>);
        }
    }

    render() {
        return (
            <div id="map" style={{'height': '400px'}}>
                {this.drawTheMap(this.state.googleMapsApi, this.props.forecast)}
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