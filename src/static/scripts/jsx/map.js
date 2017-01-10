const React = require('react'),
    ReactDOM = require('react-dom');

class RouteForecastMap extends React.Component {

    constructor(props) {
        super(props);
        this.initMap = this.initMap.bind(this);
        this.state = {};
    }

    addMarker(latitude, longitude, map, value, title) {
    // Add the marker at the specified location
        var marker = new google.maps.Marker({
            position: {lat:latitude,lng:longitude},
            label: value,
            map: map,
            title: title
        });
    }

    drawRoute(points,map) {
        var routeLine = new google.maps.Polyline({
            path: points,
            geodesic: true,
            strokeColor: '#ff0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        routeLine.setMap(map);
    }

    static addMarkers(forecast) {
        if (forecast['forecast'] != null) {
            return (
                forecast['forecast'].map((point, index, data) =>
                    addMarker(point[6], point[7], map, point[8], point[9])
                )
            );
        }
    }

    initMap(min_lat,min_lon,max_lat,max_lon) {
        let mapDiv = document.getElementById('map');
        let map = new google.maps.Map(mapDiv, {
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        var southWest = { lat:min_lat, lng:min_lon };
        var northEast = { lat:max_lat, lng:max_lon };
        var bounds = new google.maps.LatLngBounds(southWest,northEast);
        map.fitBounds(bounds);
        RouteForecastMap.addMarkers(forecast);
        this.drawRoute(routePoints,map)
    };

    render() {
        return (
            <div id="map" style={{'height': '400px'}}>
                <h1>Forecast map</h1>
            </div>
        );
    }

    componentDidMount() {
        this.initMap(this.props.forecast['min_lat'],
            this.props.forecast['min_lon'],
            this.props.forecast['max_lat'],
            this.props.forecast['max_lon']
        );
    }
}

module.exports=RouteForecastMap;