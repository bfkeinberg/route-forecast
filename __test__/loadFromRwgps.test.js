/**
 * @jest-environment jsdom
 */

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import * as actions from '../src/redux/actions';
import rootReducer from "../src/redux/reducer";
import { routeLoadingModes } from '../src/data/enums';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('load route from Ride with GPS', () => {
    afterEach(() => {
        fetchMock.reset();
        fetchMock.restore();
    });

    it('load a route from Ride with GPS', async () => {
        const dir = process.cwd();
        const routeData = require(`${dir}/__test__/routeData.json`);

        fetchMock
            .get('/rwgps_route?route=6275002&trip=false', {body:routeData, headers: { 'content-type': 'application/json' }});

        const expectedActions = [
            { type: actions.BEGIN_LOADING_ROUTE, source:"rwgps" },
            { type: actions.INVALIDATE_FORECAST},
            { type: actions.RWGPS_ROUTE_LOADING_SUCCESS, routeData: routeData}
        ]

        const initialState = {
            "uiInfo": {
                "routeParams": {
                    "interval": 1,
                    "pace": "D",
                    "rwgpsRoute": 6275002,
                    "rwgpsRouteIsTrip": false,
                    "start": "2018-08-04T14:00:00.000Z",
                    "loadingSource": null,
                    "succeeded": null,
                    "routeLoadingMode": routeLoadingModes.RWGPS
                },
                "dialogParams": {
                    "formVisible": true,
                    "errorDetails": null,
                    "succeeded": true,
                    "shortUrl": "https://goo.gl/Cy7Var",
                    "loadingSource": "rwgps",
                    "fetchingForecast": false,
                    "fetchingRoute": true,
                    cancelActiveFetchMethod: null
                }
            },
            "routeInfo": {
                "name": "",
                "rwgpsRouteData": null,
                "gpxRouteData": null
            },
            "controls": {
                "metric": false,
                "displayBanked": false,
                "userControlPoints": [],
                "queryString": null
            },
            "strava": {
                "analysisInterval": 12,
                "activity": "",
                "token": "31ca57912cae10ec928f146afb86f31a54d9ea2a",
                "fetching": false,
                "activityData": null,
                "subrange": [],
                "activityStream": null
            },
            "forecast": {
                "forecast": [],
                "valid": false,
                "range": []
            },
            "params": {
                "action": "/forecast",
                "maps_api_key": "AIzaSyDLmXz6JFen9Y9ZfwFcuJWdrRmq-kBjnKs",
                "timezone_api_key": "AIzaSyBS_wyxfIuLDEJWNOKs4w1NqbmwSDjLqCE"
            }
        };
        let store = mockStore(initialState);

        await(store.dispatch(actions.loadFromRideWithGps(6275002, false)));
        expect(store.getActions()).toEqual(expectedActions);

        //let newState = expectedActions.reduce((previousValue, currentValue) => rootReducer(previousValue,currentValue),initialState);
        // expect(newState.controls.calculatedControlValues).toEqual(nextControlValues);
        //
        // store = mockStore(newState);
        // await(store.dispatch(actions.requestForecast(routeInfo)));
        // expect(store.getActions()).toEqual(expectedActions);

        })
});

