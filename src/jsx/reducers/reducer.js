/*
let state = {
    controls:{
        metric:false,
        controlPoints: [
            {name:'here', distance:20, duration:15, arrival:'Jan 13', actual:'Jan 14', banked:'11:05'}
        ]
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
        name:"This route",
        finishTime:"Thu, Jan 11 3:29pm",
        weatherCorrectionMinutes
    },
    // received from weather forecast, consumed by map and table rendering components
    forecast:[
        [time, distance, summary, temperature_str, precipitation, cloudCover, windspeed,
        latitude, longitude, temperature_int, long_time, relative_bearing, rain, wind_bearing]
    ],
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
        errorSource
    ],
    params:{
        action: '/forecast',
        maps_key:'dddsss333',
        timezone_key:'eee444333'
    },
    forecastValid:false,
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

const defaultPace = 'D';
const defaultIntervalInHours = 1;
const startHour = 7;

function initialStartTime() {
    let now = new Date();
    if (now.getHours() > startHour) {
        now.setDate(now.getDate() + 1);
        now.setHours(startHour);
        now.setMinutes(0);
        now.setSeconds(0);
    }
    return now;
}

const uiInfo = function(state = {interval:defaultIntervalInHours,pace:defaultPace,rwgpsRoute:'',
    rwgpsRouteIsTrip:false, formVisible:true, errorDetails:null, start:initialStartTime(),
    succeeded:true}, action) {
    switch (action.type) {
        case Actions.SET_RWGPS_ROUTE:
            return {...state,rwgpsRoute:action.route,errorSource:'rwgps'};
        case Actions.SET_START:
            return {...state,start:action.start};
        case Actions.SET_PACE:
            return {...state,pace:action.pace};
        case Actions.SET_INTERVAL:
            return {...state,interval:action.interval};
        case Actions.BEGIN_LOADING_ROUTE:
            return {...state,fetchingRoute:true,errorSource:action.source};
        case Actions.BEGIN_FETCHING_FORECAST:
            return {...state,fetchingForecast:true};
        case Actions.FORECAST_FETCH_SUCCESS:
            return {...state,fetchingForecast:false,errorDetails:null,succeeded:true};
        case Actions.FORECAST_FETCH_FAILURE:
            return {...state,fetchingForecast:false,errorDetails:action.error,succeeded:false};
        case Actions.RWGPS_ROUTE_LOADING_SUCCESS:
            return {...state, fetchingRoute:false, errorDetails:null, succeeded:true};
        case Actions.GPX_ROUTE_LOADING_SUCCESS:
            return {...state, fetchingRoute:false, errorDetails:null, succeeded:true};
        case Actions.RWGPS_ROUTE_LOADING_FAILURE:
            return {...state, fetchingRoute:false, errorDetails:action.error, errorSource:'rwgps', rwgpsRoute:'', succeeded:false};
        case Actions.GPX_ROUTE_LOADING_FAILURE:
            return {...state, fetchingRoute:false, errorDetails:action.error, errorSource:'gpx', succeeded:false};
        case Actions.SHOW_FORM:
            return {...state, formVisible:true};
        case Actions.HIDE_FORM:
            return {...state,formVisible:false};
        case Actions.SET_ERROR_DETAILS:
            return {...state,errorDetails:action.details};
        default:
            return state;
    }
};

const routeInfo = function(state = {finishTime:'',weatherCorrectionMinutes:null}, action) {
    switch (action.type) {
        case Actions.RWGPS_ROUTE_LOADING_SUCCESS:
            return {...state,rwgpsRouteData:action.routeData.rwgpsRouteData,timeZoneOffset:action.routeData.timeZoneOffset,
                timeZoneId:action.routeData.timeZoneId, gpxRouteData:null};
        case Actions.GPX_ROUTE_LOADING_SUCCESS:
            return {...state,gpxRouteData:action.routeData.gpxRouteData,timeZoneOffset:action.routeData.timeZoneOffset,
                timeZoneId:action.routeData.timeZoneId, rwgpsRouteData:null};
        case Actions.SET_ROUTE_INFO:
            return {...state, ...action.routeInfo};
        case Actions.CLEAR_ROUTE_DATA:
            return {...state,rwgpsRouteData:null,gpxRouteData:null,points:null,name:''};
        // clear when the route is changed
        case Actions.SET_RWGPS_ROUTE:
            return {...state,rwgpsRouteData:null,gpxRouteData:null,points:null,name:''};
        case Actions.ADD_WEATHER_CORRECTION:
            return {...state,weatherCorrectionMinutes:action.weatherCorrectionMinutes,
                finishTime:moment(state.finishTime,'ddd, MMM DD h:mma').add(action.weatherCorrectionMinutes,'minutes').format('ddd, MMM DD h:mma')};
        default:
            return state;
    }
};

const controls = function(state = {metric:false,controlPoints:[]}, action) {
    switch (action.type) {
        case Actions.TOGGLE_METRIC:
            return {...state, metric:!state.metric};
        case Actions.UPDATE_CONTROLS:
            return {...state, controlPoints:action.controls};
        default:
            return state;
    }
};

const strava = function(state = {}, action) {
    switch (action.type) {
        case Actions.SET_STRAVA_TOKEN:
            return {...state, token:action.token};
        case Actions.SET_STRAVA_ACTIVITY:
            return {...state, activity:action.activity};
        case Actions.SET_STRAVA_ERROR:
            return {...state, error:action.error};
        case Actions.SET_ACTUAL_FINISH_TIME:
            return {...state, actualFinishTime:action.finishTime};
        default:
            return state;
    }
};

const forecast = function(state = [], action) {
    switch (action.type) {
        case Actions.FORECAST_FETCH_SUCCESS:
            return action.forecastInfo.forecast;
        default:
            return state;
    }
};

const params = function(state = {}, action) {
    switch (action.type) {
        case Actions.SET_ACTION_URL:
            return {...state, action: action.action};
        case Actions.SET_API_KEYS:
            return {...state, maps_api_key: action.maps_api_key, timezone_api_key:action.timezoneKey};
        default:
            return state;
    }
};

const rootReducer = combineReducers({uiInfo, routeInfo, controls, strava, forecast, params});

export default rootReducer;
