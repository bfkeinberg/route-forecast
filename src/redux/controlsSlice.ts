import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { number } from 'prop-types'
import { act } from 'react'

export interface UserControl {
    distance: number,
    duration: number,
    name: string,
    id?: number,
    actual?: string,
    arrival?: string,
    banked?: number,
    lat?: number,
    lon?: number,
    business?: string
    [index:string]:any
}

export type BusinessOpenType = {
    isOpen: boolean
    distance: number
}

export interface ControlsState {
    metric: boolean,
    celsius: boolean,
    displayBanked: boolean,
    userControlPoints: UserControl[],
    controlOpenStatus : Array<BusinessOpenType>,
    displayControlTableUI: boolean
}

const controlsInitialState : ControlsState = {
    metric: false,
    celsius: false,
    displayBanked: false,
    userControlPoints: [],
    controlOpenStatus: [],
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
        controlAdded(state) {
            state.userControlPoints.push({ name: "", distance: 0, duration: 0 })
        },
        controlRemoved(state, action: PayloadAction<number>) {
            state.userControlPoints = state.userControlPoints.filter((control, index) => index !== action.payload)
        },
        userControlsUpdated(state, action : PayloadAction<UserControl[]>) {
            state.userControlPoints = action.payload
        },
        openBusinesses(state, action : PayloadAction<Array<BusinessOpenType>>) {
            state.controlOpenStatus = action.payload
        },
        displayControlTableUiSet(state, action : PayloadAction<boolean>) {
            state.displayControlTableUI = action.payload
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase("routeParams/rwgpsRouteSet", (state) => {
                state.userControlPoints = []
            }
            ).addCase("routeParams/reset", () => controlsInitialState)
    }
})

export const { metricSet, metricToggled, celsiusToggled, bankedDisplayToggled, controlRemoved,
    userControlsUpdated, displayControlTableUiSet, controlAdded, openBusinesses} = controlsSlice.actions
export const controlsReducer = controlsSlice.reducer