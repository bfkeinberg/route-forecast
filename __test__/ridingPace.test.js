/**
 * @jest-environment jsdom
 */

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import { Input } from 'reactstrap';
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

import React from 'react'
import { configure, shallow, mount, render } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import RidingPace from '../src/jsx/ForecastSettings/RidingPace';
configure({ adapter: new Adapter() });

const ridingPaceState = {
    "uiInfo": {
        "routeParams": {
            "interval": 1,
            "pace": "D",
            "rwgpsRoute": 2798,
            "rwgpsRouteIsTrip": false,
            "start": "2018-07-30T14:00:00.403Z",
            "loadingSource": null,
            "succeeded": null
        },
        "dialogParams": {
            "formVisible": true,
            "errorDetails": null,
            "succeeded": true,
            "shortUrl": "https://goo.gl/oNtVgM",
            "loadingSource": "rwgps",
            "fetchingForecast": false,
            "fetchingRoute": false,
            cancelActiveFetchMethod: null
        }
    },
    "strava": {
        activityData: {
            average_speed: 10,
            total_elevation_gain: 10,
            distance: 10,
        }
    },
    "controls": {
        "metric": false
    }
};


describe('<RidingPace />', () => {
    it('should allow all options', () => {
        let store = mockStore(ridingPaceState);
        const div = document.createElement('div');
        div.setAttribute("id", "paceInput")
        document.body.appendChild(div)
        const wrapper = mount((<Provider store={store}><RidingPace/></Provider>));
        expect(wrapper.find(Input).length).toBe(1);
        expect((wrapper.find(Input).children().children()).length).toBe(13);
        expect(wrapper.find('Input').prop('value')).toBe('D');
    });

    it('handling of obsolete pace values' , () => {
        ridingPaceState.uiInfo.routeParams.pace = 'C-';
        let store = mockStore(ridingPaceState);
        const div = document.createElement('div');
        div.setAttribute("id", "paceInput")
        document.body.appendChild(div)
        const wrapper = mount((<Provider store={store}><RidingPace /></Provider>));
        expect(wrapper.find(Input).length).toBe(1);
        expect((wrapper.find(Input).children().children()).length).toBe(13);
        expect(wrapper.find('Input').prop('value')).toBe('B+');
    });

});

