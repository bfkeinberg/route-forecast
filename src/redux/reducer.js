import * as Actions from './actions';
import {combineReducers} from 'redux';
import { DateTime } from 'luxon';
import { getRouteNumberFromValue } from '../jsx/RouteInfoForm/RideWithGpsId';
import { routeLoadingModes } from '../data/enums';
import { getRouteName } from '../utils/util';

export const finishTimeFormat = 'EEE, MMM dd yyyy h:mma';

const defaultPace = 'D';
const defaultIntervalInHours = 1;
const startHour = 7;
const defaultAnalysisIntervalInHours = 1;

const initialStartTime = function() {
    let now = DateTime.now();
    if (now.hour > startHour) {
        now = now.set({day:now.day+1, hour:startHour, minutes:0, seconds:0});
    }
    return now;
};

export const providerValues = {
    // darksky:{min_interval:0.25,max_days:14, canForecastPast:true, name:"Dark Sky"},
    climacell:{min_interval:0.25,max_days:4, canForecastPast:false, daysInPast:1, name:"Tomorrow.io", maxCallsPerHour:25, enabled:true},
    weatherapi:{min_interval:1,max_days:10, canForecastPast:false, daysInPast:4, name:"WeatherAPI", enabled:true},
    visualcrossing:{min_interval:0.25,max_days:14, canForecastPast:true, daysInPast:4, name:"Visual Crossing", enabled:true},
    nws:{min_interval:1,max_days:7, canForecastPast:false, daysInPast:0, name:"National Weather Service", enabled:false},
    // meteomatics:{min_interval:1,max_days:10,canForecastPast:true, daysInPast:1, name:"Meteomatics"}
    weatherKit:{min_interval:1,max_days:14, canForecastPast:true, name:"Apple WeatherKit", enabled:true},
    };

    const checkedStartDate = (startDate, canForecastPast) => {
        if (canForecastPast) return startDate;
        const now = DateTime.now();
        if (startDate < now) {
            return startDate.set({year:now.year, month:now.month, day:now.day}).plus({days:1});
        }
        return startDate;
    }

// eslint-disable-next-line complexity
export const routeParams = function(state = {
    interval: defaultIntervalInHours,
    min_interval:providerValues.nws.min_interval,
    canForecastPast:providerValues.nws.canForecastPast,
    pace: defaultPace,
    rwgpsRoute: '',
    rwgpsRouteIsTrip: false,
    start: initialStartTime(),
    initialStart: initialStartTime(),
    routeLoadingMode: routeLoadingModes.RWGPS,
    maxDaysInFuture: providerValues['nws'].max_days,
    stopAfterLoad: false
}, action) {
    switch (action.type) {
        case Actions.SET_STOP_AFTER_LOAD:
            return { ...state, stopAfterLoad: action.value === "true" };
        case Actions.SET_WEATHER_PROVIDER:
            return {
                ...state, interval: Math.max(state.interval, providerValues[action.weatherProvider].min_interval),
                min_interval: providerValues[action.weatherProvider].min_interval,
                maxDaysInFuture: providerValues[action.weatherProvider].max_days,
                canForecastPast: providerValues[action.weatherProvider].canForecastPast,
                start: checkedStartDate(state.start, providerValues[action.weatherProvider].canForecastPast)
            }
        case Actions.SET_RWGPS_ROUTE:
            if (action.route !== undefined) {
                let route = getRouteNumberFromValue(action.route);
                return {
                    ...state,
                    rwgpsRoute: !isNaN(route) ? route : action.route,
                    loadingSource: null,
                    succeeded: null
                };
            }
            return state;
        case Actions.SET_START_TIME:
            if (action.start !== undefined && action.start !== null) {
                const start =  DateTime.fromISO(action.start);
                if (!start.isValid) {
                    return state;
                } else {
                    return {...state, start: checkedStartDate(start, state.canForecastPast), stopAfterLoad: false};
                }
            } else {
                return state;
            }
        case Actions.SET_INITIAL_START:
            if (action.start !== undefined && action.start !== null) {
                const start = DateTime.fromISO(action.start, {zone:action.zone===undefined?"local":action.zone});
                if (!start.isValid) {
                    return state;
                } else {
                    return {...state, start: checkedStartDate(start, state.canForecastPast), initialStart: checkedStartDate(start, state.canForecastPast)};
                }
            } else {
                return state;
            }
        case Actions.SET_START_TIMESTAMP:
            if (action.start !== undefined && action.start !== null) {
                const start = DateTime.fromSeconds(action.start, {zone:action.zone===undefined?"local":action.zone});
                if (!start.isValid) {
                    return state;
                } else {
                    return {...state, start: checkedStartDate(start, state.canForecastPast), initialStart: checkedStartDate(start, state.canForecastPast)};
                }
            } else {
                return state;
            }
        case Actions.SET_PACE:
            if (action.pace !== undefined) {
                return {...state, pace: action.pace, stopAfterLoad: false};
            } else {
                return state;
            }
        case Actions.SET_INTERVAL:
            if (action.interval !== undefined) {
                // protect against garbage in url
                const interval = parseFloat(action.interval);
                if (isNaN(interval) || interval < 0.25 || interval > 2.0) return state;
                return {...state, interval: interval, stopAfterLoad: false};
            } else {
                return state;
            }
        case Actions.TOGGLE_ROUTE_IS_TRIP:
            return {...state,rwgpsRouteIsTrip:!state.rwgpsRouteIsTrip}
        case Actions.SET_ROUTE_IS_TRIP:
            return {...state,rwgpsRouteIsTrip:action.isTrip}
        case Actions.BEGIN_FETCHING_FORECAST:
            // TODO
            // suspect this is vestigial
            return {...state,initialStart:state.start}
        case Actions.SET_ROUTE_LOADING_MODE:
            return {...state, routeLoadingMode: action.newMode};
        default:
            return state;
    }
};

// eslint-disable-next-line complexity
const dialogParams = function(state = {errorDetails:null, succeeded:true, shortUrl:' ',
loadingSource:null,fetchingForecast:false,fetchingRoute:false, cancelActiveFetchMethod: null}, action) {
    switch (action.type) {
        case Actions.CLEAR_ROUTE_DATA:
            return {...state, loadingSource: null, succeeded: null};
        case Actions.BEGIN_LOADING_ROUTE:
            return {...state, fetchingRoute: true, loadingSource: action.source};
        case Actions.BEGIN_FETCHING_FORECAST:
            return {...state, fetchingForecast: true, cancelActiveFetchMethod: action.abortMethod};
        case Actions.FORECAST_FETCH_SUCCESS:
            return {...state, fetchingForecast: false, cancelActiveFetchMethod: null, errorDetails: null};
        case Actions.FORECAST_FETCH_FAILURE:
            return {...state, fetchingForecast: false, cancelActiveFetchMethod: null, errorDetails: typeof action.error === 'object' ? action.error.message : action.error};
        case Actions.FORECAST_FETCH_CANCELED:
            return {...state, fetchingForecast: false, cancelActiveFetchMethod: null}
        case Actions.INVALIDATE_FORECAST:
            return { ...state, cancelActiveFetchMethod: null };
        case Actions.RWGPS_ROUTE_LOADING_SUCCESS:
            return {...state, fetchingRoute: false, errorDetails: null, succeeded: true};
        case Actions.GPX_ROUTE_LOADING_SUCCESS:
            return {...state, fetchingRoute: false, errorDetails: null, succeeded: true};
        case Actions.RWGPS_ROUTE_LOADING_FAILURE:
            return {...state, fetchingRoute: false, rwgpsRoute: '', succeeded: false,
                errorDetails: (typeof action.status === 'object' ? action.status.message : action.status)};
        case Actions.GPX_ROUTE_LOADING_FAILURE:
            return {...state, fetchingRoute: false, succeeded: false,
                errorDetails: (typeof action.status === 'object' ? action.status.message : action.status)};
        case Actions.SET_ERROR_DETAILS:
            if (action.details instanceof Error) {
                return {...state, errorDetails: action.details.toString()};
            }
            return {...state, errorDetails: action.details};
        case Actions.SET_SHORT_URL:
            return {...state, shortUrl: action.url};
        case Actions.SET_PINNED_ROUTES:
            return {...state, errorDetails: null};
        case Actions.STRAVA_FETCH_SUCCESS:
            return {...state, errorDetails: null};
        case Actions.STRAVA_FETCH_FAILURE: {
            const errorMessage = typeof action.error === 'object' ? action.error.message : action.error
            return {...state, errorDetails: `Error loading route from Strava: ${errorMessage}`};
        }
        case Actions.SET_STRAVA_ERROR:
            if (action.error !== undefined) {
                return { ...state, errorDetails:  `Error loading route from Strava: ${action.error}` };
            } else {
                return state;
            }
        default:
            return state;
    }
};
const routeInfo = function(state = {
    name: '',
    rwgpsRouteData: null,
    gpxRouteData: null,
    loadingFromURL: false
    }, action) {
    switch (action.type) {
        case Actions.RWGPS_ROUTE_LOADING_SUCCESS:
            return { ...state, rwgpsRouteData: action.routeData, gpxRouteData: null, name: getRouteName(action.routeData, "rwgps") };
        case Actions.GPX_ROUTE_LOADING_SUCCESS:
            return { ...state, gpxRouteData: action.gpxRouteData, rwgpsRouteData: null, name: getRouteName(action.gpxRouteData, "gpx") };
        case Actions.CLEAR_ROUTE_DATA:
            return {...state,rwgpsRouteData:null,gpxRouteData:null,name:''};
        // clear when the route is changed
        case Actions.SET_RWGPS_ROUTE:
            return {...state,rwgpsRouteData:null,gpxRouteData:null,name:''};
        case Actions.SET_LOADING_FROM_URL:
            return {...state, loadingFromURL: action.loading};
        default:
            return state;
    }
};

export const controls = function (state = {
    metric: false,
    displayBanked: false,
    userControlPoints: [],
    showWeatherProvider: false,
    displayControlTableUI: false,
    }, action) {
    switch (action.type) {
        case Actions.SET_METRIC:
            if (action.metric !== undefined) {
                return {...state, metric: action.metric};
            } else {
                return state;
            }
        case Actions.TOGGLE_METRIC:
            return {...state, metric: !state.metric};
        case Actions.TOGGLE_DISPLAY_BANKED:
            return {...state, displayBanked: !state.displayBanked};
        case Actions.UPDATE_USER_CONTROLS:
            return {...state, userControlPoints: action.controls};
        case Actions.SET_SHOW_WEATHER_PROVIDER:
            return {...state, showWeatherProvider:action.showProvider};
        case Actions.SET_DISPLAY_CONTROL_TABLE_UI:
            return {...state, displayControlTableUI:action.displayControlTableUI};
        case Actions.SET_RWGPS_ROUTE:
            return {...state, userControlPoints:[]}
        default:
            return state;
    }
};

const getAnalysisIntervalFromRouteDuration = (durationInHours) => {
    if (durationInHours > 72) {
        return 24;
    }
    else if (durationInHours > 59) {
        return 12;
    }
    else if (durationInHours > 39) {
        return 8;
    }
    else if (durationInHours > 29) {
        return 6;
    }
    else if (durationInHours > 19) {
        return 4;
    }
    else if (durationInHours > 11)  {
        return 2;
    }
    else {
        return 1;
    }
};

const strava = function (state = {
        analysisInterval: defaultAnalysisIntervalInHours,
        activity: '',
        access_token: null,
        refresh_token: null,
        expires_at: null,
        fetching: false,
        activityData: null,
        activityStream: null,
        subrange:[]
    }, action) {
    let setNewActivity = function () {
        if (action.activity === undefined) {
            return state;
        }
        let newValue = getRouteNumberFromValue(action.activity);
        return {
            ...state, activity: !isNaN(newValue) ? newValue : action.activity,
            activityData: null, activityStream: null, subrange: []
        };
    };
    let toggleMapRange = function () {
        if (state.subrange[0] === parseFloat(action.start) && state.subrange[1] === parseFloat(action.finish)) {
            return {
                ...state,
                subrange: []
            }
        }
        return {
            ...state, subrange:
                [
                    parseFloat(action.start),
                    parseFloat(action.finish)
                ]
        };
    };
    switch (action.type) {
        case Actions.SET_STRAVA_TOKEN:
            if (action.token !== undefined) {
                return {...state, access_token:action.token, expires_at: action.expires_at};
            }
            else {return state;}
        case Actions.SET_STRAVA_REFRESH_TOKEN:
            if (action.refresh_token !== undefined) {
                return {...state, refresh_token: action.refresh_token};
            }
            else {return state;}
        case Actions.SET_STRAVA_ACTIVITY: {
            return setNewActivity();
        }
        case Actions.BEGIN_STRAVA_FETCH:
            return {...state, fetching:true};
        case Actions.STRAVA_FETCH_SUCCESS:
            return {...state, fetching: false, activityData: action.data.activity, activityStream: action.data.stream,
                analysisInterval:getAnalysisIntervalFromRouteDuration(action.data.activity.elapsed_time/3600)};
        case Actions.STRAVA_FETCH_FAILURE: {
            const errorMessage = typeof action.error === 'object' ? action.error.message : action.error
            return {...state, fetching: false, access_token: errorMessage === "Authorization Error" ? null : state.access_token};
        }
        case Actions.SET_ANALYSIS_INTERVAL:
            return {...state, analysisInterval:parseFloat(action.interval),subrange:[]};
        case Actions.SUBRANGE_MAP:
            return {...state,subrange:
                [
                    parseFloat(action.start),
                    parseFloat(action.finish)
                ]
            };
        case Actions.TOGGLE_MAP_RANGE:
            return toggleMapRange();
        default:
            return state;
    }
};

const forecast = function(state = {
    forecast: [],
    timeZoneId: null,
    valid: false,
    range: [],
    tableViewed: false,
    mapViewed: false,
    weatherProvider: 'nws',
    zoomToRange: true,
    fetchAqi:false
}, action) {
    switch (action.type) {
        case Actions.FORECAST_FETCH_SUCCESS:
            return {...state,forecast:action.forecastInfo.forecast, timeZoneId: action.timeZoneId, valid:true,tableViewed:false,mapViewed:false,range:[]};
        case Actions.SET_RWGPS_ROUTE:
            return {...state,valid:false,tableViewed:false,mapViewed:false,range:[],forecast:[]};
        case Actions.GPX_ROUTE_LOADING_SUCCESS:
            return {...state,valid:false};
        case Actions.INVALIDATE_FORECAST:
            return { ...state, valid: false, forecast: [], timeZoneId: null, range: [] };
        case Actions.GPX_ROUTE_LOADING_FAILURE:
            return {...state,valid:false};
        case Actions.SET_WEATHER_RANGE:
            return {...state,range:
                [
                    parseFloat(action.start),
                    parseFloat(action.finish)
                ]
            };
        case Actions.TOGGLE_WEATHER_RANGE:
                if (state.range[0] === parseFloat(action.start) && state.range[1] === parseFloat(action.finish)) {
                    return {
                        ...state,
                        range: []
                    }
                }
                return {...state, range:
                    [
                        parseFloat(action.start),
                        parseFloat(action.finish)
                    ]
                };
        case Actions.SET_TABLE_VIEWED:
            return {...state, tableViewed: true};
        case Actions.SET_MAP_VIEWED:
            return {...state, mapViewed: true};
        case Actions.SET_WEATHER_PROVIDER:
            return {...state, weatherProvider:action.weatherProvider}
        case Actions.TOGGLE_ZOOM_TO_RANGE:
            return {...state, zoomToRange:!state.zoomToRange}
        case Actions.SET_ZOOM_TO_RANGE:
            return {...state, zoomToRange:action.zoom}
        case Actions.TOGGLE_FETCH_AQI:
            return {...state, fetchAqi:!state.fetchAqi}
        case Actions.SET_FETCH_AQI:
            return {...state, fetchAqi:action.fetchAqi}
        default:
            return state;
    }
};

const params = function (state = {queryString: null}, action) {
    switch (action.type) {
        case Actions.SET_ACTION_URL:
            return { ...state, action: action.action };
        case Actions.SET_API_KEYS:
            return { ...state, maps_api_key: action.mapsKey, timezone_api_key: action.timezoneKey, bitly_token: action.bitlyToken };
        case Actions.SET_QUERY:
            // here because it encodes the user entered controls
            return { ...state, queryString: action.queryString };
        case Actions.CLEAR_QUERY:
            return { ...state, queryString: null };
        default:
            return state;
    }
};

const rideWithGpsInfo = function(state = {pinnedRoutes:[], token:null, usePinnedRoutes:false, loadingRoutes:false}, action) {
    switch (action.type) {
        case Actions.SET_RWGPS_TOKEN:
            return {...state, token:action.token};
        case Actions.SET_PINNED_ROUTES:
            return {...state, pinnedRoutes:action.pinned};
        case Actions.SET_LOADING_PINNED:
            return {...state, loadingRoutes:action.loading};
        case Actions.SET_USE_PINNED_ROUTES:
            return {...state, usePinnedRoutes:action.value}
        default:
            return state;
    }
};

const appReducer = combineReducers({uiInfo:combineReducers({routeParams,dialogParams}),
    routeInfo, controls, strava, forecast, params, rideWithGpsInfo});

const rootReducer = (state, action) => {
    if (action.type === 'RESET') {
        state = {params:state.params};
    }

    return appReducer(state, action)
};

export default rootReducer;
