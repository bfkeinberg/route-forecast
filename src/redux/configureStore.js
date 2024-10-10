import { combineReducers,configureStore } from '@reduxjs/toolkit'
import * as Sentry from '@sentry/react';
import {createLogger} from 'redux-logger';

import { forecastApiSlice } from './forecastApiSlice'
import {
    controlsReducer,
    dialogParamsReducer, forecastReducer, paramsReducer, routeInfoReducer, routeParamsReducer, rwgpsInfoReducer, stravaReducer
} from './reducer';
import { rusaIdLookupApiSlice} from './rusaLookupApiSlice'
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
 * @param {Object} preloadedState from server
 * @param {boolean} mode - development vs production
 * @returns {Object} The Redux store
 *
 */
export default function configureReduxStore(preloadedState, mode) {
    const sentryReduxEnhancer = Sentry.createReduxEnhancer({
        actionTransformer: action => {
            if (action.type === 'params/apiKeysSet') {
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
            params: paramsReducer, rideWithGpsInfo: rwgpsInfoReducer,
            [forecastApiSlice.reducerPath]: forecastApiSlice.reducer,
            [rusaIdLookupApiSlice.reducerPath]: rusaIdLookupApiSlice.reducer
        },
        enhancers: getDefaultEnhancers => {
            return getDefaultEnhancers().concat(sentryReduxEnhancer);
        },
        middleware: getDefaultMiddleware => {
            const middleware = getDefaultMiddleware().concat(forecastApiSlice.middleware)
            if (mode === 'development') {
                middleware.push(loggerMiddleware)
            }
            return middleware;
        }
    });

    return store;
}