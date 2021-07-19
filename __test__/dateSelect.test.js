/**
 * @jest-environment jsdom
 */

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { DateTime } from 'luxon';
import { Provider } from 'react-redux';
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
import Flatpickr from 'react-flatpickr'

import React from 'react'
import { configure, shallow, mount, render } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import DateSelect, {setDateOnly} from '../src/jsx/ui/dateSelect';
import expressStaticGzip from 'express-static-gzip';
configure({ adapter: new Adapter() });

const dir = process.cwd();
const routeInfo = require(`${dir}/__test__/routeInfo.json`);

const initialState = {routeInfo:routeInfo, uiInfo:{
    "routeParams": {
        "interval": 1,
        "pace": "B+",
        "rwgpsRoute": 27904106,
        "rwgpsRouteIsTrip": false,
        "start": DateTime.fromISO("2018-07-14T11:00:00.000Z"),
        "initialStart": DateTime.fromISO("2018-07-14T11:00:00.000Z"),
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
     
describe('<DateSelect />', () => {
    it('should display calendar picker', () => {
        const div = document.createElement('div');
        div.setAttribute("id", "startingTime")
        document.body.appendChild(div)
        const wrapper = mount((<Provider store={store}><DateSelect/></Provider>));
        expect(wrapper.find(Flatpickr).length).toBe(1);
        const setStart = jest.fn();
        expect(setDateOnly(DateTime.now(), setStart)).toBe(undefined);
    });
});

