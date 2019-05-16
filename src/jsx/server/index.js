const express = require('express');
const app = express();
import 'source-map-support/register';
const expressStaticGzip = require("express-static-gzip");
import thunkMiddleware from 'redux-thunk';

const path = require('path');
import fetch from 'node-fetch';
import { renderToString } from 'react-dom/server';
import React from 'react';
import bodyParser from 'body-parser';
const multer = require('multer'); // v1.0.5
const upload = multer(); // for parsing multipart/form-data
import callWeatherService from './weatherCalculator';
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

    /*
        keyFilename: 'gcp_key.json',
        prefix: 'myservice',
        serviceContext: {
            service: 'myservice',
            version: 'dev'
        }
    */
    });
}

import reducer from '../reducers/reducer';
import {applyMiddleware, createStore} from 'redux';
var compression = require('compression');
import TopLevel from '../app/topLevel';
import LocationContext from '../locationContext';

// for hot reloading
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';

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

    const rwgpsUrl = `https://ridewithgps.com/${routeType}/${routeNumber}.json?apikey=${rwgpsApiKey}`;
    // check status below and retry with opposite route type if it failed, as python version does
    fetch(rwgpsUrl).then(fetchResult => {if (!fetchResult.ok) {throw Error(fetchResult.status)} return fetchResult.text()})
        .then(body => res.status(200).send(body))
        .catch(err => {console.log(`first fetch threw ${JSON.stringify(err)}`);fetch(`https://ridewithgps.com/${routeType==='trips'?'routes':'trips'}/${routeNumber}.json?apikey=${rwgpsApiKey}`).
                then(retryResult => {if (!retryResult.ok) {throw Error('No such route')} return retryResult.text()}).
                then(body => res.status(200).send(body)).
                catch(err => res.status(500).json({'status':err}))});
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
    return strava.oauth.getRequestAccessURL({state:encodeURIComponent(state)});
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
    console.info('redirect to',getStravaAuthUrl(baseUrl, state));
    res.redirect(getStravaAuthUrl(baseUrl, state));

});

app.get('/stravaAuthReply', async (req,res) => {
    const code = req.query.code;
    if (code === undefined) {
        res.status(400).json({'status':'Bad Strava auth reply'});
        return;
    }
    console.log('code',code);
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
        .catch(error => {res.status(400).json({'status':`Bad Strava auth reply ${error}`})});
    process.env.STRAVA_ACCESS_TOKEN = token.access_token;
    restoredState.strava_token = process.env.STRAVA_ACCESS_TOKEN;
    restoredState.strava_error = error;
    res.redirect(url.format('/?') + querystring.stringify(restoredState));
});

app.get('/', (req, res) => {
    console.log('in / handler');
    const action = '/forecast';     // TODO: use common variable between express and browser side

    const search = req.url.substring(req.url.indexOf('?'));
    const href = url.format({
        protocol: req.protocol,
        host: req.get('host'),
        path: req.originalUrl,
        search:search});
    const origin = url.format({
        protocol: req.protocol,
        host: req.get('host')});
    if (!process.env.ENABLE_SSR) {
        console.warn(`SSR disabled`);
        const ejsVariables = {
            'maps_key': process.env.MAPS_KEY,
            'timezone_api_key': process.env.TIMEZONE_API_KEY,
            'bitly_token':process.env.BITLY_TOKEN,
            'preloaded_state':'',
            'reactDom': '',
            delimiter: '?'
        };
        res.render('index', ejsVariables)
    } else {
        logger.warn('SSR enabled');
        const store = createStore(reducer, undefined, applyMiddleware(thunkMiddleware));

        const reactDom = renderToString(
            <LocationContext.Provider value={{href:href,search:search,origin:origin}}>
                <TopLevel serverStore={store} action={action} maps_api_key={process.env.MAPS_KEY} timezone_api_key={process.env.TIMEZONE_API_KEY}/>
            </LocationContext.Provider>
        );
        const ejsVariables = {
            'maps_key':process.env.MAPS_KEY,
            'timezone_api_key':process.env.TIMEZONE_API_KEY,
            'bitly_token':process.env.BITLY_TOKEN,
            'reactDom':reactDom,
            'preloaded_state':JSON.stringify(store.getState()).replace(/</g, '\\u003c'),
            delimiter: '?'
        };
        res.render('index', ejsVariables);
    }
});

if (process.env.NODE_ENV !== 'production' && !process.env.NO_HOT) {
    console.info('Debug mode, enabling hot reloading');
    const config = require('webpack.hot.dev.js');
    const compiler = webpack(config({},{mode:'development'}));
    app.use(webpackDevMiddleware(compiler, {writeToDisk: true, publicPath: config({}, undefined).output.publicPath}));
    app.use(require("webpack-hot-middleware")(compiler));
}
if (!process.env.NO_LOGGING) {
    app.use(errorLogger);
}

const port = process.env.PORT || 8080;
app.listen(port, () =>
    console.info(`Route forecast server listening on port ${port}!`)
);