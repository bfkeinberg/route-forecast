// Activate Google Cloud Trace and Debug when in production
if (process.env.NODE_ENV === 'production') {
    require('@google-cloud/trace-agent').start({serviceContext: {enableCanary:false}});
    require('@google-cloud/debug-agent').start({serviceContext: {enableCanary:false}});
}