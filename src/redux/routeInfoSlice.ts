import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { getRouteName } from '../utils/util';

const routeInfoInitialState : RouteInfoState = {
    name: '',
    rwgpsRouteData: null,
    gpxRouteData: null,
    loadingFromURL: false,
    distanceInKm: 0,
    canDoUserSegment:false,
    type: null
}

interface RwgpsRoute {
    route: {
        distance: number,
        name: string,
        track_points: {d:number}[]
    },
    trip?: never,
    type: string,
    [index:string]:any
}

interface RwgpsTrip {
    trip: {
        distance: number,
        name: string,
        track_points: {d:number}[]
    },
    route?: never,
    type: string,
    [index:string]:any
}

interface GpxRouteData {
    tracks: {
        distance: {
            total: number
        },
        name: string
    }[]
}

interface RouteInfoState  {
    name: string,
    rwgpsRouteData: RwgpsRoute | RwgpsTrip | null,
    gpxRouteData: GpxRouteData | null,
    loadingFromURL: boolean,
    distanceInKm: number,
    canDoUserSegment: boolean,
    type: string | null
}

type RwGpsData = RwgpsRoute | RwgpsTrip

const routeInfoSlice = createSlice({
    name:'routeInfo',
    initialState: routeInfoInitialState,
    reducers:{
        rwgpsRouteLoaded(state, action: PayloadAction<RwGpsData>) {
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
        gpxRouteLoaded(state, action : PayloadAction<GpxRouteData>) {
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
        loadingFromUrlSet(state, action : PayloadAction<boolean>) {
            state.loadingFromURL = action.payload
        }
    },
    extraReducers: (builder) => {
        builder.addCase("routeParams/rwgpsRouteSet", (state) => {
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
            .addCase("routeParams/reset", () => routeInfoInitialState)
    }
})

export const routeInfoReducer = routeInfoSlice.reducer
export const {rwgpsRouteLoaded, gpxRouteLoaded, routeDataCleared,loadingFromUrlSet} = routeInfoSlice.actions