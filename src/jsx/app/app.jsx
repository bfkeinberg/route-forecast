import React from 'react';
import ReactDOM from 'react-dom';
import TopLevel from './topLevel';
import LocationContext from '../locationContext';
import ReactGA from "react-ga4";
import { BrowserTracing } from "@sentry/tracing";
import * as Sentry from "@sentry/react";

ReactGA.initialize("G-0R3J1W9ECC");
//ReactGA.send("pageview");

if (!window.origin.startsWith('http://localhost')) {
    Sentry.init({
        dsn: 'https://ea4c472ff9054dab8c18d594b95d8da2@sentry.io/298059',
        environment: 'production',
        autoSessionTracking: true,
        ignoreErrors: [
            "Non-Error exception captured",
            "Non-Error promise rejection captured"
        ],
        // This enables automatic instrumentation (highly recommended), but is not
        // necessary for purely manual usage
        integrations: [
            new BrowserTracing({
                tracingOrigins: [
                    'localhost',
                    /^\//,
                    "www.randoplan.com"
                ]
            })
        ],

        // To set a uniform sample rate
        tracesSampleRate: 0.15
        /*,
        beforeBreadcrumb(breadcrumb) {
            if (breadcrumb.category==='console') {return null} else {return breadcrumb}
        }*/
    });
}
let script = document.scripts.namedItem('routeui');
const mode = script.getAttribute('mode');
const action = script.getAttribute('action');
const maps_api_key = script.getAttribute('maps_api_key');
const timezone_api_key = script.getAttribute('timezone_api_key');
const bitly_token = script.getAttribute('bitly_token');

const render = Component => {
    ReactDOM.render(
        <LocationContext.Provider value={{href:location.href, search:location.search, origin:location.origin}}>
            <Component mode={mode} action={action} maps_api_key={maps_api_key} timezone_api_key={timezone_api_key} bitly_token={bitly_token}/>
        </LocationContext.Provider>,
    document.getElementById('content'));
};

render(TopLevel);
