import React from 'react';
import ReactDOM from 'react-dom';
import TopLevel from './topLevel';
import { AppContainer } from 'react-hot-loader';
import LocationContext from '../locationContext';

/*global Raven*/
Raven.config('https://ea4c472ff9054dab8c18d594b95d8da2@sentry.io/298059').install();

let script = document.scripts.namedItem('routeui');
const mode = script.getAttribute('mode');
const action = script.getAttribute('action');
const maps_api_key = script.getAttribute('maps_api_key');
const timezone_api_key = script.getAttribute('timezone_api_key');
const bitly_token = script.getAttribute('bitly_token');

// Grab the state from a global variable injected into the server-generated HTML
const preloadedState = window.__PRELOADED_STATE__;

// Allow the passed state to be garbage-collected
delete window.__PRELOADED_STLoadableComponentATE__;

const render = Component => {
    ReactDOM.hydrate(
        <AppContainer>
            <LocationContext.Provider value={{href:location.href, search:location.search, origin:location.origin}}>
                <Component state={preloadedState} mode={mode} action={action} maps_api_key={maps_api_key} timezone_api_key={timezone_api_key} bitly_token={bitly_token}/>
            </LocationContext.Provider>
        </AppContainer>,
    document.getElementById('content'));
};

render(TopLevel);

if (module.hot) {
    module.hot.accept('./topLevel.jsx', () => {
        render(TopLevel);
    });
}
