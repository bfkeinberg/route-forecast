const Sentry = require('@sentry/node')

if (process.env.NODE_ENV !== 'development') {
    Sentry.init({
        dsn: 'https://ea4c472ff9054dab8c18d594b95d8da2@sentry.io/298059',
        integrations: [
        ],
        tracesSampleRate: 0.15
    });
} else {
}
