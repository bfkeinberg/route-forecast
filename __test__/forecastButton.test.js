/**
 * @jest-environment jsdom
 */

import React from 'react'
import { configure, shallow, mount } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import ForecastButton from '../src/jsx/ui/forecastButton';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { DateTime } from 'luxon';
import {Button} from 'reactstrap';
import { Context as ResponsiveContext } from 'react-responsive'

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

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

describe('<ForecastButton />', () => {
    it('should contain one Button', () => {
        const div = document.createElement('div');
        div.setAttribute("id", "forecast");
        document.body.appendChild(div);
        const wrapper = mount(<Provider store={store}><ResponsiveContext.Provider value={{ width: 500, deviceWidth:500 }}>
            <ForecastButton/></ResponsiveContext.Provider></Provider>);
        expect(wrapper.find(Button).length).toBe(1);
        expect(wrapper.find(Button).getDOMNode().getAttribute("class")).toEqual("btn btn-primary btn-sm");
    });
});

describe('<ForecastButton large/>', () => {
    it('should contain one large Button', () => {
        const div = document.createElement('div');
        div.setAttribute("id", "forecast");
        document.body.appendChild(div);
        const wrapper = mount(<Provider store={store}><ResponsiveContext.Provider value={{ width: 1000, deviceWidth:1000 }}>
            <ForecastButton/></ResponsiveContext.Provider></Provider>);
        expect(wrapper.find(Button).getDOMNode().getAttribute("class")).toEqual("btn btn-primary");
    });
});

describe('<ForecastButton missing/>', () => {
    it('should contain one Button when width is between 800 and 1000', () => {
        const div = document.createElement('div');
        div.setAttribute("id", "forecast");
        document.body.appendChild(div);
        const wrapper = mount(<Provider store={store}><ResponsiveContext.Provider value={{ width: 850, deviceWidth:850 }}>
            <ForecastButton/></ResponsiveContext.Provider></Provider>);
        expect(wrapper.find(Button).length).toBe(1);
        expect(wrapper.find(Button).getDOMNode().getAttribute("class")).toEqual("btn btn-primary");
    });
});