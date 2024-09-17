import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UserControl {
    distance: number,
    duration: number,
    name: string,
    id: number,
    actual?: string,
    arrival?: string,
    banked?: number
}

export interface ControlsState {
    metric: boolean,
    celsius: boolean,
    displayBanked: boolean,
    userControlPoints: UserControl[],
    displayControlTableUI: boolean
}

const controlsInitialState : ControlsState = {
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
        userControlsUpdated(state, action : PayloadAction<UserControl[]>) {
            state.userControlPoints = action.payload
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

export const { metricSet, metricToggled, celsiusToggled, bankedDisplayToggled, userControlsUpdated, displayControlTableUiSet} = controlsSlice.actions
export const controlsReducer = controlsSlice.reducer