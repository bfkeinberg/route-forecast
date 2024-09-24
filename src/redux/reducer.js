import { createSlice } from '@reduxjs/toolkit'

import { getRouteNumberFromValue } from '../utils/util';

export const finishTimeFormat = 'EEE, MMM dd yyyy h:mma';

const defaultAnalysisIntervalInHours = 1;

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
