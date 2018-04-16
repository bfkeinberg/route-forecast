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
        formVisible:true,
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
import moment from 'moment';
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

const routeParams = function(state = {interval:defaultIntervalInHours,pace:defaultPace,rwgpsRoute:'',
    rwgpsRouteIsTrip:false, start:initialStartTime()}, action) {
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
            if (action.start !== undefined) {
                return {...state, start: new Date(action.start)};
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

const dialogParams = function(state = {formVisible:true, errorDetails:null, succeeded:true, shortUrl:' ',
loadingSource:null,fetchingForecast:false}, action) {
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
        case Actions.SHOW_FORM:
            return {...state, formVisible: true};
        case Actions.HIDE_FORM:
            return {...state, formVisible: false};
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

const routeInfo = function(state = {finishTime:'',weatherCorrectionMinutes:null,forecastRequest:null,points:[],
fetchAfterLoad:false,bounds:null}, action) {
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
                finishTime:action.routeInfo.finishTime,forecastRequest:action.routeInfo.forecastRequest};
        case Actions.CLEAR_ROUTE_DATA:
            return {...state,rwgpsRouteData:null,gpxRouteData:null,points:[],bounds:null,name:'',forecastRequest:null};
        // clear when the route is changed
        case Actions.SET_RWGPS_ROUTE:
            return {...state,rwgpsRouteData:null,gpxRouteData:null,points:[],name:'',forecastRequest:null};
        case Actions.ADD_WEATHER_CORRECTION:
            return {...state,weatherCorrectionMinutes:action.weatherCorrectionMinutes,
                finishTime:moment(state.finishTime,finishTimeFormat).add(action.weatherCorrectionMinutes,'minutes').format(finishTimeFormat)};
        case Actions.SET_FETCH_AFTER_LOAD:
            return {...state, fetchAfterLoad:action.fetchAfterLoad};
        default:
            return state;
    }
};

const controls = function(state = {metric:false,displayBanked:false,stravaAnalysis:false,
    userControlPoints:[],calculatedControlValues:[],count:0,displayedFinishTime:'',queryString:null}, action) {
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
        case Actions.SET_ROUTE_INFO: {
            return {...state, calculatedControlValues: action.routeInfo.values,
                displayedFinishTime:action.routeInfo.finishTime};
        }
        case Actions.ADD_CONTROL:
            return {...state, count:state.count+1};
        case Actions.SET_DISPLAYED_FINISH_TIME:
            return {...state, displayedFinishTime:action.displayedTime};
        case Actions.SET_QUERY:
            // here because it encodes the user entered controls
            return {...state, queryString:action.queryString};
        case Actions.CLEAR_QUERY:
            return {...state, queryString:null};
        default:
            return state;
    }
};

const strava = function(state = {analysisInterval:defaultAnalysisIntervalInHours,activity:'',token:null,
    fetching:false,activityData:null,calculatedPaces:null,errorDetails:null, subrange:[]},
                        action) {
    switch (action.type) {
        case Actions.SET_STRAVA_TOKEN:
            if (action.token !== undefined) {
                return {...state, token:action.token};
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
            return {...state, fetching:false, errorDetails:typeof action.error === 'object' ? action.error.message : action.error};
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

const forecast = function(state = {forecast:[],valid:false,range:[]}, action) {
    switch (action.type) {
        case Actions.FORECAST_FETCH_SUCCESS:
            return {...state,forecast:action.forecastInfo.forecast,valid:true,range:[]};
        case Actions.SET_RWGPS_ROUTE:
            return {...state,valid:false,range:[],forecast:[]};
        case Actions.GPX_ROUTE_LOADING_SUCCESS:
            return {...state,valid:false};
        case Actions.GPX_ROUTE_LOADING_FAILURE:
            return {...state,valid:false};
        case Actions.SET_WEATHER_RANGE:
            return {...state,range:
                [
                    parseFloat(action.start),
                    parseFloat(action.finish)
                ]
            };
        default:
            return state;
    }
};

const params = function(state = {}, action) {
    switch (action.type) {
        case Actions.SET_ACTION_URL:
            return {...state, action: action.action};
        case Actions.SET_API_KEYS:
            return {...state, maps_api_key: action.mapsKey, timezone_api_key:action.timezoneKey};
        default:
            return state;
    }
};

const rootReducer = combineReducers({uiInfo:combineReducers({routeParams,dialogParams}),
    routeInfo, controls, strava, forecast, params});

export default rootReducer;
