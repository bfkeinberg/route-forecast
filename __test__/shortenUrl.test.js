import configureStore from '../src/jsx/configureStore';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import * as actions from '../src/jsx/actions/actions';
import {shortenUrl} from "../src/jsx/actions/actions";
require('isomorphic-fetch');
const middlewares = [thunk];

describe('Call URL shortener', () => {
    afterEach(() => {
        fetchMock.reset();
        fetchMock.restore();
    });

    it('Shorten URL', async () => {
/*
        fetchMock
            .get('/rwgps_route?route=6275002&trip=false', {body:routeData, headers: { 'content-type': 'application/json' }});
*/

        const expectedActions = [
            { type: actions.SET_SHORT_URL, url:"http://bit.ly/2D3VYkz" },
            ];

        const initialState = {
            "uiInfo": {
                "routeParams": {
                    "interval": 1,
                    "pace": "D",
                    "rwgpsRoute": 6275002,
                    "rwgpsRouteIsTrip": false,
                    "start": "2018-08-04T14:00:00.000Z",
                    "loadingSource": null,
                    "succeeded": null
                },
                "dialogParams": {
                    "formVisible": true,
                    "errorDetails": null,
                    "succeeded": true,
                    "shortUrl": "https://goo.gl/Cy7Var",
                    "loadingSource": "rwgps",
                    "fetchingForecast": false,
                    "fetchingRoute": true
                }
            },
            "routeInfo": {
                "finishTime": "",
                "initialFinishTime": "",
                "weatherCorrectionMinutes": null,
                "forecastRequest": null,
                "points": [],
                "fetchAfterLoad": true,
                "bounds": null,
                "name": "",
                "rwgpsRouteData": null,
                "gpxRouteData": null
            },
            "controls": {
                "metric": false,
                "displayBanked": false,
                "stravaAnalysis": false,
                "userControlPoints": [],
                "calculatedControlValues": [],
                "initialControlValues": [],
                "count": 0,
                "displayedFinishTime": "",
                "queryString": null
            },
            "strava": {
                "analysisInterval": 12,
                "activity": "",
                "token": "31ca57912cae10ec928f146afb86f31a54d9ea2a",
                "fetching": false,
                "activityData": null,
                "calculatedPaces": null,
                "errorDetails": null,
                "subrange": [],
                "activityStream": null
            },
            "forecast": {
                "forecast": [],
                "valid": false,
                "range": []
            },
            "params": {
                "newUserMode": false,
                "action": "/forecast",
                "maps_api_key": process.env.MAPS_KEY,
                "timezone_api_key": process.env.TIMEZONE_API_KEY,
                "bitly_token": process.env.BITLY_TOKEN
            }
        };
        const store = configureStore(initialState,'development');

        let url = 'https://www.cyclerouteforecast.com/?controlPoints=%3AWicomico%20Shores%2C13.9%2C15%3AChaptico%20Market%2C26.4%2C15&interval=1&metric=false&pace=D&rwgpsRoute=18408464&start=Fri%20Apr%205%202019%2007%3A00%3A00&strava_activity=;';

        await(store.dispatch(shortenUrl(url)));
        // expect(store.getActions()).toEqual(expectedActions);

        //let newState = expectedActions.reduce((previousValue, currentValue) => rootReducer(previousValue,currentValue),initialState);
        // expect(newState.controls.calculatedControlValues).toEqual(nextControlValues);
        //
        // store = mockStore(newState);
        // await(store.dispatch(actions.requestForecast(routeInfo)));
        // expect(store.getActions()).toEqual(expectedActions);

        })
});

