import * as Sentry from "@sentry/react";
import { createRoot } from 'react-dom/client';
import ReactGA from "react-ga4";
import VersionContext from "../versionContext";
import LocationContext from '../locationContext';
import TopLevel from './topLevel';
import "./i18n";
import { MantineProvider } from '@mantine/core';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/worker.js').then((registration) => {
        console.log(`Service worker registered! - ${registration.scope}`);
        if (registration.active) {
            console.log(`Worker details:${registration.active.state} ${registration.active.scriptURL}`);
        }
    // reg.installing may or may not be set, depending on whether
        // a new SW was registered.
        registration.installing?.addEventListener('statechange', (event : Event) => {
        if (event.target && (event.target as ServiceWorker).state === 'redundant') {
            console.log(`Service worker did not install correctly`)
        }
        });        
    }).catch((error) => {
        console.warn('Error registering service worker:', error);
    });
}


let script = document.scripts.namedItem('routeui')
if (!script || script == null) {
    <div>Script parameter is missing</div>
}
else {
    const sentry_app_id = script.getAttribute('sentry_app_id')
    const trace_sample_rate = script.getAttribute('sentry_trace_sample_rate')
    // console.log('NPM version : ' + process.env.npm_package_version)
    const allowedHosts = ['localhost', '127.0.0.1', 'Brians-MacBook-Pro.local'];
    const url = new URL(window.origin);
    if (!allowedHosts.includes(url.hostname)) {
        ReactGA.initialize("G-0R3J1W9ECC");
        if (sentry_app_id && sentry_app_id !== null) {
            Sentry.init({
                dsn: 'https://ea4c472ff9054dab8c18d594b95d8da2@sentry.io/298059',
                _experiments: { enableLogs: true },
                environment: 'production',
/*                 ignoreErrors: [
                    "Non-Error exception captured",
                    "Non-Error promise rejection captured"
                ],
 */                // This enables automatic instrumentation (highly recommended), but is not
                // necessary for purely manual usage
                integrations: [
                    Sentry.thirdPartyErrorFilterIntegration({
                        filterKeys: [sentry_app_id],
                        behaviour: "drop-error-if-exclusively-contains-third-party-frames"
                    }),
                    Sentry.browserSessionIntegration(),
                    Sentry.browserTracingIntegration(),
                    Sentry.replayIntegration({
                        maskAllText: false,
                        blockAllMedia: false,
                        maskAllInputs: false
                    }),
                    Sentry.replayCanvasIntegration(),
                    Sentry.feedbackIntegration({
                        autoInject: false
                    })
                ],
                // denyUrls: ["https://maps.googleapis"],
                // To set a uniform sample rate
                tracesSampleRate: Number.parseFloat(trace_sample_rate?trace_sample_rate:'0.1'),
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
    }

    const action = script.getAttribute('action');
    const maps_api_key = script.getAttribute('maps_api_key');
    const timezone_api_key = script.getAttribute('timezone_api_key');
    const bitly_token = script.getAttribute('bitly_token');
    let version = script.getAttribute('version');

    Sentry.setTag('version', version)
    
    interface TopLevelProps {
        action: string, 
        maps_api_key: string,
         timezone_api_key: string, 
         bitly_token: string, 
         preloaded_state?: object
    }
    const render = (Component : React.FC<TopLevelProps>) => {
        const container = document.getElementById('content')
        if (!container) {
            return (<div>Missing root container for application</div>)
        }
        if (!action || !maps_api_key || !timezone_api_key || !bitly_token) {
            return (<div>Missing required configuration variables</div>)
        }
        if (!version) {
            version = '0.0.0'
        } else {
            ReactGA.set({'appName': 'randoplan'})
            ReactGA.set({'appVersion' : version})
            ReactGA.event('appVersion', {rpVersion: version})
        }
        const root = createRoot(container);
        root.render(
            <VersionContext.Provider value={version}>
                <LocationContext.Provider value={{ href: location.href, search: location.search, origin: location.origin }}>
                    <MantineProvider>
                            <Component action={action} maps_api_key={maps_api_key} timezone_api_key={timezone_api_key} bitly_token={bitly_token} />
                    </MantineProvider>
                </LocationContext.Provider>
            </VersionContext.Provider>
        )
    };

    render(TopLevel);
}
