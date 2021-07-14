/**
 * @jest-environment jsdom
 */

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import * as actions from '../src/jsx/actions/actions';
import rootReducer from "../src/jsx/reducers/reducer";
import { DateTime } from 'luxon';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('request forecast', () => {
    debugger;

    afterEach(() => {
        fetchMock.reset();
        fetchMock.restore();
    });

    it('sends forecast request and updates state', async () => {

        const forecast = [
            {
                "cloudCover": "27.0%",
                "distance": 0,
                "fullTime": "Sat Jul 14 4:00AM 2018",
                "gust": "4 mph",
                "lat": 38.69463,
                "lon": -119.78078,
                "precip": "0%",
                "rainy": false,
                "relBearing": 107.83193160806681,
                "summary": "Partly Cloudy",
                "temp": 64,
                "tempStr": "64F",
                "time": "4:00AM",
                "vectorBearing": 115.16806839193319,
                "windBearing": 223,
                "windSpeed": "2 mph"
            },
            {
                "cloudCover": "19.0%",
                "distance": 8,
                "fullTime": "Sat Jul 14 5:00AM 2018",
                "gust": "4 mph",
                "lat": 38.65696,
                "lon": -119.67824,
                "precip": "0%",
                "rainy": false,
                "relBearing": 162.3655705899713,
                "summary": "Clear",
                "temp": 63,
                "tempStr": "63F",
                "time": "5:00AM",
                "vectorBearing": 75.6344294100287,
                "windBearing": 238,
                "windSpeed": "2 mph"
            },
            {
                "cloudCover": "11.0%",
                "distance": 15,
                "fullTime": "Sat Jul 14 6:00AM 2018",
                "gust": "4 mph",
                "lat": 38.67471,
                "lon": -119.5893,
                "precip": "0%",
                "rainy": false,
                "relBearing": 117.9603801907554,
                "summary": "Clear",
                "temp": 63,
                "tempStr": "63F",
                "time": "6:00AM",
                "vectorBearing": 126.0396198092446,
                "windBearing": 244,
                "windSpeed": "3 mph"
            },
            {
                "cloudCover": "8.0%",
                "distance": 23,
                "fullTime": "Sat Jul 14 7:00AM 2018",
                "gust": "3 mph",
                "lat": 38.64203,
                "lon": -119.53182,
                "precip": "0%",
                "rainy": false,
                "relBearing": 57.780693406585954,
                "summary": "Clear",
                "temp": 71,
                "tempStr": "71F",
                "time": "7:00AM",
                "vectorBearing": 302.78069340658595,
                "windBearing": 245,
                "windSpeed": "3 mph"
            },
            {
                "cloudCover": "15.0%",
                "distance": 31,
                "fullTime": "Sat Jul 14 8:00AM 2018",
                "gust": "3 mph",
                "lat": 38.67693,
                "lon": -119.60128,
                "precip": "0%",
                "rainy": false,
                "relBearing": 29.280822051315624,
                "summary": "Clear",
                "temp": 69,
                "tempStr": "69F",
                "time": "8:00AM",
                "vectorBearing": 261.2808220513156,
                "windBearing": 232,
                "windSpeed": "2 mph"
            },
            {
                "cloudCover": "25.0%",
                "distance": 38,
                "fullTime": "Sat Jul 14 9:00AM 2018",
                "gust": "3 mph",
                "lat": 38.66587,
                "lon": -119.69334,
                "precip": "1.0%",
                "rainy": false,
                "relBearing": 53.531883857401624,
                "summary": "Partly Cloudy",
                "temp": 77,
                "tempStr": "77F",
                "time": "9:00AM",
                "vectorBearing": 224.53188385740162,
                "windBearing": 171,
                "windSpeed": "2 mph"
            },
            {
                "cloudCover": "40.0%",
                "distance": 46,
                "fullTime": "Sat Jul 14 10:00AM 2018",
                "gust": "4 mph",
                "lat": 38.60324,
                "lon": -119.77215,
                "precip": "0%",
                "rainy": false,
                "relBearing": 128.16346804909142,
                "summary": "Partly Cloudy",
                "temp": 82,
                "tempStr": "82F",
                "time": "10:00AM",
                "vectorBearing": 209.16346804909142,
                "windBearing": 81,
                "windSpeed": "2 mph"
            },
            {
                "cloudCover": "51.0%",
                "distance": 53,
                "fullTime": "Sat Jul 14 11:00AM 2018",
                "gust": "5 mph",
                "lat": 38.54368,
                "lon": -119.81464,
                "precip": "1.0%",
                "rainy": false,
                "relBearing": 83.1461778516425,
                "summary": "Partly Cloudy",
                "temp": 77,
                "tempStr": "77F",
                "time": "11:00AM",
                "vectorBearing": 282.8538221483575,
                "windBearing": 6,
                "windSpeed": "2 mph"
            },
            {
                "cloudCover": "54.0%",
                "distance": 61,
                "fullTime": "Sat Jul 14 12:00PM 2018",
                "gust": "5 mph",
                "lat": 38.5496,
                "lon": -119.84784,
                "precip": "1.0%",
                "rainy": false,
                "relBearing": 52.85929291279666,
                "summary": "Partly Cloudy",
                "temp": 77,
                "tempStr": "77F",
                "time": "12:00PM",
                "vectorBearing": 51.85929291279664,
                "windBearing": 359,
                "windSpeed": "2 mph"
            },
            {
                "cloudCover": "46.0%",
                "distance": 68,
                "fullTime": "Sat Jul 14 1:00PM 2018",
                "gust": "5 mph",
                "lat": 38.58637,
                "lon": -119.78791,
                "precip": "1.0%",
                "rainy": false,
                "relBearing": 66.31526535693433,
                "summary": "Partly Cloudy",
                "temp": 84,
                "tempStr": "84F",
                "time": "1:00PM",
                "vectorBearing": 32.31526535693433,
                "windBearing": 326,
                "windSpeed": "1 mph"
            },
            {
                "cloudCover": "34.0%",
                "distance": 76,
                "fullTime": "Sat Jul 14 2:00PM 2018",
                "gust": "4 mph",
                "lat": 38.66242,
                "lon": -119.72629,
                "precip": "1.0%",
                "rainy": false,
                "relBearing": 13.457058558095014,
                "summary": "Partly Cloudy",
                "temp": 87,
                "tempStr": "87F",
                "time": "2:00PM",
                "vectorBearing": 317.457058558095,
                "windBearing": 304,
                "windSpeed": "2 mph"
            },
            {
                "cloudCover": "41.0%",
                "distance": 83,
                "fullTime": "Sat Jul 14 3:00PM 2018",
                "gust": "5 mph",
                "lat": 38.72679,
                "lon": -119.80204,
                "precip": "1.0%",
                "rainy": false,
                "relBearing": 174.2355759721117,
                "summary": "Partly Cloudy",
                "temp": 88,
                "tempStr": "88F",
                "time": "3:00PM",
                "vectorBearing": 308.7644240278883,
                "windBearing": 123,
                "windSpeed": "3 mph"
            },
            {
                "cloudCover": "58.0%",
                "distance": 91,
                "fullTime": "Sat Jul 14 4:00PM 2018",
                "gust": "6 mph",
                "lat": 38.77595,
                "lon": -119.88061,
                "precip": "1.0%",
                "rainy": false,
                "relBearing": 35.94486459433304,
                "summary": "Partly Cloudy",
                "temp": 83,
                "tempStr": "83F",
                "time": "4:00PM",
                "vectorBearing": 220.94486459433304,
                "windBearing": 185,
                "windSpeed": "2 mph"
            },
            {
                "cloudCover": "75.0%",
                "distance": 99,
                "fullTime": "Sat Jul 14 5:00PM 2018",
                "gust": "7 mph",
                "lat": 38.70628,
                "lon": -119.95804,
                "precip": "1.0%",
                "rainy": false,
                "relBearing": 104.33564025120685,
                "summary": "Mostly Cloudy",
                "temp": 77,
                "tempStr": "77F",
                "time": "5:00PM",
                "vectorBearing": 11.335640251206863,
                "windBearing": 267,
                "windSpeed": "5 mph"
            },
            {
                "cloudCover": "65.0%",
                "distance": 106,
                "fullTime": "Sat Jul 14 6:01PM 2018",
                "gust": "7 mph",
                "lat": 38.72247,
                "lon": -119.95388,
                "precip": "1.0%",
                "rainy": false,
                "relBearing": 159.72636112113744,
                "summary": "Mostly Cloudy",
                "temp": 75,
                "tempStr": "75F",
                "time": "6:01PM",
                "vectorBearing": 58.273638878862556,
                "windBearing": 218,
                "windSpeed": "4 mph"
            },
            {
                "cloudCover": "35.0%",
                "distance": 114,
                "fullTime": "Sat Jul 14 7:02PM 2018",
                "gust": "6 mph",
                "lat": 38.7652,
                "lon": -119.86517,
                "precip": "1.0%",
                "rainy": false,
                "relBearing": 173.36881095592057,
                "summary": "Partly Cloudy",
                "temp": 75,
                "tempStr": "75F",
                "time": "7:02PM",
                "vectorBearing": 132.36881095592057,
                "windBearing": 319,
                "windSpeed": "3 mph"
            },
            {
                "cloudCover": "15.0%",
                "distance": 122,
                "fullTime": "Sat Jul 14 8:02PM 2018",
                "gust": "5 mph",
                "lat": 38.71263,
                "lon": -119.79134,
                "precip": "1.0%",
                "rainy": false,
                "relBearing": 132.14934542233576,
                "summary": "Clear",
                "temp": 76,
                "tempStr": "76F",
                "time": "8:02PM",
                "vectorBearing": 156.85065457766424,
                "windBearing": 289,
                "windSpeed": "3 mph"
            },
            {
                "cloudCover": "14.0%",
                "distance": 123,
                "fullTime": "Sat Jul 14 8:13PM 2018",
                "gust": "5 mph",
                "lat": 38.69432,
                "lon": -119.78131,
                "precip": "1.0%",
                "rainy": false,
                "relBearing": 143.14934542233576,
                "summary": "Clear",
                "temp": 77,
                "tempStr": "77F",
                "time": "8:13PM",
                "vectorBearing": 156.85065457766424,
                "windBearing": 300,
                "windSpeed": "2 mph"
            }
        ];
        
        fetchMock.get('https://maps.googleapis.com/maps/api/timezone/json',
                      {body: {dstOffset:0, rawOffset:0, timeZoneId:0} });
        fetchMock
            .post('/forecast', { body: {
                    "forecast": forecast
                },
                headers: { 'content-type': 'application/json' } });

        const calculatedControls = [
            {
                "arrival": "Sat, Jul 14 2018 5:30AM",
                "banked": -13,
                "val": 1,
                "lat": 38.66683,
                "lon": -119.63601
            },
            {
                "arrival": "Sat, Jul 14 2018 6:42AM",
                "banked": -27,
                "val": 2,
                "lat": 38.64231,
                "lon": -119.55148
            },
            {
                "arrival": "Sat, Jul 14 2018 8:10AM",
                "banked": -44,
                "val": 3,
                "lat": 38.67462,
                "lon": -119.62253
            },
            {
                "arrival": "Sat, Jul 14 2018 10:52AM",
                "banked": -71,
                "val": 4,
                "lat": 38.54632,
                "lon": -119.81012
            },
            {
                "arrival": "Sat, Jul 14 2018 11:35AM",
                "banked": -82,
                "val": 5,
                "lat": 38.54217,
                "lon": -119.88666
            },
            {
                "arrival": "Sat, Jul 14 2018 12:17PM",
                "banked": -92,
                "val": 6,
                "lat": 38.54699,
                "lon": -119.8089
            },
            {
                "arrival": "Sat, Jul 14 2018 2:52PM",
                "banked": -118,
                "val": 7,
                "lat": 38.72277,
                "lon": -119.79849
            },
            {
                "arrival": "Sat, Jul 14 2018 3:27PM",
                "banked": -127,
                "val": 8,
                "lat": 38.77446,
                "lon": -119.82219
            },
            {
                "arrival": "Sat, Jul 14 2018 5:25PM",
                "banked": -148,
                "val": 9,
                "lat": 38.69634,
                "lon": -119.99097
            },
            {
                "arrival": "Sat, Jul 14 2018 7:22PM",
                "banked": -169,
                "val": 10,
                "lat": 38.77348,
                "lon": -119.81972
            }
        ];
        const nextControlValues = [
            {
                "arrival": "Sat, Jul 14 2018 5:28AM",
                "banked": -11,
                "val": 1,
                "lat": 38.66683,
                "lon": -119.63601
            },
            {
                "arrival": "Sat, Jul 14 2018 6:39AM",
                "banked": -24,
                "val": 2,
                "lat": 38.64231,
                "lon": -119.55148
            },
            {
                "arrival": "Sat, Jul 14 2018 8:08AM",
                "banked": -43,
                "val": 3,
                "lat": 38.67462,
                "lon": -119.62253
            },
            {
                "arrival": "Sat, Jul 14 2018 10:52AM",
                "banked": -72,
                "val": 4,
                "lat": 38.54632,
                "lon": -119.81012
            },
            {
                "arrival": "Sat, Jul 14 2018 11:35AM",
                "banked": -82,
                "val": 5,
                "lat": 38.54217,
                "lon": -119.88666
            },
            {
                "arrival": "Sat, Jul 14 2018 12:17PM",
                "banked": -92,
                "val": 6,
                "lat": 38.54699,
                "lon": -119.8089
            },
            {
                "arrival": "Sat, Jul 14 2018 2:56PM",
                "banked": -122,
                "val": 7,
                "lat": 38.72277,
                "lon": -119.79849
            },
            {
                "arrival": "Sat, Jul 14 2018 3:30PM",
                "banked": -130,
                "val": 8,
                "lat": 38.77446,
                "lon": -119.82219
            },
            {
                "arrival": "Sat, Jul 14 2018 5:30PM",
                "banked": -154,
                "val": 9,
                "lat": 38.69634,
                "lon": -119.99097
            },
            {
                "arrival": "Sat, Jul 14 2018 7:21PM",
                "banked": -168,
                "val": 10,
                "lat": 38.77348,
                "lon": -119.81972
            }
        ];
        const expectedActions = [
            { type: actions.BEGIN_FETCHING_FORECAST },
            { type: actions.FORECAST_FETCH_SUCCESS, forecastInfo: {forecast:forecast}},
            { type: actions.ADD_WEATHER_CORRECTION, finishTime: "Sat, Jul 14 2018 8:09PM", weatherCorrectionMinutes: -3.58560511411573, maxGustSpeed: 7 },
            { type: actions.UPDATE_CALCULATED_VALUES, values:nextControlValues }
            ];

        const dir = process.cwd();
        const routeInfo = require(`${dir}/__test__/routeInfo.json`);

        const initialState = {routeInfo:routeInfo, params:{
                "newUserMode": false,
                "action": "/forecast"
            },
        forecast:{
          weatherProvider:'darksky'
        },
            controls:{
                "metric": false,
                "displayBanked": false,
                "stravaAnalysis": false,
                "userControlPoints": [
                    {
                        "name": "Pass 1",
                        "distance": 12,
                        "duration": 5,
                        "id": 1
                    },
                    {
                        "name": "Pass 2",
                        "distance": 21,
                        "duration": 5,
                        "id": 2
                    },
                    {
                        "name": "Pass 2b",
                        "distance": 32,
                        "duration": 5,
                        "id": 3
                    },
                    {
                        "name": "Pass 3",
                        "distance": 53,
                        "duration": 5,
                        "id": 4
                    },
                    {
                        "name": "Pass 4",
                        "distance": 58,
                        "duration": 5,
                        "id": 5
                    },
                    {
                        "name": "pass 4b",
                        "distance": 63,
                        "duration": 5,
                        "id": 6
                    },
                    {
                        "name": "Turtle Rock",
                        "distance": 83,
                        "duration": 5,
                        "id": 7
                    },
                    {
                        "name": "woodfords",
                        "distance": 87,
                        "duration": 5,
                        "id": 8
                    },
                    {
                        "name": "Pass 5",
                        "distance": 102,
                        "duration": 5,
                        "id": 9
                    },
                    {
                        "name": "Woodfords",
                        "distance": 117,
                        "duration": 5,
                        "id": 10
                    }
                ],
                "calculatedControlValues": calculatedControls,
                "initialControlValues": calculatedControls,
                "count": 10,
                "displayedFinishTime": "",
                "queryString": null
            },
            uiInfo:{
                "routeParams": {
                    "interval": 1,
                    "pace": "B+",
                    "rwgpsRoute": 27904106,
                    "rwgpsRouteIsTrip": false,
                    "start": DateTime.fromSeconds(1531566000),
                    "loadingSource": null,
                    "succeeded": null
                },
                "dialogParams": {
                    "formVisible": false,
                    "errorDetails": null,
                    "succeeded": true,
                    "shortUrl": "https://goo.gl/Kf9fF5",
                    "loadingSource": "rwgps",
                    "fetchingForecast": false,
                    "fetchingRoute": false
                }
            }};
        let store = mockStore(initialState);
        let v = await(store.dispatch(actions.requestForecast(routeInfo)));
        expect(store.getActions()).toEqual(expectedActions);

        let newState = expectedActions.reduce((previousValue, currentValue) => rootReducer(previousValue,currentValue),initialState);
        expect(newState.controls.calculatedControlValues).toEqual(nextControlValues);

        store = mockStore(newState);
        await(store.dispatch(actions.requestForecast(routeInfo)));
        expect(store.getActions()).toEqual(expectedActions);

        })
});

