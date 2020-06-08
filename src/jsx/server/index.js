/* eslint-disable max-lines */
const express = require('express');
const app = express();
require('source-map-support').install();
const expressStaticGzip = require("express-static-gzip");

const path = require('path');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const multer = require('multer'); // v1.0.5
const upload = multer(); // for parsing multipart/form-data
const callWeatherService = require('./weatherCalculator');
const url = require('url');
var strava = require('strava-v3');
const querystring = require('querystring');
let winston = null;
let expressWinston = null;
let logger = console;
let StackdriverTransport = null;
if (!process.env.NO_LOGGING) {
    winston = require('winston');
    expressWinston = require('express-winston');
    const {LoggingWinston} = require('@google-cloud/logging-winston');
    const loggingWinston = new LoggingWinston({projectId: 'route-forecast'});

    logger = winston.createLogger({
        level: 'info',
        transports: [
            new winston.transports.Console(),
            // Add Stackdriver Logging
            loggingWinston
        ]
    });
    StackdriverTransport = new LoggingWinston({
        projectId: 'route-forecast'

    // keyFilename: 'gcp_key.json',
    // prefix: 'myservice',
    // serviceContext: {
    // service: 'myservice',
    // version: 'dev'
    // }
    });
}

var compression = require('compression');

const colorize = process.env.NODE_ENV !== 'production';

app.use(compression());

let requestLogger = null;
let errorLogger = null;
if (!process.env.NO_LOGGING) {
    // Logger to capture all requests and output them to the console.
    // [START requests]

    requestLogger = expressWinston.logger({
        transports: [
            StackdriverTransport,
            new winston.transports.Console({
                json: false,
                colorize: colorize
            })
        ],
        expressFormat: true,
        meta: false
    });
    // [END requests]

    // Logger to capture any top-level errors and output json diagnostic info.
    // [START errors]
    errorLogger = expressWinston.errorLogger({
        transports: [
            StackdriverTransport,
            new winston.transports.Console({
                json: true,
                colorize: colorize
            })
        ]
    });
    // [END errors]

    app.use(requestLogger);
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// redirect bare domain
app.use(require('express-naked-redirect')());
const publicPath = express.static(path.resolve(__dirname, '../static'),{fallthrough:false,index:false});
app.use('/static', expressStaticGzip(path.resolve(__dirname,'../'), {
    enableBrotli: true,
    orderPreference: [
        'br',
        'gz'
    ]
}));
app.use('/static',publicPath);

// ejs
app.set('views', path.resolve(__dirname,'views'));
app.set('view engine', 'ejs');

const isValidRouteResult = (body, type) => {
    if (body !== undefined) {
        let obj = JSON.parse(body);
        if (type === 'routes' && obj.type === 'route') {
            return true;
        }
        if (type === 'trips' && obj.type === 'trip') {
            return true;
        }
    }
    return false;
};

app.use((req, res, next) => {
    // Switch to randoplan.com
    var host = req.hostname;
    logger.info(`host = ${host}`);
    logger.info(`original url ${req.originalUrl}`);
    if (host === 'www.cyclerouteforecast.com') {
        return res.redirect(301, 'https://www.randoplan.com' + req.originalUrl);
    }
    return next();
});

app.get('/rwgps_route', (req, res) => {
    const routeNumber = req.query.route;
    if (routeNumber === undefined) {
        res.status(400).json("{'status': 'Missing route number'}");
        return;
    }
    const isTrip = req.query.trip;
    const routeType = isTrip===true ? 'trips' : 'routes';
    const rwgpsApiKey = process.env.RWGPS_API_KEY;
    if (rwgpsApiKey === undefined) {
        res.status(500).json({'details': 'Missing rwgps API key'});
        return;
    }

    const rwgpsUrl = `https://ridewithgps.com/${routeType}/${routeNumber}.json?apikey=${rwgpsApiKey}&version=2`;
    const memoryUsage = process.memoryUsage();
    console.info(`Memory usage before fetching route: ${JSON.stringify(memoryUsage)}`);
    fetch(rwgpsUrl).then(fetchResult => {if (!fetchResult.ok) {throw Error(fetchResult.status)} return fetchResult.text()})
        .then(body => {if (!isValidRouteResult(body, routeType)) {res.status(401).send(body)} else {res.status(200).send(body)}})
        .catch(err => {res.status(err.message).json({'status':err})});
    console.info(`Memory usage after fetching route: ${JSON.stringify(memoryUsage)}`);
});

app.post('/forecast', upload.none(), (req, res) => {
    if (req.body.locations === undefined) {
        res.status(400).json("{'status': 'Missing location key'}");
        return;
    }
    if (req.body.timezone === undefined) {
        res.status(400).json("{'status': 'Missing timezone key'}");
        return;
    }
    const forecastPoints = JSON.parse(req.body.locations);
    if (!process.env.NO_LOGGING) {
        logger.info(`Request from ${req.ip} for ${forecastPoints.length} forecast points`);
    }
    if (forecastPoints.length > 75) {
        res.status(400).json({'details': 'Invalid request, increase forecast time interval'});
        return;
    }

    let zone = req.body.timezone;

    try {
        const resultPromises = forecastPoints.map(point => {return callWeatherService(point.lat, point.lon, point.time, point.distance, zone, point.bearing)});
        Promise.all(resultPromises).then(result => {res.status(200).json({'forecast':result})},
            error => res.status(500).json({'details':`Error calling weather service : ${error}`}));
    } catch (error) {
        res.status(500).json({'details':`Error calling weather service : ${error}`});
    }
});

const getBitlyShortenedUrl = (accessToken, longUrl) => {
    return fetch(`https://api-ssl.bitly.com/v4/groups`, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
        }
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        throw Error(`Bitly groupid fetch failed with ${response.status} ${response.statusText}`);
    }
    ).
    then(responseJson => {
        if (!responseJson.groups) {
            throw Error(`Bitly is probably mad at authentication for some reason; failed with message ${responseJson.message}`);
        }
        const groupID = responseJson.groups[0].guid;

        return fetch('https://api-ssl.bitly.com/v4/shorten', {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                "long_url": longUrl,
                "group_guid": groupID
            })
        }).then(response => {
            if (response.ok) {
                return response.json();
            }
            throw Error(`Bitly link creation failed with ${response.status} ${response.statusText}`);
        }).
        then(responseJson => {
            if (responseJson.link) {
                return {error: null, url: responseJson.link};
            }
            throw Error(`Bitly is mad for some reason: ${responseJson.message}`);
        })
    }).
    catch(error => ({error: error.toString(), url: null}));
};

app.post('/bitly', async (req, res) => {
    const longUrl = req.body.longUrl;
    const {error, url} = await getBitlyShortenedUrl(process.env.BITLY_TOKEN, longUrl);
    res.json({error, url})
});

const getStravaAuthUrl = (baseUrl,state) => {
    process.env.STRAVA_REDIRECT_URI = baseUrl + '/stravaAuthReply';
    return strava.oauth.getRequestAccessURL({scope:'activity:read_all', state:encodeURIComponent(state)});
};

const getStravaToken = (code) => {
    process.env.STRAVA_ACCESS_TOKEN = 'fake';
    return new Promise((resolve, reject) => {
        strava.oauth.getToken(code, (err,payload) => {if (err !== null) {reject(err.msg)} else {resolve(payload)}});
    });
};

app.get('/stravaAuthReq', (req,res) => {
    const state = req.query.state;
    if (state === undefined) {
        res.status(400).json({'status': 'Missing keys'});
        return;
    }
    const baseUrl = url.format({
        protocol: req.protocol,
        host: req.get('host')});
    res.redirect(getStravaAuthUrl(baseUrl, state));

});

app.get('/stravaAuthReply', async (req,res) => {
    const code = req.query.code;
    if (code === undefined) {
        res.status(400).json({'status':'Bad Strava auth reply'});
        return;
    }
    const error = req.query.error;
    const state = req.query.state;
    let restoredState = {};
    if (state !== undefined && state !== '') {
        restoredState = JSON.parse(decodeURIComponent(state));
    }
    if (error !== undefined) {
        console.error(`Strava authentication error ${error}`);
    }
    process.env.STRAVA_CLIENT_SECRET = process.env.STRAVA_API_KEY;
    const token = await getStravaToken(code)
        .catch(error => {console.log('got bad auth reply');res.status(400).json({'status':`Bad Strava auth reply ${error}`})});
    // process.env.STRAVA_ACCESS_TOKEN = token.body.access_token;
    restoredState.strava_access_token = token.body.access_token;
    restoredState.strava_error = error;
    restoredState.strava_refresh_token = token.body.refresh_token;
    restoredState.strava_token_expires_at = token.body.expires_at;
    res.redirect(url.format('/?') + querystring.stringify(restoredState));
});

app.get('/refreshStravaToken', async (req,res) => {
    const refreshToken = req.query.refreshToken;
    if (refreshToken === undefined) {
        res.status(400).json({'status':'Bad call to refresh Strava token'});
        return;
    }
    process.env.STRAVA_CLIENT_SECRET = process.env.STRAVA_API_KEY;
    let refreshResult = await strava.oauth.refreshToken(refreshToken);
    res.status(200).json(refreshResult);
});

app.get('/', (req, res) => {
    const ejsVariables = {
        'maps_key': process.env.MAPS_KEY,
        'timezone_api_key': process.env.TIMEZONE_API_KEY,
        'bitly_token': process.env.BITLY_TOKEN,
        'preloaded_state': '',
        'reactDom': '',
        delimiter: '?'
    };
    res.render('index', ejsVariables)
});
if (!process.env.NO_LOGGING) {
    app.use(errorLogger);
}

const port = process.env.PORT || 8080;
app.listen(port, () =>
    console.info(`Route forecast server listening on port ${port}!`)
);