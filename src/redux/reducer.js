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

const routeParamsInitialState = {
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
}
const routeParamsSlice = createSlice({
    name: 'routeParams',
    initialState: routeParamsInitialState,
    reducers: {
        stopAfterLoadSet(state, action) {
            state.stopAfterLoad = action.payload === "true"
        },
        rwgpsRouteSet(state,action) {
            if (action.payload) {
                let route = getRouteNumberFromValue(action.payload);
                state.rwgpsRoute = route
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
        },
        reset(state) {
            // eslint-disable-next-line array-element-newline
            for (const [key, value] of Object.entries(routeParamsInitialState)) {
                state[key] = value
            }
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
export const {stopAfterLoadSet,rwgpsRouteSet,startTimeSet,initialStartTimeSet,
        startTimestampSet,paceSet,intervalSet,routeIsTripToggled,routeIsTripSet,routeLoadingModeSet,reset} = routeParamsSlice.actions


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

const routeInfoInitialState = {
    name: '',
    rwgpsRouteData: null,
    gpxRouteData: null,
    loadingFromURL: false
}
const routeInfoSlice = createSlice({
    name:'routeInfo',
    initialState: routeInfoInitialState,
    reducers:{
        rwgpsRouteLoaded(state, action) {
            state.rwgpsRouteData = action.payload
            state.gpxRouteData = null
            state.name = getRouteName(action.payload, "rwgps")
        },
        gpxRouteLoaded(state, action) {
            state.gpxRouteData = action.payload
            state.rwgpsRouteData = null
            state.name = getRouteName(action.payload, "gpx")
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
    .addCase(reset, () => routeInfoInitialState)
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
        },
        stravaErrorSet(state,action) {
            if (action.payload !== undefined && action.payload !== "") {
                state.errorDetails = `Error loading route from Strava: ${action.payload}`
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(pinnedRoutesSet, (state) => {
                state.errorDetails = null
            })
            .addCase("strava/stravaFetched", (state) => {
                state.errorDetails = null
            })
            .addCase("strava/stravaFetchFailed", (state, action) => {
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
    gpxRouteLoadingFailed,errorDetailsSet,shortUrlSet,stravaErrorSet} = dialogParamsSlice.actions

const controlsInitialState = {
    metric: false,
    displayBanked: false,
    userControlPoints: [],
    showWeatherProvider: false,
    displayControlTableUI: false
}

const controlsSlice = createSlice({
    name: 'controls',
    initialState: controlsInitialState,
    reducers: {
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
        userControlsUpdated(state, action) {
            state.userControlPoints = action.payload
        },
        showWeatherProviderSet(state, action) {
            state.showWeatherProvider = action.payload
        },
        displayControlTableUiSet(state, action) {
            state.displayControlTableUI = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(rwgpsRouteSet, (state) => {
                state.userControlPoints = []
            }
            ).addCase(reset, () => controlsInitialState)
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

const stravaInitialState = {
    analysisInterval: defaultAnalysisIntervalInHours,
    activity: '',
    route: '',
    access_token: null,
    refresh_token: null,
    expires_at: null,
    fetching: false,
    activityData: null,
    activityStream: null,
    subrange:[]
}

const stravaSlice = createSlice({
    name:'strava',
    initialState: stravaInitialState,
    reducers: {
        stravaTokenSet(state,action) {
            if (action.payload && action.payload.token) {
                state.access_token = action.payload.token
                state.expires_at = action.payload.expires_at
            }
        },
        stravaRefreshTokenSet(state,action) {
            if (action.payload) {
                state.refresh_token = action.payload
            }
        },
        stravaActivitySet(state,action) {
            if (action.payload) {
                const newValue = getRouteNumberFromValue(action.payload)
                state.activity = newValue
                state.activityData = null
                state.activityStream = null

                state.subrange = []
            }
        },
        stravaRouteSet(state,action) {
            if (action.payload) {
                state.route = getRouteNumberFromValue(action.payload)
            }
        },
        stravaFetchBegun(state) {
            state.fetching = true
        },
        stravaFetched(state,action) {
            state.fetching = false
            state.activityData = action.payload.activity
            state.activityStream = action.payload.stream
            state.analysisInterval = getAnalysisIntervalFromRouteDuration(action.payload.activity.elapsed_time/3600)
        },
        stravaFetchFailed(state,action) {
            const errorMessage = typeof action.payload === 'object' ? action.payload.message : action.payload
            state.fetching = false
            if (errorMessage === "Authorization Error") {
                state.access_token = null
            }
        },
        analysisIntervalSet(state,action) {
            state.analysisInterval = parseFloat(action.payload)
            state.subrange = null
        },
        mapSubrangeSet(state,action) {
            state.subrange = [
                parseFloat(action.payload.start),
                parseFloat(action.payload.finish)
            ]
        },
        mapRangeToggled(state,action) {
            if (state.subrange[0] === parseFloat(action.payload.start && state.subrange[1] === action.payload.finish)) {
                state.subrange = []
            } else {
                state.subrange = [
                    parseFloat(action.payload.start),
                    parseFloat(action.payload.finish)
                ]
                }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(reset, () => stravaInitialState)
    }
})

export const stravaReducer = stravaSlice.reducer
export const {stravaTokenSet,stravaRefreshTokenSet,stravaActivitySet,stravaFetchBegun,
    stravaFetched,stravaFetchFailed,analysisIntervalSet,mapSubrangeSet,mapRangeToggled,
    stravaRouteSet} = stravaSlice.actions

const forecastInitialState = {
    forecast: [],
    timeZoneId: null,
    valid: false,
    range: [],
    tableViewed: false,
    mapViewed: false,
    weatherProvider: 'weatherKit',
    zoomToRange: true,
    fetchAqi:false
}
const forecastSlice = createSlice({
    name:'forecast',
    initialState:forecastInitialState,
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
            .addCase(reset, () => forecastInitialState)
    }
})

export const forecastReducer = forecastSlice.reducer
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
    },
    extraReducers: (builder) => {
        builder
            .addCase(reset, (state) => {
                state.queryString = null
                state.searchString = null
            })
    }
})

export const paramsReducer = paramsSlice.reducer

export const rwgpsInfoReducer = rideWithGpsInfoSlice.reducer

export const {actionUrlAdded, apiKeysSet, querySet, queryCleared} = paramsSlice.actions
