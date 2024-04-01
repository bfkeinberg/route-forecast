import { configureStore, combineReducers } from '@reduxjs/toolkit'
import {createLogger} from 'redux-logger';
import * as Sentry from '@sentry/browser';
import createSentryMiddleware from "redux-sentry-middleware";
import { routeParamsReducer, dialogParamsReducer, routeInfoReducer, controlsReducer,
    stravaReducer, forecastReducer, paramsReducer, rwgpsInfoReducer } from './reducer';
import { forecastApiSlice } from './forecastApiSlice';
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
             [forecastApiSlice.reducerPath] : forecastApiSlice.reducer
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