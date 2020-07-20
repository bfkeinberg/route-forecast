import {applyMiddleware, createStore} from 'redux';
import thunkMiddleware from 'redux-thunk';
import {createLogger} from 'redux-logger';
import rootReducer from './reducers/reducer';
import * as Sentry from '@sentry/browser';
import createSentryMiddleware from "redux-sentry-middleware";

export const loggerMiddleware = createLogger();
/* eslint-disable global-require */

const bannedActionKeys = [
    'routeData',
    'controls',
    'values',
    'forecastInfo',
    'gpxRouteData',
    'data',
    'arrivalTimes',
    'calculatedPaces',
    'bitlyToken'
];

/**
 *
 * @param {boolean }mode development or production
 * @returns {any[]} array of middleware to be used
 */
export const selectMiddleware = mode => {
    return [
        thunkMiddleware,
        mode === 'development' ?
            loggerMiddleware :
            createSentryMiddleware(Sentry, {
            stateTransformer: state => {Object.assign(...Object.keys(state)
                .filter(key => (key !== 'routeInfo' && key !== 'forecast'))
                .map( key => ({ [key]: state[key] }) ) )},
            breadcrumbDataFromAction: action => {
                return Object.assign(...Object.keys(action)
                    .filter(key => (!bannedActionKeys.includes(key)))
                    .map( key => ({ [key]: action[key] }) ) )
            }
        })
    ]
};

/**
 *
 * @param {Object} preloadedState from server
 * @param {boolean} mode - development vs production
 * @returns {Object} The Redux store
 *
 */
export default function configureStore(preloadedState,mode) {
    const store = createStore(
        rootReducer,
        preloadedState,
        applyMiddleware(...selectMiddleware(mode))
    );

    return store;
}