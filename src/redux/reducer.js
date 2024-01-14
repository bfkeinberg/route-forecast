import * as Actions from './actions';
import {combineReducers} from 'redux';
import { DateTime } from 'luxon';
import { getRouteNumberFromValue, getRouteName } from '../utils/util';
import { routeLoadingModes } from '../data/enums';
import { createSlice } from '@reduxjs/toolkit'

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
    nws:{min_interval:1,max_days:7, canForecastPast:false, daysInPast:0, name:"National Weather Service", enabled:true},
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

const routeParamsSlice = createSlice({
    name: 'routeParams',
    initialState: {
        interval: defaultIntervalInHours,
        min_interval:providerValues.nws.min_interval,
        canForecastPast:providerValues.nws.canForecastPast,
        pace: defaultPace,
        rwgpsRoute: '',
        rwgpsRouteIsTrip: false,
        startTimestamp: initialStartTime().toMillis(),
        routeLoadingMode: routeLoadingModes.RWGPS,
        maxDaysInFuture: providerValues['weatherKit'].max_days,
        stopAfterLoad: false
    },
    reducers: {
        stopAfterLoadSet(state, action) {
            state.stopAfterLoad = action.payload
        },
        rwgpsRouteSet(state,action) {
            if (action.payload) {
                let route = getRouteNumberFromValue(action.payload);
                state.rwgpsRoute = !isNaN(route) ? route : action.payload
                state.loadingSource = null
                state.succeeded = null
            }
        },
        startTimeSet(state,action) {
            if (action.payload) {
                const start =  DateTime.fromMillis(action.payload)
                if (start.isValid) {
                    state.startTimestamp = checkedStartDate(start, state.canForecastPast).toMillis()
                    state.stopAfterLoad = false
                }
            }
        },
        initialStartTimeSet(state,action) {
            if (action.payload) {
                const start =  DateTime.fromISO(action.payload.start, {zone:!action.payload.zone?"local":action.payload.zone})
                if (start.isValid) {
                    state.startTimestamp = checkedStartDate(start, state.canForecastPast).toMillis()
                    state.stopAfterLoad = false
                }
            }
        },
        startTimestampSet(state,action) {
            if (action.payload) {
                const start = DateTime.fromSeconds(parseInt(action.payload.start), {zone:action.payload.zone===undefined?"local":action.payload.zone})
                if (start.isValid) {
                    state.startTimestamp = checkedStartDate(start, state.canForecastPast).toMillis()
                }
            }
        },
        paceSet(state,action) {
            if (action.payload) {
                state.pace = action.payload
                state.stopAfterLoad = false
            }
        },
        intervalSet(state,action) {
            if (action.payload) {
                // protect against garbage in url
                const interval = parseFloat(action.payload);
                if (!isNaN(interval) && interval >= 0.25 && interval <= 2.0) {
                    state.interval = interval
                    state.stopAfterLoad = false
                }
            }
        },
        routeIsTripSet(state,action) {
            state.rwgpsRouteIsTrip = action.payload
        },
        routeLoadingModeSet(state,action) {
            state.routeLoadingMode = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase('forecast/weatherProviderSet', (state,action) => {
                state.interval = Math.max(state.interval, providerValues[action.payload].min_interval)
                state.min_interval = providerValues[action.payload].min_interval
                state.maxDaysInFuture = providerValues[action.payload].max_days
                state.canForecastPast = providerValues[action.payload].canForecastPast
                state.startTimestamp = checkedStartDate(DateTime.fromMillis(state.startTimestamp), providerValues[action.payload].canForecastPast).toMillis()
        })
    }
})

export const routeParamsReducer = routeParamsSlice.reducer
export const {rwgpsRouteSet,startTimeSet,initialStartTimeSet,
        startTimestampSet,paceSet,intervalSet,routeIsTripToggled,routeIsTripSet,routeLoadingModeSet} = routeParamsSlice.actions


const rideWithGpsInfoSlice = createSlice({
    name: 'rideWithGpsInfo',
    initialState: {
        pinnedRoutes: [], token: null, usePinnedRoutes: false, loadingRoutes: false
    },
    reducers: {
        rwgpsTokenSet(state, action) {
            state.token = action.payload
        },
        pinnedRoutesSet(state, action) {
            state.pinnedRoutes = action.payload
        },
        loadingPinnedSet(state, action) {
            state.loadingRoutes = action.payload
        },
        usePinnedRoutesSet(state, action) {
            state.usePinnedRoutes = action.payload
        }
    }
})

export const {rwgpsTokenSet,pinnedRoutesSet,loadingPinnedSet,usePinnedRoutesSet} = rideWithGpsInfoSlice.actions

const routeInfoSlice = createSlice({
    name:'routeInfo',
    initialState:{
        name: '',
        rwgpsRouteData: null,
        gpxRouteData: null,
        loadingFromURL: false
    },
    reducers:{
        rwgpsRouteLoaded(state, action) {
            state.rwgpsRouteData = action.payload
            state.gpxRouteData = null
            state.name = getRouteName(action.payload, "rwgps")
        },
        gpxRouteLoaded(state, action) {
            state.gpxRouteData = action.payload
            state.rwgpsRouteData = null
            state.name = getRouteName(action.gpxRouteData, "gpx")
        },
        routeDataCleared(state) {
            state.rwgpsRouteData = null
            state.gpxRouteData = null
            state.name = ''
        },
        loadingFromUrlSet(state, action) {
            state.loadingFromURL = action.payload
        }
    },
    extraReducers: (builder) => {
        builder.addCase(rwgpsRouteSet, (state) => {
            state.rwgpsRouteData = null
            state.gpxRouteData = null
            state.name = ''
    })
    }
})

export const routeInfoReducer = routeInfoSlice.reducer
export const {rwgpsRouteLoaded, gpxRouteLoaded, routeDataCleared,loadingFromUrlSet} = routeInfoSlice.actions

const dialogParamsSlice = createSlice({
    name: 'dialogParams',
    initialState: {
        errorDetails: null, succeeded: true, shortUrl: ' ',
        loadingSource: null, fetchingForecast: false, fetchingRoute: false
    },
    reducers: {
        routeLoadingBegun(state, action) {
            state.loadingSource = action.payload
            state.fetchingRoute = true
        },
        forecastFetchBegun(state) {
            state.fetchingForecast = true
        },
        forecastFetchFailed(state, action) {
            state.fetchingForecast = false
            state.errorDetails = typeof action.payload === 'object' ? action.payload.message : action.payload
        },
        forecastFetchCanceled(state) {
            state.fetchingForecast = false
        },
        rwgpsRouteLoadingFailed(state, action) {
            state.fetchingRoute = false
            state.errorDetails = (typeof action.payload === 'object' ? action.payload.message : action.payload)
            state.succeeded = false
        },
        gpxRouteLoadingFailed(state, action) {
            state.fetchingRoute = false
            state.errorDetails = (typeof action.payload === 'object' ? action.payload.message : action.payload)
            state.succeeded = false
        },
        errorDetailsSet(state, action) {
            if (action.payload instanceof Error) {
                state.errorDetails = action.payload.toString()
            } else {
                state.errorDetails = action.payload
            }
        },
        shortUrlSet(state, action) {
            state.shortUrl = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(pinnedRoutesSet, (state) => {
                state.errorDetails = null
            })
            .addCase(Actions.STRAVA_FETCH_SUCCESS, (state) => {
                state.errorDetails = null
            })
            .addCase(Actions.SET_STRAVA_ERROR, (state, action) => {
                if (action.payload !== undefined) {
                    state.errorDetails = `Error loading route from Strava: ${action.payload}`
                }
            })
            .addCase(Actions.STRAVA_FETCH_FAILURE, (state, action) => {
                const errorMessage = typeof action.error === 'object' ? action.error.message : action.error
                state.errorDetails = `Error loading activity from Strava: ${errorMessage}`
            })
            .addCase(rwgpsRouteLoaded, (state) => {
                state.fetchingRoute = false
                state.errorDetails = null
                state.succeeded = true
            })
            .addCase(gpxRouteLoaded, (state) => {
                state.fetchingRoute = false
                state.errorDetails = null
                state.succeeded = true
            })
            .addCase('forecast/forecastFetched', (state) => {
                state.fetchingForecast = false
                state.errorDetails = null
            })
    }
})

export const dialogParamsReducer = dialogParamsSlice.reducer
export const {routeLoadingBegun,forecastFetchBegun,
    forecastFetchFailed,forecastFetchCanceled,rwgpsRouteLoadingFailed,
    gpxRouteLoadingFailed,errorDetailsSet,shortUrlSet} = dialogParamsSlice.actions

const controlsSlice = createSlice({
    name:'controls',
    initialState:{metric: false,
        displayBanked: false,
        userControlPoints: [],
        showWeatherProvider: false,
        displayControlTableUI: false},
    reducers:{
        metricSet(state, action) {
            if (action.payload !== undefined) {
                state.metric = action.payload
            }
        },
        metricToggled(state) {
            state.metric = !state.metric
        },
        bankedDisplayToggled(state) {
            state.displayBanked = !state.displayBanked
        },
        userControlsUpdated(state,action) {
            state.userControlPoints = action.payload
        },
        showWeatherProviderSet(state,action) {
            state.showWeatherProvider = action.payload
        },
        displayControlTableUiSet(state,action) {
            state.displayControlTableUI = action.payload
        }
    },
    extraReducers:(builder) => {
        builder.addCase(rwgpsRouteSet, (state) => {
                state.userControlPoints = []
        }
        )
    }
})

export const { metricSet, metricToggled, bankedDisplayToggled, userControlsUpdated, showWeatherProviderSet, displayControlTableUiSet} = controlsSlice.actions
export const controlsReducer = controlsSlice.reducer

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

const forecastSlice = createSlice({
    name:'forecast',
    initialState:{
        forecast: [],
        timeZoneId: null,
        valid: false,
        range: [],
        tableViewed: false,
        mapViewed: false,
        weatherProvider: 'nws',
        zoomToRange: true,
        fetchAqi:false
    },
    reducers: {
        forecastFetched(state, action) {
            state.forecast = action.payload.forecastInfo.forecast
            state.timeZoneId = action.payload.timeZoneId
            state.valid = true
            state.tableViewed = false
            state.mapViewed = false
            state.range = []
        },
        forecastInvalidated(state) {
            state.valid = false
            state.forecast = []
            state.timeZoneId = null
            state.range = []
        },
        weatherRangeSet(state, action) {
            state.range = [
                parseFloat(action.payload.start),
                parseFloat(action.payload.finish)
            ]
        },
        weatherRangeToggled(state,action) {
            if (state.range[0] === parseFloat(action.payload.start) && state.range[1] === parseFloat(action.payload.finish)) {
                state.range = []
            } else {
                state.range = [
                    parseFloat(action.payload.start),
                    parseFloat(action.payload.finish)
                ]
            }
        },
        tableViewedSet(state) {
            state.tableViewed = true
        },
        mapViewedSet(state) {
            state.mapViewed = true
        },
        weatherProviderSet(state,action) {
            state.weatherProvider = action.payload
        },
        zoomToRangeSet(state,action) {
            state.zoomToRange = action.payload
        },
        zoomToRangeToggled(state) {
            state.zoomToRange = !state.zoomToRange
        },
        fetchAqiSet(state,action) {
            state.fetchAqi = action.payload
        },
        fetchAqiToggled(state) {
            state.fetchAqi = !state.fetchAqi
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(rwgpsRouteSet, (state) => {
                state.valid = false
                state.tableViewed = false
                state.mapViewed = false
                state.range = []
                state.forecast = []
            })
            .addCase(gpxRouteLoaded, (state) => {
                state.valid = false
            })
            .addCase(gpxRouteLoadingFailed, (state) => {
                state.valid = false
            })
    }
})

const forecastReducer = forecastSlice.reducer
export const {forecastFetched,forecastInvalidated,weatherRangeSet,weatherRangeToggled,
    tableViewedSet,mapViewedSet,weatherProviderSet,zoomToRangeSet,zoomToRangeToggled,fetchAqiSet,fetchAqiToggled} = forecastSlice.actions
/*const forecast = function(state = {
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
        case Actions.SET_ADJUSTED_FORECAST_TIME:
            if (state.forecast.length > action.index) {
                let forecastArray = state.forecast.slice(0)
                let forecast = Object.assign({}, state.forecast[action.index])
                forecast.adjustedTime = action.value
                forecastArray[action.index] = forecast
                return {...state, forecastArray}
            }
            return {...state}
        default:
            return state;
    }
};*/

const paramsSlice = createSlice({
    name:'params',
    initialState:{},
    reducers:{
        actionUrlAdded(state, action) {
            const url = action.payload
            state.action = url
        },
        apiKeysSet(state, action) {
            state.maps_api_key= action.payload.maps_api_key
            state.timezone_api_key = action.payload.timezone_api_key
            state.bitly_token = action.payload.bitly_token
        },
        querySet(state, action) {
            const query = action.payload.url
            state.queryString = query
            state.searchString = action.payload.search
        },
        queryCleared(state) {
            state.queryString = null
        }
    }
})

export const paramsReducer = paramsSlice.reducer

export const rwgpsInfoReducer = rideWithGpsInfoSlice.reducer

const appReducer = combineReducers({uiInfo:combineReducers({routeParams:routeParamsReducer,dialogParams:dialogParamsReducer}),
    routeInfo:routeInfoReducer, controls:controlsReducer, strava, forecast:forecastReducer, params:paramsReducer, rideWithGpsInfo:rwgpsInfoReducer});

const rootReducer = (state, action) => {
    if (action.type === 'RESET') {
        console.info('reset happened')
        state = {params:state.params};
    }

    return appReducer(state, action)
};

export const {actionUrlAdded, apiKeysSet, querySet, queryCleared} = paramsSlice.actions
export default rootReducer;
