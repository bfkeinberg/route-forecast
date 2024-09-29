import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface RideWithGpsInfoState {
    pinnedRoutes:Array<string>
    token:string|null
    usePinnedRoutes:boolean
    loadingRoutes:boolean
}

const rideWithGpsInfoInitialState : RideWithGpsInfoState = {
    pinnedRoutes: [], token: null, usePinnedRoutes: false, loadingRoutes: false
}

const rideWithGpsInfoSlice = createSlice({
    name: 'rideWithGpsInfo',
    initialState : rideWithGpsInfoInitialState,
    reducers: {
        rwgpsTokenSet(state, action : PayloadAction<string>) {
            state.token = action.payload
        },
        pinnedRoutesSet(state, action:PayloadAction<Array<string>>) {
            state.pinnedRoutes = action.payload
        },
        loadingPinnedSet(state, action:PayloadAction<boolean>) {
            state.loadingRoutes = action.payload
        },
        usePinnedRoutesSet(state, action:PayloadAction<boolean>) {
            state.usePinnedRoutes = action.payload
        }
    }
})

export const {rwgpsTokenSet,pinnedRoutesSet,loadingPinnedSet,usePinnedRoutesSet} = rideWithGpsInfoSlice.actions
export const rwgpsInfoReducer = rideWithGpsInfoSlice.reducer