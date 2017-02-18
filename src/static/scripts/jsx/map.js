import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import loadGoogleMapsAPI from 'load-google-maps-api';

class RouteForecastMap extends Component {

    constructor(props) {
        super(props);
        this.initMap = this.initMap.bind(this);
        this.map = null;
        this.markers = [];
        this.state = {googleMapsApi:null, googleMapsPromise: loadGoogleMapsAPI({key:this.props.maps_api_key})};
    }

    static addMarker(latitude, longitude, map, value, title) {
    // Add the marker at the specified location
        return new google.maps.Marker({
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

    static clearMarkers(markers) {
        markers.forEach(marker => marker.setMap(null));
        markers.length = 0;
    }

    static addMarkers(forecast, map, markers) {
        return (
            forecast.map((point, index, data) =>
                RouteForecastMap.addMarker(point[7], point[8], map, point[9], point[10])
            )
        );
    }

    initMap(forecast, routeInfo) {
        if (this.map==null) {
            return;
        }
        let southWest = { lat:routeInfo['bounds']['min_latitude'], lng:routeInfo['bounds']['min_longitude'] };
        let northEast = { lat:routeInfo['bounds']['max_latitude'], lng:routeInfo['bounds']['max_longitude'] };
        let mapBounds = new google.maps.LatLngBounds(southWest,northEast);
        this.map.fitBounds(mapBounds);
        RouteForecastMap.clearMarkers(this.markers);
        this.markers = RouteForecastMap.addMarkers(forecast, this.map, this.markers);
        let routePoints = routeInfo['points'].map((point) => {return {lat:point.latitude, lng: point.longitude}});
        this.drawRoute(routePoints,this.map)
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
        if (this.state.googleMapsApi == null) {
            this.state.googleMapsPromise.then((googleMaps) => {
                this.setState({googleMapsApi: googleMaps});
                const mapRef = this.refs.mapDiv;
                const node = ReactDOM.findDOMNode(mapRef);
                if (node == null) {
                    return;
                }
                if (this.state.googleMapsApi == null) {
                    return;
                }
                let map = new this.state.googleMapsApi.Map(node, {mapTypeId: google.maps.MapTypeId.ROADMAP});
                if (map == null) {
                    return;
                }
                this.map = map;
            }).catch((err) => {
                console.error(err);
            });
        }
        this.drawTheMap(this.state.googleMapsApi, this.props.forecast, this.props.routeInfo);
    }

}

module.exports=RouteForecastMap;
export default RouteForecastMap;