import * as Sentry from "@sentry/react";
import React from 'react';
import { createRoot } from 'react-dom/client';
import ReactGA from "react-ga4";

import LocationContext from '../locationContext';
import TopLevel from './topLevel';
import "./i18n";

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/worker.js').then((registration) => {
        console.log(`Service worker registered! - ${registration.scope}`);
        if (registration.active) {
            console.log(`Worker details:${registration.active.state} ${registration.active.scriptURL}`);
        }
      }).catch((error) => {
        console.warn('Error registering service worker:',error);
      });
}


let script = document.scripts.namedItem('routeui')
const sentry_app_id = script.getAttribute('sentry_app_id')
console.log('Sentry app id', sentry_app_id)
if (!window.origin.startsWith('http://localhost') && !window.origin.startsWith('http://127.0.0.1') && !window.origin.startsWith('http://Brians-MacBook-Pro.local')) {
    ReactGA.initialize("G-0R3J1W9ECC");
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
            Sentry.thirdPartyErrorFilterIntegration({
                filterKeys: [sentry_app_id],
                behaviour: "drop-error-if-exclusively-contains-third-party-frames"
            }),
            Sentry.browserTracingIntegration({
                tracingOrigins: [
                    'localhost',
                    /^\//,
                    "www.randoplan.com"
                ]
            }
            ),
            Sentry.replayIntegration(),
            Sentry.feedbackIntegration({
                autoInject:false
              })
        ],
        denyUrls:["https://maps.googleapis"],
        enableTracing:true,
        // To set a uniform sample rate
        tracesSampleRate: Number.parseFloat(script.getAttribute('sentry_trace_sample_rate')),
        tracePropagationTargets: ["localhost", /^https:\/\/www\.randoplan\.com/],
        // This sets the sample rate to be 10%. You may want this to be 100% while
        // in development and sample at a lower rate in production
        replaysSessionSampleRate: 0.01,
        // If the entire session is not sampled, use the below sample rate to sample
        // sessions when an error occurs.
        replaysOnErrorSampleRate: 0.7,
        normalizeDepth: 5
    });
}

const mode = script.getAttribute('mode');
const action = script.getAttribute('action');
const maps_api_key = script.getAttribute('maps_api_key');
const timezone_api_key = script.getAttribute('timezone_api_key');
const bitly_token = script.getAttribute('bitly_token');

const render = Component => {
    const root = createRoot(document.getElementById('content'));
    root.render(
        <LocationContext.Provider value={{href:location.href, search:location.search, origin:location.origin}}>
            <Component mode={mode} action={action} maps_api_key={maps_api_key} timezone_api_key={timezone_api_key} bitly_token={bitly_token}/>
        </LocationContext.Provider>);
};

render(TopLevel);
