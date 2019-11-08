/*
let state = {
    controls:{
        metric:false,
        displayBanked,
        stravaAnalysis,
        /// separate data entered by user from data calculated by route update
        /// updating actual and predicted arrival times, and banked time, should not force a recalc
        /// only distance and duration should do that
        userControlPoints:[
            name:'here', distance:20, duration:15
        ],
        calculatedControlValues:[
            arrival:'Jan 13', actual:'Jan 14', banked:'11:05'
        ],
    },
    // input to fetch weather forecast, populated by loading route
    routeInfo:{
        rwgpsRouteData:
        gpxRouteData:
        timeZoneOffset:
        timeZoneId,
        bounds:{min_latitude:0, max_latitude:0, min_longitude:0, max_longitude:0},
        points:[
            {latitude:17.5, longitude:130.9}...
        ],
        forecastRequest:
        name:"This route",
        finishTime:"Thu, Jan 11 3:29pm",
        weatherCorrectionMinutes
    },
    // received from weather forecast, consumed by map and table rendering components
    forecast:{[
        [time, distance, summary, temperature_str, precipitation, cloudCover, windspeed,
        latitude, longitude, temperature_int, long_time, relative_bearing, rain, wind_bearing]
        ]
        forecastValid:false,
    },

    // entered by user, used to fetch route and request forecast
    ui_fields:[
        start,
        pace,
        interval,
        rwgpsRoute,
        rwgpsRouteIsTrip,
        fetchingRoute:false,
        fetchingForecast:false,
        errorDetails,
        errorSource,
        shortUrl,
        displayedFinishTime
    ],
    params:{
        action: '/forecast',
        maps_key:'dddsss333',
        timezone_key:'eee444333'
    },
    fetchAfterLoad:false,
    strava: {
        strava_token:null,
        strava_activity:null,
        strava_error,
        fetching,
        actualFinishTime:"Fri, Jan 12 3:29pm",
        actualPace: 18.5,
        stravaStreams:{}
    }
}*/

import * as Actions from '../actions/actions';
import {combineReducers} from 'redux';
import RouteInfoForm from "../routeInfoEntry";
// import Immutable from 'immutable';

export const finishTimeFormat = 'ddd, MMM DD YYYY h:mma';

const defaultPace = 'D';
const defaultIntervalInHours = 1;
const startHour = 7;
const defaultAnalysisIntervalInHours = 12;

const initialStartTime = function() {
    let now = new Date();
    if (now.getHours() > startHour) {
        now.setDate(now.getDate() + 1);
        now.setHours(startHour);
        now.setMinutes(0);
        now.setSeconds(0);
    }
    return now;
};

export const routeParams = function(state = {interval:defaultIntervalInHours,pace:defaultPace,rwgpsRoute:'',
    rwgpsRouteIsTrip:false, start:initialStartTime(), initialStart:initialStartTime()}, action) {
    switch (action.type) {
        case Actions.SET_RWGPS_ROUTE:
            if (action.route !== undefined) {
                let route = RouteInfoForm.getRouteNumberFromValue(action.route);
                return {
                    ...state,
                    rwgpsRoute: !isNaN(route) ? route : action.route,
                    loadingSource: null,
                    succeeded: null
                };
            }
            return state;
        case Actions.SET_START:
            if (action.start !== undefined && action.start !== null) {
                const start =  new Date(action.start);
                if (isNaN(start.getTime())) {
                    return state;
                } else {
                    return {...state, start: start};
                }
            } else {
                return state;
            }
        case Actions.SET_INITIAL_START:
            if (action.start !== undefined && action.start !== null) {
                const start =  new Date(action.start);
                if (isNaN(start.getTime())) {
                    return state;
                } else {
                    return {...state, start: start, initialStart: start};
                }
            } else {
                return state;
            }
        case Actions.SET_PACE:
            if (action.pace !== undefined) {
                return {...state, pace: action.pace};
            } else {
                return state;
            }
        case Actions.SET_INTERVAL:
            if (action.interval !== undefined) {
                return {...state, interval: parseFloat(action.interval)};
            } else {
                return state;
            }
        case Actions.TOGGLE_ROUTE_IS_TRIP:
            return {...status,rwgpsRouteIsTrip:!state.rwgpsRouteIsTrip}
        default:
            return state;
    }
};

const dialogParams = function(state = {errorDetails:null, succeeded:true, shortUrl:' ',
loadingSource:null,fetchingForecast:false,fetchingRoute:false}, action) {
    switch (action.type) {
        case Actions.CLEAR_ROUTE_DATA:
            return {...state, loadingSource: null, succeeded: null};
        case Actions.BEGIN_LOADING_ROUTE:
            return {...state, fetchingRoute: true, loadingSource: action.source};
        case Actions.BEGIN_FETCHING_FORECAST:
            return {...state, fetchingForecast: true};
        case Actions.FORECAST_FETCH_SUCCESS:
            return {...state, fetchingForecast: false, errorDetails: null};
        case Actions.FORECAST_FETCH_FAILURE:
            return {...state, fetchingForecast: false, errorDetails: typeof action.error === 'object' ? action.error.message : action.error};
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
        default:
            return state;
    }
};

const routeInfo = function(state = {finishTime:'',initialFinishTime:'',weatherCorrectionMinutes:null,
    forecastRequest:null,points:[], fetchAfterLoad:false,bounds:null,name:'',rwgpsRouteData:null,
    gpxRouteData:null, maxGustSpeed:0}, action) {
    switch (action.type) {
        case Actions.SET_TIME_ZONE:
            return {...state,timeZoneOffset:action.offset,timeZoneId:action.id};
        case Actions.RWGPS_ROUTE_LOADING_SUCCESS:
            return {...state,rwgpsRouteData:action.routeData,gpxRouteData:null};
        case Actions.GPX_ROUTE_LOADING_SUCCESS:
            return {...state,gpxRouteData:action.gpxRouteData,rwgpsRouteData:null};
        case Actions.SET_ROUTE_INFO:
            if (action.routeInfo===null) {
                return {...state,rwgpsRouteData:null,gpxRouteData:null,points:[],bounds:null,name:'',forecastRequest:null};
            }
            return {...state, points:action.routeInfo.points,name:action.routeInfo.name,bounds:action.routeInfo.bounds,
                finishTime:action.routeInfo.finishTime,initialFinishTime:action.routeInfo.finishTime,
                forecastRequest:action.routeInfo.forecastRequest};
        case Actions.CLEAR_ROUTE_DATA:
            return {...state,rwgpsRouteData:null,gpxRouteData:null,points:[],bounds:null,name:'',forecastRequest:null};
        // clear when the route is changed
        case Actions.SET_RWGPS_ROUTE:
            return {...state,rwgpsRouteData:null,gpxRouteData:null,points:[],bounds:null,name:'',forecastRequest:null,maxGustSpeed: 0};
        case Actions.ADD_WEATHER_CORRECTION:
            return {...state,weatherCorrectionMinutes:action.weatherCorrectionMinutes,finishTime:action.finishTime,maxGustSpeed:action.maxGustSpeed};
        case Actions.SET_FETCH_AFTER_LOAD:
            return {...state, fetchAfterLoad:action.fetchAfterLoad};
        default:
            return state;
    }
};

export const controls = function(state = {metric:false,displayBanked:false,stravaAnalysis:false,
    userControlPoints:[],calculatedControlValues:[],initialControlValues:[], count:0,displayedFinishTime:'',
    queryString:null}, action) {
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
        case Actions.TOGGLE_STRAVA_ANALYSIS:
            return {...state, stravaAnalysis: !state.stravaAnalysis};
        case Actions.UPDATE_USER_CONTROLS:
            return {...state, userControlPoints: action.controls, count: action.controls.length};
        case Actions.UPDATE_CALCULATED_VALUES:
            return {...state, calculatedControlValues: action.values};
        case Actions.UPDATE_ACTUAL_ARRIVAL_TIMES: {
            let calculatedValues = [];
            state.calculatedControlValues.forEach((item,index) => calculatedValues.push({...item, actual:action.arrivalTimes[index].time}));
            return {...state, calculatedControlValues:calculatedValues};
        }
        case Actions.SET_ROUTE_INFO:
            return {...state, calculatedControlValues: action.routeInfo.values,
                initialControlValues: action.routeInfo.values,
                displayedFinishTime:action.routeInfo.finishTime};
        case Actions.ADD_WEATHER_CORRECTION:
            return {...state,displayedFinishTime:action.finishTime};
        case Actions.ADD_CONTROL:
            return {...state, count:state.count+1};
        case Actions.SET_DISPLAYED_FINISH_TIME:
            return {...state, displayedFinishTime:action.displayedTime};
        case Actions.SET_QUERY:
            // here because it encodes the user entered controls
            return {...state, queryString:action.queryString};
        case Actions.CLEAR_QUERY:
            return {...state, queryString:null};
        case Actions.NEW_USER_MODE:
        {
            if (action.value === false) {
                return {...state,userControlPoints:[],count:0};
            }
            return state;
        }
        default:
            return state;
    }
};

const strava = function(state = {analysisInterval:defaultAnalysisIntervalInHours,activity:'',access_token:null,
    refresh_token:null, expires_at:null,
    fetching:false,activityData:null,calculatedPaces:null,errorDetails:null, subrange:[]},
                        action) {
    switch (action.type) {
        case Actions.SET_STRAVA_TOKEN:
            if (action.token !== undefined) {
                console.log(`Setting strava access token to ${action.token}`);
                return {...state, access_token:action.token, expires_at: action.expires_at};
            }
            else {return state;}
        case Actions.SET_STRAVA_REFRESH_TOKEN:
            if (action.refresh_token !== undefined) {
                return {...state, refresh_token: action.refresh_token};
            }
            else {return state;}
        case Actions.SET_STRAVA_ACTIVITY: {
            if (action.activity === undefined) {
                return state;
            }
            let newValue = RouteInfoForm.getRouteNumberFromValue(action.activity);
            return {...state, activity:!isNaN(newValue) ? newValue : action.activity,
                activityData:null, activityStream:null, calculatedPaces:null, subrange:[]};
        }
        case Actions.SET_STRAVA_ERROR:
            if (action.error !== undefined) {
                return {...state, error:action.error};
            } else {return state;}
        case Actions.SET_ACTUAL_FINISH_TIME:
            return {...state, actualFinishTime:action.finishTime};
        case Actions.SET_ACTUAL_PACE:
            return {...state, actualPace:action.pace};
        case Actions.BEGIN_STRAVA_FETCH:
            return {...state, fetching:true};
        case Actions.STRAVA_FETCH_SUCCESS:
            return {...state, fetching:false, activityData:action.data.activity, activityStream:action.data.stream};
        case Actions.STRAVA_FETCH_FAILURE:
            return {...state, fetching:false, access_token:null, errorDetails:typeof action.error === 'object' ? action.error.message : action.error};
        case Actions.SET_ANALYSIS_INTERVAL:
            return {...state, analysisInterval:parseInt(action.interval),subrange:[]};
        case Actions.SET_PACE_OVER_TIME:
            return {...state,calculatedPaces:action.calculatedPaces};
        case Actions.SUBRANGE_MAP:
            return {...state,subrange:
                [
                    parseFloat(action.start),
                    parseFloat(action.finish)
                ]
            };
        default:
            return state;
    }
};

const forecast = function(state = {forecast:[],valid:false,range:[], tableViewed:false, mapViewed:false}, action) {
    switch (action.type) {
        case Actions.FORECAST_FETCH_SUCCESS:
            return {...state,forecast:action.forecastInfo.forecast,valid:true,tableViewed:false,mapViewed:false,range:[]};
        case Actions.SET_RWGPS_ROUTE:
            return {...state,valid:false,tableViewed:false,mapViewed:false,range:[],forecast:[]};
        case Actions.GPX_ROUTE_LOADING_SUCCESS:
            return {...state,valid:false};
        case Actions.INVALIDATE_FORECAST:
            return {...state,valid:false, forecast:[]};
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
        default:
            return state;
    }
};

const params = function(state = {newUserMode:false}, action) {
    switch (action.type) {
        case Actions.SET_ACTION_URL:
            return {...state, action: action.action};
        case Actions.SET_API_KEYS:
            return {...state, maps_api_key: action.mapsKey, timezone_api_key:action.timezoneKey, bitly_token: action.bitlyToken};
        case Actions.NEW_USER_MODE:
            return {...state, newUserMode:action.value};
        default:
            return state;
    }
};

const appReducer = combineReducers({uiInfo:combineReducers({routeParams,dialogParams}),
    routeInfo, controls, strava, forecast, params});

const rootReducer = (state, action) => {
    if (action.type === 'RESET') {
        state = {params:state.params};
    }

    return appReducer(state, action)
};

export default rootReducer;
