import {applyMiddleware, createStore} from 'redux';
import thunkMiddleware from 'redux-thunk';
import {createLogger} from 'redux-logger';
import rootReducer from './reducers/reducer';
import createRavenMiddleware from "raven-for-redux";

export const loggerMiddleware = createLogger();
/* eslint-disable global-require */
/*global module*/

const bannedActionKeys = [
    'routeData',
    'controls',
    'values',
    'forecastInfo',
    'gpxRouteData',
    'data',
    'arrivalTimes',
    'calculatedPaces'
];

// below is for server side rendering
if (typeof Raven === 'undefined') {
    var Raven = require('raven-js');
    Raven.config('https://ea4c472ff9054dab8c18d594b95d8da2@sentry.io/298059').install();
}

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
        createRavenMiddleware(Raven, {
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

    if (module.hot) {
        // Enable Webpack hot module replacement for reducers
        module.hot.accept('./reducers/reducer', () => {
            const nextRootReducer = require('./reducers/reducer').default;
            console.log('replacing reducer');
            store.replaceReducer(nextRootReducer);
        });
    }

    return store;
}