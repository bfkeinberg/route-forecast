import { combineReducers,configureStore } from '@reduxjs/toolkit'
import * as Sentry from '@sentry/browser';
import {createLogger} from 'redux-logger';
import createSentryMiddleware from "redux-sentry-middleware";

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
    const store = configureStore({
        reducer: {
            uiInfo: combineReducers({ routeParams: routeParamsReducer, dialogParams: dialogParamsReducer }),
            routeInfo: routeInfoReducer, controls: controlsReducer, strava: stravaReducer, forecast: forecastReducer,
             params: paramsReducer, rideWithGpsInfo: rwgpsInfoReducer,
             [forecastApiSlice.reducerPath] : forecastApiSlice.reducer,
             [rusaIdLookupApiSlice.reducerPath]: rusaIdLookupApiSlice.reducer
        },
        middleware: getDefaultMiddleware => {
            const middleware = getDefaultMiddleware().concat(forecastApiSlice.middleware)
            if (mode === 'development') {
                middleware.push(loggerMiddleware)
            }
            if (mode !== 'development') {
                middleware.push(
                    createSentryMiddleware(Sentry, {
                        stateTransformer: state => {
                            Object.assign(...Object.keys(state)
                                .filter(key => (key !== 'routeInfo' && key !== 'forecast'))
                                .map(key => ({ [key]: state[key] })))
                        },
                        breadcrumbDataFromAction: action => {
                            return Object.assign(...Object.keys(action)
                                .filter(key => (!bannedActionKeys.includes(key)))
                                .map(key => ({ [key]: action[key] })))
                        }
                    })
                )
            }
            return middleware;
        }
    });

    return store;
}