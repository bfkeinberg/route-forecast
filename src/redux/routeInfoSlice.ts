import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { getRwgpsRouteName, getGpxRouteName } from '../utils/util';
import type { GpxPoint, RwgpsCoursePoint, RwgpsPoint } from '../utils/gpxParser';

const routeInfoInitialState : RouteInfoState = {
    name: '',
    rwgpsRouteData: null,
    gpxRouteData: null,
    loadingFromURL: false,
    distanceInKm: 0,
    canDoUserSegment:false,
    type: "none",
}

export interface RwgpsRoute {
    type: "route",
    route: {
        distance: number,
        name: string,
        track_points: RwgpsPoint[]
        course_points: Array<RwgpsCoursePoint>
        id: number
    },
    trip?: never,
    [index:string]:any
}

export interface RwgpsTrip {
    trip: {
        distance: number,
        name: string,
        track_points: RwgpsPoint[]
        course_points: Array<RwgpsCoursePoint>
        id: number
    },
    route?: never,
    type: "trip",
    [index:string]:any
}

export interface GpxRouteData {
    name: string
    tracks: Array<{
        distance: {
            total: number
        },
        points: Array<GpxPoint>,
        name: string,
        link: string
    }>
    type: "gpx"
}

export interface BaseRouteInfoState  {
    name: string,
    loadingFromURL: boolean,
    distanceInKm: number,
    canDoUserSegment: boolean,
    type: "rwgps" | "gpx" | "none"
    [index:string]:any
}

interface RwgpsRouteInfoState extends BaseRouteInfoState {
    type: "rwgps"
    rwgpsRouteData: RwgpsRoute | RwgpsTrip
    gpxRouteData: null
}

interface GpxRouteInfoState extends BaseRouteInfoState {
    type: "gpx"
    rwgpsRouteData: null
    gpxRouteData: GpxRouteData
}

export interface NullRouteInfoState extends BaseRouteInfoState {
    // type: "none"
    // rwgpsRouteData: never
    // gpxRouteData: never
}

type RwGpsData = RwgpsRoute | RwgpsTrip
export type RouteInfoState = RwgpsRouteInfoState | GpxRouteInfoState | NullRouteInfoState

const routeInfoSlice = createSlice({
    name:'routeInfo',
    initialState: routeInfoInitialState,
    reducers:{
        rwgpsRouteLoaded(state, action: PayloadAction<RwGpsData>) {
            state.rwgpsRouteData = action.payload
            state.type = "rwgps"
            state.gpxRouteData = routeInfoInitialState.gpxRouteData
            state.name = getRwgpsRouteName(action.payload)
            if (action.payload.route) {
                state.distanceInKm = action.payload.route.distance/1000
                state.canDoUserSegment = action.payload.route.track_points[0] && action.payload.route.track_points[0].d !== undefined
            } else {
                state.distanceInKm = action.payload.trip.distance/1000
                state.canDoUserSegment = action.payload.trip.track_points[0] && action.payload.trip.track_points[0].d !== undefined
            }
        },
        gpxRouteLoaded(state, action : PayloadAction<GpxRouteData>) {
            state.type = "gpx"
            state.gpxRouteData = action.payload
            state.gpxRouteData.type = "gpx"
            state.rwgpsRouteData = routeInfoInitialState.rwgpsRouteData
            state.name = getGpxRouteName(action.payload)
            state.distanceInKm = action.payload.tracks[0].distance.total/1000
        },
        routeDataCleared(state) {
            state.rwgpsRouteData = routeInfoInitialState.rwgpsRouteData
            state.gpxRouteData = routeInfoInitialState.gpxRouteData
            state.name = routeInfoInitialState.name
            state.type = routeInfoInitialState.type
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