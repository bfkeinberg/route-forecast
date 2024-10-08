import { createSlice } from '@reduxjs/toolkit'
import { DateTime } from 'luxon';

import { routeLoadingModes } from '../data/enums';
import { getRouteName,getRouteNumberFromValue } from '../utils/util';

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
    nws:{min_interval:1, max_days:7, canForecastPast:false, daysInPast:0, name:"National Weather Service", enabled:true},
    oneCall:{min_interval:0.25, max_days:5, canForecastPast:true, daysInPast:14, name:"OneCall", enabled:true},
    visualcrossing:{min_interval:0.25, max_days:14, canForecastPast:true, daysInPast:4, name:"Visual Crossing", enabled:true},
    weatherapi:{min_interval:1, max_days:10, canForecastPast:false, daysInPast:4, name:"WeatherAPI", enabled:true},
    weatherKit:{min_interval:0.25, max_days:8, canForecastPast:true, name:"Apple WeatherKit", enabled:true},
    climacell:{min_interval:0.25, max_days:4, canForecastPast:false, daysInPast:1, name:"Tomorrow.io", maxCallsPerHour:25, enabled:true},
    // meteomatics:{min_interval:1, max_days:10,canForecastPast:true, daysInPast:1, name:"Meteomatics"}
    }
export const defaultProvider = 'nws'

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
    min_interval:providerValues[defaultProvider].min_interval,
    canForecastPast:providerValues[defaultProvider].canForecastPast,
    pace: defaultPace,
    rwgpsRoute: '',
    rwgpsRouteIsTrip: false,
    startTimestamp: initialStartTime().toMillis(),
    // eslint-disable-next-line new-cap
    zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    routeLoadingMode: routeLoadingModes.RWGPS,
    maxDaysInFuture: providerValues[defaultProvider].max_days,
    stopAfterLoad: false,
    rusaPermRouteId: '',
    loadingSource:null,
    succeeded:null,
    segment:[0,0]
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
            } else {
                state.rwgpsRoute = ''
            }
            state.loadingSource = null
            state.succeeded = null
            state.segment = routeParamsInitialState.segment
        },
        rusaPermRouteIdSet(state,action) {
            state.rusaPermRouteId = action.payload
            state.routeLoadingMode = routeLoadingModes.RUSA_PERM
        },
        startTimeSet(state,action) {
            if (action.payload) {
                const start =  DateTime.fromMillis(action.payload, {zone:state.zone})
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
                    state.zone = action.payload.zone
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
        timeZoneSet(state,action) {
            state.zone = action.payload
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
                state.segment = routeParamsInitialState.segment
            }
        },
        segmentSet(state,action) {
            // start and end are in meters
            state.segment = action.payload
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
                state.startTimestamp = checkedStartDate(DateTime.fromMillis(state.startTimestamp, {zone:state.zone}), providerValues[action.payload].canForecastPast).toMillis()
            })
            .addCase('routeInfo/rwgpsRouteLoaded', (state,action) => {
                if (action.payload.route) {
                    state.segment[1] = action.payload.route.distance
                } else {
                    state.segment[1] = action.payload.trip.distance
                }
            })
            .addCase('routeInfo/gpxRouteLoaded', (state, action) => {
                state.segment = [state.segment[0], action.payload.tracks[0].distance.total*1000]
            })
            .addCase('routeInfo/routeDataCleared', (state) => {
                state.segment = routeParamsInitialState.segment
            }).addCase("strava/stravaRouteSet", (state, action) => {
                if (action.payload && action.payload !== '') {
                    state.rwgpsRoute = routeParamsInitialState.rwgpsRoute
                }
            })
    }
})

export const routeParamsReducer = routeParamsSlice.reducer
export const {stopAfterLoadSet,rwgpsRouteSet,startTimeSet,initialStartTimeSet,
        startTimestampSet,paceSet,intervalSet,routeIsTripToggled,routeIsTripSet,
        routeLoadingModeSet,reset, timeZoneSet, rusaPermRouteIdSet,
        segmentSet} = routeParamsSlice.actions

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
    loadingFromURL: false,
    distanceInKm: 0,
    canDoUserSegment:false
}
const routeInfoSlice = createSlice({
    name:'routeInfo',
    initialState: routeInfoInitialState,
    reducers:{
        rwgpsRouteLoaded(state, action) {
            state.rwgpsRouteData = action.payload
            state.gpxRouteData = null
            state.name = getRouteName(action.payload, "rwgps")
            if (action.payload.route) {
                state.distanceInKm = action.payload.route.distance/1000
                state.canDoUserSegment = action.payload.route.track_points[0].d !== undefined
            } else {
                state.distanceInKm = action.payload.trip.distance/1000
                state.canDoUserSegment = action.payload.trip.track_points[0].d !== undefined
            }
            state.type = "rwgps"
        },
        gpxRouteLoaded(state, action) {
            state.gpxRouteData = action.payload
            state.rwgpsRouteData = routeInfoInitialState.rwgpsRouteData
            state.name = getRouteName(action.payload, "gpx")
            state.type = "gpx"
            state.distanceInKm = action.payload.tracks[0].distance.total/1000
        },
        routeDataCleared(state) {
            state.rwgpsRouteData = routeInfoInitialState.rwgpsRouteData
            state.gpxRouteData = routeInfoInitialState.gpxRouteData
            state.name = routeInfoInitialState.name
            state.type = null
            state.distanceInKm = routeInfoInitialState.distanceInKm
        },
        loadingFromUrlSet(state, action) {
            state.loadingFromURL = action.payload
        }
    },
    extraReducers: (builder) => {
        builder.addCase(rwgpsRouteSet, (state) => {
            state.rwgpsRouteData = routeInfoInitialState.rwgpsRouteData
            state.gpxRouteData = routeInfoInitialState.gpxRouteData
            state.name = routeInfoInitialState.name
            state.distanceInKm = routeInfoInitialState.distanceInKm
        })
            .addCase("strava/stravaRouteSet", (state) => {
                state.rwgpsRouteData = routeInfoInitialState.rwgpsRouteData
                state.gpxRouteData = routeInfoInitialState.gpxRouteData
                state.name = routeInfoInitialState.name
                state.distanceInKm = routeInfoInitialState.distanceInKm
            })
            .addCase(reset, () => routeInfoInitialState)
    }
})

export const routeInfoReducer = routeInfoSlice.reducer
export const {rwgpsRouteLoaded, gpxRouteLoaded, routeDataCleared,loadingFromUrlSet} = routeInfoSlice.actions

const getMessageFromError = (error) => {
    if (typeof error === 'object') {
        if (error.message) return error.message
        if (error.data) return error.data.details
        if (error.error) return error.error
        return error.toString()
    } else return error
}

const dialogParamsSlice = createSlice({
    name: 'dialogParams',
    initialState: {
        errorDetails: null,
        errorMessageList: [],
        succeeded: true, shortUrl: ' ',
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
            state.errorDetails = getMessageFromError(action.payload)
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
            } else if (!action.payload) {
                state.errorDetails = action.payload
            } else if (action.payload.data) {
                state.errorDetails = action.payload.data.details
            } else {
                state.errorDetails = JSON.stringify(action.payload)
            }
        },
        errorMessageListSet(state,action) {
            state.errorMessageList = action.payload
            state.fetchingForecast = false
        },
        errorMessageListAppend(state,action) {
            state.errorMessageList.concat(action.payload)
            state.fetchingForecast = false
        },
        lastErrorCleared(state) {
            if (state.errorMessageList.length > 0) {
                state.errorMessageList.shift()
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
                const errorMessage = typeof action.payload === 'object' ? action.error.message : action.payload
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
    gpxRouteLoadingFailed,errorDetailsSet,errorMessageListSet,shortUrlSet,
    lastErrorCleared,stravaErrorSet, errorMessageListAppend} = dialogParamsSlice.actions

const controlsInitialState = {
    metric: false,
    celsius: false,
    displayBanked: false,
    userControlPoints: [],
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
        celsiusToggled(state) {
            state.celsius = !state.celsius
        },
        bankedDisplayToggled(state) {
            state.displayBanked = !state.displayBanked
        },
        userControlsUpdated(state, action) {
            state.userControlPoints = action.payload
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

export const { metricSet, metricToggled, celsiusToggled, bankedDisplayToggled, userControlsUpdated, displayControlTableUiSet} = controlsSlice.actions
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
            if (action.payload !== undefined) {
                const newValue = getRouteNumberFromValue(action.payload)
                state.activity = newValue
                state.activityData = null
                state.activityStream = null

                state.subrange = []
            }
        },
        stravaRouteSet(state,action) {
            if (action.payload !== undefined) {
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
            state.subrange = []
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
            .addCase(rwgpsRouteSet, (state,action) => {
                if (action.payload && action.payload !== '') {
                    state.activity = stravaInitialState.activity
                    state.route = stravaInitialState.route
                    state.activityData = stravaInitialState.activityData
                    state.activityStream = stravaInitialState.activityStream
                    state.subrange = stravaInitialState.subrange    
                }
        })
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
    weatherProvider: defaultProvider,
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
        forecastAppended(state, action) {
            state.forecast = state.forecast.concat(action.payload)
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
    tableViewedSet,mapViewedSet,weatherProviderSet,zoomToRangeSet,zoomToRangeToggled,
    fetchAqiSet,fetchAqiToggled,forecastAppended} = forecastSlice.actions;

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
