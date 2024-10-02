import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { reset } from './routeParamsSlice';

interface Params {
    action: string
    maps_api_key: string
    timezone_api_key : string
    bitly_token : string
    queryString : string | null
    searchString: string | null
}

const initialParams : Params = {
    action: '',
    maps_api_key: '',
    timezone_api_key: '',
    bitly_token: '',
    queryString: null,
    searchString: null
}

const paramsSlice = createSlice({
    name:'params',
    initialState: initialParams,
    reducers:{
        actionUrlAdded(state, action : PayloadAction<string>) {
            const url = action.payload
            state.action = url
        },
        apiKeysSet(state, action:PayloadAction<{maps_api_key:string,timezone_api_key:string,bitly_token:string}>) {
            state.maps_api_key= action.payload.maps_api_key
            state.timezone_api_key = action.payload.timezone_api_key
            state.bitly_token = action.payload.bitly_token
        },
        querySet(state, action : PayloadAction<{url:string, search:string}>) {
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
