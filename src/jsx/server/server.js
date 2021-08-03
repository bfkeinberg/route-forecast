/* eslint-disable max-lines */
const express = require('express');
const app = express();
require('source-map-support').install();
const expressStaticGzip = require("express-static-gzip");

const path = require('path');
const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const multer = require('multer'); // v1.0.5
const upload = multer({
    limits: { fieldSize: 2 * 1024 * 1024 }
}); // for parsing multipart/form-data
const callWeatherService = require('./weatherForecastDispatcher');
const url = require('url');
var strava = require('strava-v3-alpaca');
const {Datastore} = require('@google-cloud/datastore');
const cors = require('cors');
const axios = require('axios');

const querystring = require('querystring');
let winston = null;
let expressWinston = null;
let logger = console;
let StackdriverTransport = null;
if (!process.env.NO_LOGGING) {
    require('./logging');
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
app.set('trust proxy', true);
// Instantiate a datastore client
const datastore = new Datastore();

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

const makeRecord = (point, routeNumber) => {
    // Create a visit record to be stored in the database
    return {
        timestamp: new Date(),
        routeNumber: routeNumber===undefined?null:routeNumber,
        latitude: point.lat,
        longitude: point.lon
    };
}

const insertRecord = (record, routeName) => {
    return datastore.save({
        key: datastore.key([
            'RouteName',
            routeName
        ]),
        data: record
    });
};

const getVisits = () => {
    const query = datastore
    .createQuery('RouteName')
    .order('timestamp', {descending: true});

    return datastore.runQuery(query);
};

app.get('/dbquery', cors(), async (req, res) => {
    const [entities] = await getVisits();
    const visits = entities.map(
        entity => JSON.stringify({"Time":entity.timestamp, "RouteName":entity[datastore.KEY].name, "RouteNumber":entity.routeNumber,
            "Latitude":entity.latitude, "Longitude":entity.longitude})
                                );
    res
       .status(200)
       .set('Content-Type', 'text/plain')
       .send(`[\n${visits.join(',\n')}]`)
       .end();
});

const getOldUrlCalls = () => {
    const query = datastore
    .createQuery('OldUrl')
    .order('timestamp', {descending: true});

    return datastore.runQuery(query);
};

app.get('/get_redirects', cors(), async (req, res) => {
    const [entities] = await getOldUrlCalls();
    const visits = entities.map(
        entity => JSON.stringify({"Time":entity.timestamp, "From":entity.caller,
            "Host":entity.caller})
                                );
    res
       .status(200)
       .set('Content-Type', 'text/plain')
       .send(`[\n${visits.join(',\n')}]`)
       .end();
});

app.use((req, res, next) => {
    // Switch to randoplan.com
    var host = req.hostname;
    const originalHost = req.header('X-Forwarded-Host');
    console.info(`headers ${JSON.stringify(req.headers)}`);
    console.info(`Forwarded host is ${originalHost}`);
    if (originalHost === 'www.cyclerouteforecast.com' || originalHost === 'cyclerouteforecast.com') {
        datastore.save({key:datastore.key('OldUrl'), data:{caller:req.header('X-Forwarded-For')}});
    }
    if (host === 'www.cyclerouteforecast.com' || host === 'route-forecast.ue.r.appspot.com' ||
        host === 'route-forecast.appspot.com' ||
        host === 'cyclerouteforecast.com' || host === 'randoplan.com') {
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
    const isTrip = req.query.trip==="true";
    const routeType = isTrip===true ? 'trips' : 'routes';
    const rwgpsApiKey = process.env.RWGPS_API_KEY;
    if (rwgpsApiKey === undefined) {
        res.status(500).json({'details': 'Missing rwgps API key'});
        return;
    }

    const rwgpsUrl = `https://ridewithgps.com/${routeType}/${routeNumber}.json?apikey=${rwgpsApiKey}&version=2`;
    fetch(rwgpsUrl).then(fetchResult => {if (!fetchResult.ok) {throw Error(fetchResult.status)} return fetchResult.text()})
        .then(body => {if (!isValidRouteResult(body, routeType)) {res.status(401).send(body)} else {res.status(200).send(body)}})
        .catch(err => {res.status(err.message).json({'status':err})});
});

app.post('/forecast', upload.none(), async (req, res) => {
    if (req.body.locations === undefined) {
        res.status(400).json({'status': 'Missing location key'});
        return;
    }
    if (req.body.timezone === undefined || req.body.timezone === 'undefined') {
        res.status(400).json({'status': 'Missing timezone key'});
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
    let service = process.env.WEATHER_SERVICE;
    if (req.body.service !== undefined) {
        service = req.body.service;
    }
    if (req.body.routeName !== undefined && req.body.routeName !== '') {
        let dbRecord = makeRecord(forecastPoints[0], req.body.routeNumber);
        insertRecord(dbRecord, req.body.routeName);
    }
    const zone = req.body.timezone;
    try {
        let results = [];
        while (forecastPoints.length > 0) {
            let point = forecastPoints.shift();
            // eslint-disable-next-line no-await-in-loop
            results.push(await callWeatherService(service, point.lat, point.lon, point.time, point.distance, zone, point.bearing));
        }
        res.status(200).json({'forecast':results});
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
    if (baseUrl === 'http://www.route-forecast.appspot.com' || baseUrl === 'https://www.route-forecast.appspot.com') {
        process.env.STRAVA_REDIRECT_URI = 'https://www.randoplan.com/stravaAuthReply';
    } else {
        process.env.STRAVA_REDIRECT_URI = baseUrl + '/stravaAuthReply';
    }
    return strava.oauth.getRequestAccessURL({scope:'activity:read_all', state:encodeURIComponent(state)});
};

const getStravaToken = (code) => {
    process.env.STRAVA_ACCESS_TOKEN = 'fake';
    return new Promise((resolve, reject) => {
        strava.oauth.getToken(code, (err,payload) => {if (err !== null) {reject(err.msg)} else {resolve(payload)}});
    });
};

const insertFeatureRecord = (record, featureName, user) => {
    return datastore.save({
        key: datastore.key([
            featureName,
            user
        ]),
        data: record
    });
};

app.get('/stravaAuthReq', (req,res) => {
    const state = req.query.state;
    if (state === undefined) {
        res.status(400).json({'status': 'Missing keys'});
        return;
    }
    let restoredState = JSON.parse(decodeURIComponent(state));
    insertFeatureRecord({
        timestamp: new Date(),
        routeNumber: restoredState.rwgpsRoute===undefined?null:restoredState.rwgpsRoute
    },
        "strava");
    const baseUrl = url.format({
        protocol: req.protocol,
        host: req.get('host')});
    res.redirect(getStravaAuthUrl(baseUrl, state));

});

app.get('/stravaAuthReply', async (req,res) => {
    const code = req.query.code;
    let error = req.query.error;
    if (error === undefined && code === undefined) {
        error = 'Strava authentication denied';
    }
    const state = req.query.state;
    let restoredState = {};
    if (state !== undefined && state !== '') {
        restoredState = JSON.parse(decodeURIComponent(state));
    }
    if (error === undefined) {
        process.env.STRAVA_CLIENT_SECRET = process.env.STRAVA_API_KEY;
        const token = await getStravaToken(code)
            .catch(error => {console.log('got bad auth reply');res.status(400).json({'status':`Bad Strava auth reply ${error}`})});
        // process.env.STRAVA_ACCESS_TOKEN = token.body.access_token;
        restoredState.strava_access_token = token.body.access_token;
        restoredState.strava_refresh_token = token.body.refresh_token;
        restoredState.strava_token_expires_at = token.body.expires_at;
    }
    else {
        restoredState.strava_activity = undefined;
    }
    restoredState.strava_error = error;
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
    try {
        res.render('index', ejsVariables)
    } catch (err) {
        console.info(err);
    }
});
if (!process.env.NO_LOGGING) {
    app.use(errorLogger);
}

const makeFeatureRecord = (response) => {
    // Create a visit record to be stored in the database
    console.info(`${response.data.user.email} used the feature`);
    return {
        timestamp: new Date(),
        email: response.data.user.email,
        first_name: response.data.user.first_name,
        last_name: response.data.user.last_name
    };
}

const fetchRouteName = async (id, type) => {
    const rwgpsApiKey = process.env.RWGPS_API_KEY;
    const url = `https://ridewithgps.com/${type}s/${id}.json?apikey=${rwgpsApiKey}&version=2`;
    try {
        const response = await axios.get(url);
        return response.data[type].name;
    } catch (err) {
        console.error(err);
        return '';
    }
};

const retrieveNames = (pinned) => {
    pinned.sort((el1,el2) => Number(el2.id)-Number(el1.id));
    return pinned.map(async fav => {fav.name = await fetchRouteName(fav.associated_object_id, fav.associated_object_type);return fav});
};

app.get('/pinned_routes', async (req, res) => {
    const rwgpsApiKey = process.env.RWGPS_API_KEY;
    const username = req.query.username;
    const password = req.query.password;
    if (username === undefined || username === '') {
        res.status(400).json("{'status': 'Missing username'}");
        return;
    }
    if (password === undefined || password === '') {
        res.status(400).json("{'status': 'Missing password'}");
        return;
    }
    if (rwgpsApiKey === undefined) {
        res.status(500).json({'details': 'Missing rwgps API key'});
        return;
    }
    const url = `https://ridewithgps.com/users/current.json?apikey=${rwgpsApiKey}&version=2&email=${req.query.username}&password=${req.query.password}`;
    try {
        const response = await axios.get(url);
        insertFeatureRecord(makeFeatureRecord(response), "pinned", response.data.user.email);
        res.status(200).json(await Promise.all(await retrieveNames(response.data.user.slim_favorites)));
    } catch (err) {
        console.log(`EXCEPTION: ${err}`);
        res.status(err.response.status).json(err.response.data);
    }
});

const getFeatureVisits = (featureName) => {
    const query = datastore
    .createQuery(featureName)
//    .filter('__key__', '=', datastore.key(featureName)
    .order('timestamp', {descending: true});

    return datastore.runQuery(query);
};

app.get('/queryfeature', cors(), async (req, res) => {
    if (req.query.feature === undefined) {
        res.status(400).send("Missing feature name");
        return;
    }
    const [entities] = await getFeatureVisits(req.query.feature);
    const visits = entities.map(
        entity => JSON.stringify({"Time":entity.timestamp, "Email":entity.email, "FirstName":entity.first_name,
            "LastName":entity.last_name, "Route":entity.routeNumber})
                                );
    res
       .status(200)
       .set('Content-Type', 'text/plain')
       .send(`[\n${visits.join(',\n')}]`)
       .end();
});

module.exports = app;