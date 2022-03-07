/**
 * @jest-environment jsdom
 */

import React from 'react'
import { configure } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { getRouteNumberFromValue } from '../src/jsx/RouteInfoForm/RideWithGpsId';

configure({ adapter: new Adapter() });

describe('getRouteNumberFromValue', () => {
    it('normal rwgps url', () => {
        let url = 'https://ridewithgps.com/routes/29534679';
        const routeNumber = getRouteNumberFromValue(url);
        expect(routeNumber).toEqual(29534679);
    });

    it('just number', () => {
        let value = '29534679';
        const routeNumber = getRouteNumberFromValue(value);
        expect(routeNumber).toEqual(29534679);
    });

    it('null entry', () => {
        let value = null;
        const routeNumber = getRouteNumberFromValue(value);
        expect(routeNumber).toEqual(null);
    });
});

