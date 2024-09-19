import { combineReducers, configureStore } from '@reduxjs/toolkit'
import * as Sentry from '@sentry/react';
import {createLogger} from 'redux-logger';

import { forecastApiSlice } from './forecastApiSlice'
import {
    dialogParamsReducer, paramsReducer, rwgpsInfoReducer, stravaReducer
} from './reducer';
import { rusaIdLookupApiSlice} from './rusaLookupApiSlice'
import { routeInfoReducer } from './routeInfoSlice';
import { controlsReducer } from './controlsSlice';
import {routeParamsReducer} from './routeParamsSlice'
import { forecastReducer } from './forecastSlice';

export const loggerMiddleware = createLogger();

const bannedActionKeys = [
    'routeData',
    'controls',
    'values',
    'forecastInfo',
    'gpxRouteData',
    'data',
    'arrivalTimes',
    'bitlyToken'
];

/**
 *
 * @param {Object} _preloadedState from server
 * @param {boolean} mode - development vs production
 * @returns {Object} The Redux store
 *
 */
export default function configureReduxStore({ _preloadedState, mode }: { _preloadedState:object; mode:string; }) {
    const sentryReduxEnhancer = Sentry.createReduxEnhancer({
        actionTransformer: action => {
            if (action.type === 'paramsSlice/apiKeysSet') {
                // Return null to not log the action to Sentry
                return null;
            }
/*             if (action.type === 'SET_PASSWORD') {
                // Return a transformed action to remove sensitive information
                return {
                    ...action,
                    password: null,
                };
            }
 */
            return action;
        }
    });
    const store = configureStore({
        reducer: {
            uiInfo: combineReducers({ routeParams: routeParamsReducer, dialogParams: dialogParamsReducer }),
            routeInfo: routeInfoReducer, controls: controlsReducer, strava: stravaReducer, forecast: forecastReducer,
            params: paramsReducer, 
            rideWithGpsInfo: rwgpsInfoReducer,
            [forecastApiSlice.reducerPath]: forecastApiSlice.reducer,
            [rusaIdLookupApiSlice.reducerPath]: rusaIdLookupApiSlice.reducer
        },
        preloadedState:_preloadedState,
        enhancers: getDefaultEnhancers => {
            return getDefaultEnhancers().concat(sentryReduxEnhancer);
        },
        middleware: (getDefaultMiddleware) => {
            const middleware = getDefaultMiddleware()
            if (mode === 'development') {
                middleware.concat(forecastApiSlice.middleware,rusaIdLookupApiSlice.middleware,loggerMiddleware)
            } else {
                middleware.concat(forecastApiSlice.middleware,rusaIdLookupApiSlice.middleware)
            }
            return middleware;
        }
    });

    return store;
}
