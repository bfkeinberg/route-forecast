import { createSlice } from '@reduxjs/toolkit'
import { reset } from './routeParamsSlice';
export const finishTimeFormat = 'EEE, MMM dd yyyy h:mma';

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

export const {actionUrlAdded, apiKeysSet, querySet, queryCleared} = paramsSlice.actions
