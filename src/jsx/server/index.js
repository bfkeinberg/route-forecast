const express = require('express');
const app = express();

console.log('ip',app.get('ip'));
// Activate Google Cloud Trace and Debug when in production
if (process.env.NODE_ENV === 'production') {
    require('@google-cloud/trace-agent').start();
    require('@google-cloud/debug-agent').start();
}

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
const winston = require('winston');
const expressWinston = require('express-winston');
const StackdriverTransport = require('@google-cloud/logging-winston').LoggingWinston;
import Prefixer from 'inline-style-prefixer';
import reducer from '../reducers/reducer';
import {createStore} from 'redux';

import TopLevel from '../app/topLevel';
import LocationContext from '../locationContext';

// for hot reloading
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
const config = require('webpack.hot.dev.js');

const colorize = process.env.NODE_ENV !== 'production';

// Logger to capture all requests and output them to the console.
// [START requests]
const requestLogger = expressWinston.logger({
    transports: [
        new StackdriverTransport(),
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
const errorLogger = expressWinston.errorLogger({
    transports: [
        new StackdriverTransport(),
        new winston.transports.Console({
            json: true,
            colorize: colorize
        })
    ]
});
// [END errors]

app.use(requestLogger);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// redirect bare domain
app.use(require('express-naked-redirect')());
const publicPath = express.static('dist/static',{fallthrough:false,index:false});
app.use('/static',publicPath);

// ejs
app.set('views', 'dist/server/views');
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
    fetch(rwgpsUrl).then(fetchResult => {if (!fetchResult.ok) {throw Error(fetchResult.size)} return fetchResult.json()})
        .then(body => res.status(200).json(body))
        .catch(err => {fetch(`https://ridewithgps.com/${routeType==='trips'?'routes':'trips'}/${routeNumber}.json?apikey=${rwgpsApiKey}`).
                then(retryResult => {if (!retryResult.ok) {throw Error('No such route')} return retryResult.json()}).
                then(body => res.status(200).json(body)).
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
    console.info(`Request from ${req.ip} for ${forecastPoints.length} forecast points`);
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

const getStravaAuthUrl = (baseUrl,state) => {
    process.env.STRAVA_REDIRECT_URI = baseUrl + '/stravaAuthReply';
    return strava.oauth.getRequestAccessURL({state:encodeURIComponent(state)});
};

const getStravaToken = (code) => {
    process.env.STRAVA_ACCESS_TOKEN = 'fake';
    return new Promise((resolve, reject) => {
        strava.oauth.getToken(code, (err,payload,limits) => {if (err !== null) {reject(err.msg)} else {resolve(payload)}});
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
    const action = '/forecast';     // TODO: use common variable between express and browser sideif (typeof window === 'undefined') {

    const search = req.url.substring(req.url.indexOf('?'));
    const href = url.format({
        protocol: req.protocol,
        host: req.get('host'),
        path: req.originalUrl,
        search:search});
    const origin = url.format({
        protocol: req.protocol,
        host: req.get('host')});
    const prefixer = new Prefixer({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36' });
    const store = createStore(reducer);

    const reactDom = renderToString(
        <LocationContext.Provider value={{href:href,search:search,origin:origin, prefixer:prefixer}}>
            <TopLevel serverStore={store} action={action} maps_api_key={process.env.MAPS_KEY} timezone_api_key={process.env.TIMEZONE_API_KEY}/>
        </LocationContext.Provider>
    );
    const ejsVariables = {
        'maps_key':process.env.MAPS_KEY,
        'timezone_api_key':process.env.TIMEZONE_API_KEY,
        'reactDom':reactDom,
        'preloaded_state':JSON.stringify(store.getState()).replace(/</g, '\\u003c'),
        delimiter: '?'
    };
    res.render('index', ejsVariables);
});

if (process.env.NODE_ENV !== 'production') {
    const compiler = webpack(config({},{mode:'development'}));
    app.use(webpackDevMiddleware(compiler, {writeToDisk: true, publicPath: config({}, undefined).output.publicPath}));
    app.use(require("webpack-hot-middleware")(compiler));
}
app.use(errorLogger);

const port = process.env.port || 8080;
app.listen(port, () =>
    console.log(`Route forecast server listening on http://localhost:${port}!`)
);