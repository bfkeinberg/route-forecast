const Sentry = require('@sentry/node')
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

if (process.env.NODE_ENV !== 'development') {
    Sentry.init({
        dsn: 'https://ea4c472ff9054dab8c18d594b95d8da2@sentry.io/298059',
        integrations: [
            nodeProfilingIntegration()
        ],
        tracesSampleRate: 0.15,
        // Set sampling rate for profiling
        // This is relative to tracesSampleRate
        profilesSampleRate: 0.2
    });
} else {
}
