// Activate Google Cloud Trace and Debug when in production
if (process.env.NODE_ENV === 'production') {
    // require('@google-cloud/trace-agent').start({projectId:'route-forecast',keyFilename:'route-forecast-c4075d06140e.json'});
    // require('@google-cloud/debug-agent').start({projectId:'route-forecast',keyFilename:'route-forecast-c4075d06140e.json'});
}