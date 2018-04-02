import {applyMiddleware, createStore} from 'redux';
import thunkMiddleware from 'redux-thunk';
import {createLogger} from 'redux-logger';
import rootReducer from './reducers/reducer';
import createRavenMiddleware from "raven-for-redux";

const loggerMiddleware = createLogger();
/*global Raven*/

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
/*            createRavenMiddleware(Raven, {
                // Optionally pass some options here.
            })*/
        )
    )
}