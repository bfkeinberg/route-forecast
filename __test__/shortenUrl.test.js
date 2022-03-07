/**
 * @jest-environment jsdom
 */

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import * as actions from '../src/redux/actions';
import {shortenUrl} from "../src/redux/actions";
import { routeLoadingModes } from '../src/data/enums';
require('isomorphic-fetch');
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Call URL shortener', () => {
    afterEach(() => {
        fetchMock.reset();
        fetchMock.restore();
    });

    it('Shorten URL', async () => {
        fetchMock
            .get('/rwgps_route?route=6275002&trip=false', {body:null, headers: { 'content-type': 'application/json' }});
        fetchMock
            .post('/bitly', {body:{error:null, url:"https://bit.ly/36qYDDg"}});
        const expectedActions = [
            { type: actions.SET_SHORT_URL, url:"https://bit.ly/36qYDDg" },
            ];

        const routeData =
            {"type":"route","route":{"id":6275002,"highlighted_photo_id":0,"highlighted_photo_checksum":null,"distance":103915.0,"elevation_gain":1719.64,"elevation_loss":1719.86,"track_id":"44097b146c657753e8280000","user_id":613372,"pavement_type":"mixed (on/off road)","pavement_type_id":7,"recreation_type_ids":[3],"visibility":0,"created_at":"2014-10-15T08:44:07-07:00","updated_at":"2016-02-21T11:07:08-08:00","name":"El Paseito Mixto Permanent 103K","description":"Some fire roads, some pavement and locations never visited on other Permanents/Brevets. The total elevation as per GPS closer to 5600ft","first_lng":-122.45043,"first_lat":37.80605,"last_lat":37.80605,"last_lng":-122.45043,"bounding_box":[{"lat":37.80292,"lng":-122.6041},{"lat":37.92998,"lng":-122.44194}],"locality":"SF","postal_code":"94123","administrative_area":"CA","country_code":"US","privacy_code":null,"user":{"id":613372,"created_at":"2015-09-21T13:29:08-07:00","description":null,"interests":null,"locality":null,"administrative_area":null,"account_level":3,"total_trip_distance":0,"total_trip_duration":0,"total_trip_elevation_gain":0.0,"name":"San Francisco Randonneurs","highlighted_photo_id":0,"highlighted_photo_checksum":null},"has_course_points":true,"nav_enabled":false,"rememberable":false,"metrics":{"id":59418273,"parent_id":6275002,"parent_type":"Route","created_at":"2019-07-24T09:35:36-07:00","updated_at":"2019-07-24T09:35:36-07:00","ele":{"max":545.3,"min":0.3,"_min":0.3,"_max":545.3,"max_i":5557,"min_i":2765,"_avg":126.90833111170394,"avg":126.90833111170394},"grade":{"max":22,"min":-27.902297639435865,"_min":-30.1,"_max":24.1,"max_i":274,"min_i":7190,"_avg":0.4667955211943482,"avg":0.4668577522996934},"distance":103915.018,"startElevation":1.1,"endElevation":1.1,"numPoints":7502,"ele_gain":1719.6359457613428,"ele_loss":1719.8615453997484,"v":1,"watts":{},"cad":{},"hr":{},"hills":[]},"photos":[],"segment_matches":[{"id":57144894,"created_at":"2019-06-11T15:50:26-07:00","updated_at":"2019-06-11T15:50:26-07:00","mongo_id":"","user_id":613372,"segment_id":904701,"parent_type":"Route","parent_id":6275002,"final_time":null,"visibility":0,"start_index":324,"end_index":734,"duration":null,"moving_time":null,"ascent_time":null,"personal_record":null,"vam":null,"started_at":null,"distance":2867.07,"avg_speed":null,"rank":null,"segment":{"title":"Hawk Hill from Bridge","slug":"904701-hawk-hill-from-bridge","to_param":"904701-hawk-hill-from-bridge"},"metrics":{"id":59404777,"parent_id":904701,"parent_type":"Segment","created_at":"2019-07-24T08:58:18-07:00","updated_at":"2019-07-24T08:58:18-07:00","ele":{"max":278.26,"min":124.064,"_min":124.064,"_max":278.26,"max_i":102,"_avg":202.22160576923073,"avg":202.22160576923073},"grade":{"max":9.025573666450851,"min":1.3693739930485989,"_min":0,"_max":10.3,"max_i":9,"min_i":52,"_avg":5.299999999999999,"avg":5.351456310679611},"distance":2818.2129999999997,"startElevation":124.064,"endElevation":277.964,"numPoints":104,"ele_gain":150.515269427695,"ele_loss":0,"isClimb":true,"uciScore":15081.543743689317,"uciCategory":4,"fietsIndex":0.8436696025460105,"v":1,"watts":{},"cad":{},"hr":{},"hills":[]}}],"track_points":[{"d":0.0,"e":1.1,"x":-122.45043,"y":37.80605},{"d":8.706,"e":1.1,"x":-122.450528,"y":37.806039},{"d":23.149,"e":1.1,"x":-122.45069,"y":37.8060199}]
        }
            };
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
                    "fetchingRoute": true
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
                "maps_api_key": process.env.MAPS_KEY,
                "timezone_api_key": process.env.TIMEZONE_API_KEY,
                "bitly_token": process.env.BITLY_TOKEN
            }
        };
        let store = mockStore(initialState);

        let url = 'https://www.randoplan.com/?controlPoints=%3AWicomico%20Shores%2C13.9%2C15%3AChaptico%20Market%2C26.4%2C15&interval=1&metric=false&pace=D&rwgpsRoute=18408464&start=Fri%20Apr%205%202019%2007%3A00%3A00&strava_activity=;';

        await(store.dispatch(shortenUrl(url)));
        expect(store.getActions()).toEqual(expectedActions);

        //let newState = expectedActions.reduce((previousValue, currentValue) => rootReducer(previousValue,currentValue),initialState);
        // expect(newState.controls.calculatedControlValues).toEqual(nextControlValues);
        //
        // store = mockStore(newState);
        // await(store.dispatch(actions.requestForecast(routeInfo)));
        // expect(store.getActions()).toEqual(expectedActions);

        })
});

