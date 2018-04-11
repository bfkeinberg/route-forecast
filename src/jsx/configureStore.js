import {applyMiddleware, createStore} from 'redux';
import thunkMiddleware from 'redux-thunk';
import {createLogger} from 'redux-logger';
import rootReducer from './reducers/reducer';
import createRavenMiddleware from "raven-for-redux";

const loggerMiddleware = createLogger();
/*global Raven*/

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
/**
 *
 * @param {Object} preloadedState from server?
 * @returns {Object} The Redux store
 */
export default function configureStore(preloadedState) {
    return createStore(
        rootReducer,
        preloadedState,
        applyMiddleware(
            thunkMiddleware,
            loggerMiddleware,
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
        )
    );
}