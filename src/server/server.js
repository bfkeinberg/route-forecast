/* eslint-disable max-lines */
require('./instrument');
const express = require('express');
const app = express();
const apicache = require('node-cache-32')
require('source-map-support').install();
const expressStaticGzip = require("express-static-gzip");

const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const bodyParser = require('body-parser');
const multer = require('multer'); // v1.0.5
const upload = multer({
    limits: { fieldSize: 2 * 1024 * 1024 }
}); // for parsing multipart/form-data
const callWeatherService = require('./weatherForecastDispatcher');
const url = require('url');
const strava = require('strava-v3');
const { Datastore } = require('@google-cloud/datastore');
const cors = require('cors');
const axios = require('axios');
const getPurpleAirAQI = require('./purpleAirAQI');
const getAirNowAQI = require('./airNowAQI');
const querystring = require('querystring');
const Sentry = require('@sentry/node');

let logger = console;
var compression = require('compression');

app.use(compression());
app.set('trust proxy', true);
// Instantiate a datastore client
const datastore = new Datastore();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const publicPath = express.static(path.resolve(__dirname, '../static'), { fallthrough: false, index: false });
app.use('/static', expressStaticGzip(path.resolve(__dirname, '../'), {
    enableBrotli: true,
    orderPreference: [
        'br',
        'gz'
    ]
}));
app.use('/static', publicPath);

app.get('/worker.js', (req, res) => {
    res.sendFile(path.resolve(__dirname,'../static/worker.js'));
})

app.get('/lib/localforage.js', (req, res) => {
    res.sendFile(path.resolve(__dirname,'../static/lib/localforage.js'));
})

// ejs
app.set('views', path.resolve(__dirname, 'views'));
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
        routeNumber: routeNumber === undefined ? null : routeNumber,
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
        .order('timestamp', { descending: true });

    return datastore.runQuery(query);
};

app.get('/dbquery', cors(), async (req, res) => {
    const [entities] = await getVisits();
    const visits = entities.map(
        entity => JSON.stringify({
            "Time": entity.timestamp, "RouteName": entity[datastore.KEY].name, "RouteNumber": entity.routeNumber,
            "Latitude": entity.latitude, "Longitude": entity.longitude
        })
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
        .order('timestamp', { descending: true });

    return datastore.runQuery(query);
};

app.get('/get_redirects', cors(), async (req, res) => {
    const [entities] = await getOldUrlCalls();
    console.info(`entities ${JSON.stringify(entities)}`);
    const visits = entities.map(
        entity => JSON.stringify({
            "Time": entity.timestamp, "From": entity.caller,
            "Host": entity.caller
        })
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
    // const originalHost = req.header('host');
    // console.info(`Forwarded host is ${originalHost} request host is ${host}`);
    if (host === 'randoplan.herokuapp.com' || host === 'randoplan.com') {
        logger.info(`Redirected ${host} to www.randoplan.com`);
        return res.redirect(301, 'https://www.randoplan.com' + req.originalUrl);
    }
    return next();
});

const buildRouteUrl = (routeNumber,apiKey) => {
    const privacyCodeLoc = routeNumber.indexOf('?privacy_code')
    if (privacyCodeLoc === -1) {
        return `${routeNumber}.json?apikey=${apiKey}&version=2`
    }
    return `${routeNumber.substring(0,privacyCodeLoc)}.json${routeNumber.substring(privacyCodeLoc)}&apikey=${apiKey}&version=2`
}

app.get('/rwgps_route', (req, res) => {
    const routeNumber = req.query.route;
    if (routeNumber === undefined) {
        res.status(400).json({'status': 'Missing route number'})
        return;
    }
    console.log(`request for route ${routeNumber}`);
    const isTrip = req.query.trip === "true";
    const routeType = isTrip === true ? 'trips' : 'routes';
    const rwgpsApiKey = process.env.RWGPS_API_KEY;
    if (rwgpsApiKey === undefined) {
        res.status(500).json({ 'details': 'Missing rwgps API key' });
        return;
    }
    const token = req.query.token;
    const headers = {};
    if (token !== undefined) {
        headers.Authorization = `Bearer ${token}`;
    }

    const rwgpsUrl = `https://ridewithgps.com/${routeType}/${buildRouteUrl(routeNumber,rwgpsApiKey)}    `;
    fetch(rwgpsUrl,{headers:headers}).then(fetchResult => {if (!fetchResult.ok) {throw Error(fetchResult.status)} return fetchResult.text()})
        .then(body => {if (!isValidRouteResult(body, routeType)) {res.status(401).send(body)} else {res.status(200).send(body)}})
        .catch(err => {const status = isNaN(Number.parseInt(err.message,10))?500:Number.parseInt(err.message,10);res.status(status).json({ 'status': JSON.stringify(err) })});
});

app.get('/rusa_perm_id', (req, res) => {
    const permId = req.query.permId
    if (!permId) {
        res.status(400).json({details:"Missing RUSA perm ID"})
    }
    const rusaPermLookupApiKey = process.env.RUSA_PERM_ID_KEY
    if (!rusaPermLookupApiKey) {
        res.status(500).json({ 'details': 'Missing RUSA perm lookup API key' });
        return;
    }
    const rusaLookupUrl = `https://rusa.org/cgi-bin/permsearch_PF.pl?permid=${permId}&output_format=json&apikey=${rusaPermLookupApiKey}`
    fetch(rusaLookupUrl).then(fetchResult =>
        {if (!fetchResult.ok) {throw Error(fetchResult.status)} return fetchResult.json()})
        .then(body => {res.status(200).send(body)})
        .catch(err => {res.status(500).json({'status':JSON.stringify(err)})})
})

const getAQI = (result, point) => {
    return Sentry.startSpan({name: "aqi"}, async () => {
        // eslint-disable-next-line no-await-in-loop
        // result.aqi = await getPurpleAirAQI(point.lat, point.lon);
        let results = await Promise.all([
            getAirNowAQI(point.lat, point.lon),
            getPurpleAirAQI(point.lat, point.lon)
        ])
        result.aqi = results[0] ? results[0] : results[1];
        return result
    })
}
    // add route to display cache performance (courtesy of @killdash9)
app.get('/cache/performance', (req, res) => {
    res.json(apicache.getPerformance())
})
  
  // add route to display cache index
app.get('/cache/index', (req, res) => {
    res.json(apicache.getIndex())
})

let cache = apicache.options(
    {
        trackPerformance:true,
        appendKey: (req, res) => req.body.locations.lat.toString() + req.body.locations.lon.toString() + req.body.locations.time + req.body.service})

app.post('/forecast_one', cache.middleware(), upload.none(), async (req, res) => {
    if (req.body.locations === undefined) {
        res.status(400).json({ 'status': 'Missing location key' });
        return;
    }
    if (req.body.timezone === undefined || req.body.timezone === 'undefined') {
        res.status(400).json({ 'status': 'Missing timezone key' });
        return;
    }
    const forecastPoints = req.body.locations;
    let service = process.env.WEATHER_SERVICE;
    if (req.body.service !== undefined) {
        service = req.body.service;
    }
    if (!process.env.NO_LOGGING) {
        logger.info(`Request from ${req.ip} for single point from ${service}`);
    }
    if (req.body.routeName !== undefined && req.body.routeName !== '' && req.body.which===0) {
        let dbRecord = makeRecord(forecastPoints, req.body.routeNumber);
        try {
            insertRecord(dbRecord, req.body.routeName);
        } catch (err) {
            console.err(`DB call from forecast_one failed with ${err}`)
        }
    }
    const zone = req.body.timezone;
    try {
        const point = forecastPoints
        const result = await callWeatherService(service, point.lat, point.lon, point.time, point.distance, zone, point.bearing, point.isControl).catch(error => {
            throw error;
        })
        if (!process.env.NO_LOGGING) {
            logger.info(`Done with request from ${req.ip}`);
        }
        res.status(200).json({ 'forecast': result });
    } catch (error) {
        if (!process.env.NO_LOGGING) {
            logger.info(`Error with request from ${req.ip}`);
        }
        res.status(500).json({ 'details': `Error calling weather service : ${error}` });
    }
});

app.post('/forecast', upload.none(), async (req, res) => {
    if (req.body.locations === undefined) {
        res.status(400).json({ 'status': 'Missing location key' });
        return;
    }
    if (req.body.timezone === undefined || req.body.timezone === 'undefined') {
        res.status(400).json({ 'status': 'Missing timezone key' });
        return;
    }
    const forecastPoints = JSON.parse(req.body.locations);
    if (!process.env.NO_LOGGING) {
        logger.info(`Request from ${req.ip} for ${forecastPoints.length} forecast points`);
    }
    if (forecastPoints.length > 120) {
        res.status(400).json({ 'details': 'Invalid request, increase forecast time interval' });
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
            const result = await callWeatherService(service, point.lat, point.lon, point.time, point.distance, zone, point.bearing).catch(error => {
                throw error;
            });
            // we explicitly do not want to parallelize to avoid swamping the servers we are calling and being throttled
            results.push(result);
        }
        if (!process.env.NO_LOGGING) {
            logger.info(`Done with request from ${req.ip}`);
        }
        res.status(200).json({ 'forecast': results });
    } catch (error) {
        if (!process.env.NO_LOGGING) {
            logger.info(`Error with request from ${req.ip}`);
        }
        res.status(500).json({ 'details': `Error calling weather service : ${error}` });
    }
});

app.post('/aqi_one', upload.none(), async (req, res) => {
    if (req.body.locations === undefined) {
        res.status(400).json({ 'status': 'Missing location key' });
        return;
    }
    const forecastPoint = req.body.locations
    if (!process.env.NO_LOGGING) {
        logger.info(`AQI request from ${req.ip} for AQI at ${forecastPoint.lat},${forecastPoint.lon}`)
    }
    try {
        let result = {};
        await getAQI(result, forecastPoint);
        res.status(200).json({ 'aqi': result });
    } catch (error) {
        res.status(500).json({ 'details': `Error retrieving AQI : ${JSON.stringify(error)}` });
    }
});

app.post('/aqi', upload.none(), async (req, res) => {
    if (req.body.locations === undefined) {
        res.status(400).json({ 'status': 'Missing location key' });
        return;
    }
    const forecastPoints = JSON.parse(req.body.locations);
    if (!process.env.NO_LOGGING) {
        logger.info(`AQI request from ${req.ip} for ${forecastPoints.length} points`);
    }
    try {
        let results = [];
        while (forecastPoints.length > 0) {
            let point = forecastPoints.shift();
            // we explicitly do not want to parallelize to avoid swamping the servers we are calling and being throttled
            // console.log('waiting for AQI');
            let result = {};
            // eslint-disable-next-line no-await-in-loop
            await getAQI(result, point);
            results.push(result);
        }
        res.status(200).json({ 'forecast': results });
    } catch (error) {
        res.status(500).json({ 'details': `Error retrieving AQI : ${JSON.stringify(error)}` });
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
                return response.json();
            }).
                then(responseJson => {
                    if (responseJson.link) {
                        return { error: null, url: responseJson.link };
                    }
                    throw Error(`Bitly link creation failed with: ${responseJson.message} ${JSON.stringify(responseJson)}`);
                })
        }).
        catch(error => ({ error: error.toString(), url: null }));
};

app.post('/bitly', async (req, res) => {
    const longUrl = req.body.longUrl;
    const { error, url } = await getBitlyShortenedUrl(process.env.BITLY_TOKEN, longUrl);
    res.json({ error, url })
});

const getStravaAuthUrl = (baseUrl, state) => {
    console.log(baseUrl);
    if (baseUrl === 'http://localhost:8080') {
        process.env.STRAVA_REDIRECT_URI = baseUrl + '/stravaAuthReply';
    }
    else {
        process.env.STRAVA_REDIRECT_URI = 'https://www.randoplan.com/stravaAuthReply';
    }
    return strava.oauth.getRequestAccessURL({ scope: 'activity:read_all,read_all', state: encodeURIComponent(state) });
};

const getStravaToken = (code) => {
    process.env.STRAVA_ACCESS_TOKEN = 'fake';
    return new Promise((resolve, reject) => {
        strava.oauth.getToken(code, (err, payload) => {if (err !== null) {reject(err.msg)} else {resolve(payload)}});
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

const randoplan_uri='https://www.randoplan.com/rwgpsAuthReply';
// uncomment the line below and comment the one above when testing pinned route functions locally
// const randoplan_uri='http://localhost:8080/rwgpsAuthReply';

app.get('/rwgpsAuthReq', (req, res) => {
    const state = req.query.state;
    if (state === undefined) {
        res.status(400).json({ 'status': 'Missing OAuth keys for RideWithGPS auth' });
        return;
    }
    const rwgpsBaseOAuth = 'https://ridewithgps.com/oauth/authorize';
    const oauth_client = process.env.RWGPS_OAUTH_CLIENT_ID;
    const rwgpsUrl = `${rwgpsBaseOAuth}?client_id=${oauth_client}&redirect_uri=${randoplan_uri}&response_type=code&state=${state}`;

    res.redirect(rwgpsUrl);
});

const getRwgpsTokenFromCode = async (code) => {
    let response = await axios.post('https://ridewithgps.com/oauth/token.json',{
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env.RWGPS_OAUTH_CLIENT_ID,
        client_secret: process.env.RWGPS_OAUTH_SECRET,
        redirect_uri: randoplan_uri
    }).catch(error => {
        console.info('Error', error);
    });
    if (response !== undefined) {
        return response.data.access_token;
    }
    return null;
};

app.get('/rwgpsAuthReply', async (req, res) => {
    const state = req.query.state;
    let restoredState = {};
    if (state !== undefined && state !== '') {
        try {
            restoredState = JSON.parse(decodeURIComponent(state));
        } catch (error) {
            console.warn(`error in state restored from RWGPS:${error} ${decodeURIComponent(state)}`);
            restoredState = decodeURIComponent(state);
        }
    }
    if (req.query.code !== undefined) {
        const token = await getRwgpsTokenFromCode(req.query.code);
        restoredState.rwgpsToken = token;
        res.redirect(url.format('/?') + querystring.stringify(restoredState));
    } else {
        console.info(`redirected with no code provided - ${JSON.stringify(req.query)}`);
        res.redirect(url.format('/?') + `rwgpsToken=${req.query.token}`);
    }
});

app.get('/stravaAuthReq', (req, res) => {
    const state = req.query.state;
    if (state === undefined) {
        res.status(400).json({ 'status': 'Missing OAuth state from Strava' });
        return;
    }
    try {
        let restoredState = JSON.parse(decodeURIComponent(state.replace(/\+/g, " ")));
        insertFeatureRecord({
            timestamp: new Date(),
            routeNumber: restoredState.rwgpsRoute === undefined ? null : restoredState.rwgpsRoute
        },
            "strava");
    } catch (error) {
        res.status(400).json({'status':`${error} : Invalid OAuth state ${state}`});
        return;
    }
    const baseUrl = url.format({
        protocol: req.protocol,
        host: req.get('host')
    });
    res.redirect(getStravaAuthUrl(baseUrl, state));

});

app.get('/stravaAuthReply', async (req, res) => {
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
        try {
            const token = await getStravaToken(code)
                .catch(error => { console.log('got bad auth reply'); res.status(400).json({ 'status': `Bad Strava auth reply ${error}` }) });
            // process.env.STRAVA_ACCESS_TOKEN = token.body.access_token;
            restoredState.strava_access_token = token.body.access_token;
            restoredState.strava_refresh_token = token.body.refresh_token;
            restoredState.strava_token_expires_at = token.body.expires_at;
        } catch (err) {
            console.log(`got bad auth reply ${err.message}`); 
            res.status(400).json({ 'status': `Bad Strava auth reply ${err.message}` })
            error = err.message
        }
    }
    else {
        restoredState.strava_activity = undefined;
    }
    restoredState.strava_error = error;
    res.redirect(url.format('/?') + querystring.stringify(restoredState));
});

app.get('/refreshStravaToken', async (req, res) => {
    const refreshToken = req.query.refreshToken;
    if (refreshToken === undefined) {
        res.status(400).json({ 'status': 'Bad call to refresh Strava token' });
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
        'sentry_trace_sample_rate': process.env.SENTRY_TRACE_SAMPLE_RATE,
        'preloaded_state': '',
        'reactDom': '',
        delimiter: '?'
    };
    if (Object.keys(req.query).length > 0) {
        console.log(`request query ${JSON.stringify(req.query)}`);
    }
    try {
        res.render('index', ejsVariables)
    } catch (err) {
        console.info(err);
    }
});

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

app.get('/pinned_routes', async (req, res) => {
    const rwgpsApiKey = process.env.RWGPS_API_KEY;
    const token = req.query.token;
    if (token === undefined) {
        res.status(400).json("{'status': 'Missing authentication token'}");
        return;
    }
    if (rwgpsApiKey === undefined) {
        res.status(500).json({ 'details': 'Missing rwgps API key' });
        return;
    }
    let url = `https://ridewithgps.com/users/current.json`;
    let options = {headers:{'Authorization':`Bearer ${token}`}};
    try {
        const response = await axios.get(url, options).catch(error => {
            console.error(`Error fetching pinned routes for ${req.query.username} ${error.response.data.error}`);
            res.status(error.response.status).json(error.response.data.error);
        });
        if (response === undefined) {
            return;
        }
        insertFeatureRecord(makeFeatureRecord(response), "pinned", response.data.user.email);
        const favoritesReply = await axios.get(`https://ridewithgps.com/users/${response.data.user.id}/favorites.json?version=2&apikey=${rwgpsApiKey}`, options).catch(error => {
            console.warn(`Favorites error ${error}`);
            res.status(error.response.status).json(error.response.data);
        });
        const favorites = favoritesReply.data.results.map(fav => {return {id:fav.favid, name:fav[fav.type].name,
            associated_object_id:fav[fav.type].id, associated_object_type:fav.type, key:fav.favid}});
        res.status(200).json(favorites);
    } catch (err) {
        if (err !== undefined) {
            console.log(`EXCEPTION: ${err}`);
            if (err.response !== undefined) {
                res.status(err.response.status).json(err.response.data);
            } else {
                res.status(500).json(err);
            }
        }
    }

});

const getFeatureVisits = (featureName) => {
    const query = datastore
        .createQuery(featureName)
        //    .filter('__key__', '=', datastore.key(featureName)
        .order('timestamp', { descending: true });

    return datastore.runQuery(query);
};

app.get('/queryfeature', cors(), async (req, res) => {
    if (req.query.feature === undefined) {
        res.status(400).send("Missing feature name");
        return;
    }
    const [entities] = await getFeatureVisits(req.query.feature);
    const visits = entities.map(
        entity => JSON.stringify({
            "Time": entity.timestamp, "Email": entity.email, "FirstName": entity.first_name,
            "LastName": entity.last_name, "Route": entity.routeNumber
        })
    );
    res
        .status(200)
        .set('Content-Type', 'text/plain')
        .send(`[\n${visits.join(',\n')}]`)
        .end();
});

module.exports = app;