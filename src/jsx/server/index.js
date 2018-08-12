const express = require('express');
const app = express();
const path = require('path');
import fetch from 'node-fetch';
import { renderToString } from 'react-dom/server';
import ejs from 'ejs';
import bodyParser from 'body-parser';
const multer = require('multer'); // v1.0.5
const upload = multer(); // for parsing multipart/form-data
import callWeatherService from './weatherCalculator';
const url = require('url');
var strava = require('strava-v3');

const winston = require('winston');
const expressWinston = require('express-winston');
const StackdriverTransport = require('@google-cloud/logging-winston').LoggingWinston;

// for hot reloading
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
const config = require('../../webpack.dev.js');

// Activate Google Cloud Trace and Debug when in production
if (process.env.NODE_ENV === 'production') {
    require('@google-cloud/trace-agent').start();
    require('@google-cloud/debug-agent').start();
}

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

const publicPath = express.static(path.join(__dirname + '/../static'),{fallthrough:false,index:false});
app.use('/static',publicPath);

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
    console.log(rwgpsUrl);
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
    return strava.oauth.getRequestAccessURL(state);
};

app.get('/stravaAuthRequest', (req,res) => {
    console.info('Authenticating with Strava');
    const state = req.query.state;
    if (state === undefined) {
        res.status(400).json({'status': 'Missing keys'});
        return;
    }
    const baseUrl = url.format({
        protocol: req.protocol,
        host: req.get('host')});
    const authUri = getStravaAuthUrl(baseUrl, state);
    console.info('Strava auth uri',authUri);
    res.redirect(authUri);

});

app.get('/stravaAuthReply', (req,res) => {
    console.info('incoming authentication reply');
    const code = req.query.code;
    const error = req.query.error;
    const state = req.query.state;
    let restoredState = {};
    if (state !== undefined) {
        restoredState = JSON.parse(state);
    }
    if (error !== undefined) {
        console.error(`Strava authentication error ${error}`);
    }
    process.env.STRAVA_CLIENT_SECRET = process.env.STRAVA_API_KEY;
});

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname + '/../index.html');
    const ejsVariables = {
        'maps_key':process.env.MAPS_KEY,
        'timezone_api_key':process.env.TIMEZONE_API_KEY
    };
    ejs.renderFile(indexPath,
        ejsVariables, {delimiter:'?'},
        (err, str) => {
            if (err != null) {
                res.status(500).json({'details':err});
                return;
            }
            res.send(str);
            // res.send(renderToString(str));
        }
    );
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