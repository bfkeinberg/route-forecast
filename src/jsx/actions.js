export const SET_RWGPS_ROUTE = 'SET_RWGPS_ROUTE';
export function setRwgpsRoute(route) {
    return {
        type: SET_RWGPS_ROUTE,
        route: route
    }
}

export const SET_GPX_ROUTE = 'SET_GPX_ROUTE';
export function setGpxRoute(route) {
    return {
        type: SET_GPX_ROUTE,
        route: route
    }
}

const loadFromRideWithGps = function(routeNumber, isTrip, timezone_api_key) {
    if (this.parser === undefined) {
        this.getRouteParser().then( RwgpsParser => {
            this.parser = new RwgpsParser(this.setErrorState, this.props['timezone_api_key']);
            this.parser.loadRwgpsRoute(routeNumber, isTrip, timezone_api_key).then( () => {
                    this.calculateTimeAndDistance(this.props);
                    this.setErrorState(null,'rwgps');
                    if (this.fetchAfterLoad) {
                        this.requestForecast();
                        this.fetchAfterLoad = false;
                    }
                }, error => {this.setErrorState(error.message,'rwgps');}
            );
        });
    } else {
        this.parser.loadRwgpsRoute(routeNumber, isTrip, timezone_api_key).then( () => {
                this.calculateTimeAndDistance(this.props);
                this.setErrorState(null,'rwgps');
                if (this.fetchAfterLoad) {
                    this.requestForecast();
                    this.fetchAfterLoad = false;
                }
            }, error => {this.setErrorState(error.message,'rwgps');}
        );
    }
}

export const BEGIN_LOADING_ROUTE = 'BEGIN_LOADING_ROUTE';
function beginLoadingRoute() {
    return {
        type: BEGIN_LOADING_ROUTE
    }
}

export const ROAD_LOADING_SUCCESS = 'ROUTE_LOADING_SUCCESS';
function routeLoadingSuccess(routeData) {
    return {
        type: ROAD_LOADING_SUCCESS,
        routeData : routeData
    }
}
export const ROAD_LOADING_FAILURE = 'ROUTE_LOADING_FAILURE';
function routeLoadingFailure(status) {
    return {
        type: ROAD_LOADING_FAILURE,
        status: status
    }
}

export const LOAD_ROUTE_PARSER = 'LOAD_ROUTE_PARSER';
export function loadRouteParser() {
    return function(dispatch) {
        const parser = import(/* webpackChunkName: "RwgpsParser" */ './gpxParser');
        return parser.default;
    }
}
export const LOAD_RWGPS_ROUTE = 'LOAD_RWGPS_ROUTE';
export function loadRwgpsRoute(routeNumber) {

}

export const LOAD_GPX_ROUTE = 'LOAD_GPX_ROUTE';

export const REQUEST_FORECAST = 'REQUEST_FORECAST';
export function requestForecast(routeInfo) {

}

export const SHORTEN_URL = 'SHORTEN_URL';

export const SET_ADDRESS = 'SET_ADDRESS';
export function setAddress(address) {
    return {
        type: SET_ADDRESS,
        address: address
    }
}
export const CLEAR_ADDRESS = 'CLEAR_ADDRESS';
export function clearAddress() {
    return {
        type: CLEAR_ADDRESS,
    }
}
export const UPDATE_CONTROLS = 'UPDATE_CONTROLS';

export function updateControls(controls) {
    return {
        type: UPDATE_CONTROLS,
        controls: controls
    }
}