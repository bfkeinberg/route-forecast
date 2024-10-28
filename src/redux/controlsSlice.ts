import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UserControl {
    distance: number,
    duration: number,
    name: string,
    id?: number,
    actual?: string,
    arrival?: string,
    banked?: number
    [index:string]:any
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
        controlAdded(state) {
            state.userControlPoints.push({ name: "", distance: 0, duration: 0 })
        },
        controlRemoved(state, action: PayloadAction<number>) {
            state.userControlPoints = state.userControlPoints.filter((control, index) => index !== action.payload)
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

export const { metricSet, metricToggled, celsiusToggled, bankedDisplayToggled, controlRemoved,
    userControlsUpdated, displayControlTableUiSet, controlAdded} = controlsSlice.actions
export const controlsReducer = controlsSlice.reducer