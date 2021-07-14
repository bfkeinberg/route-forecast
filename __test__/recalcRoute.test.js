/**
 * @jest-environment jsdom
 */

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {recalcRoute} from '../src/jsx/actions/actions';
import fetchMock from 'fetch-mock';
import { DateTime } from 'luxon';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('recalculate route', () => {

    it('recalculate route and updates state', async () => {
        const dir = process.cwd();

        const expectedActions = require(`${dir}/__test__/expectedRecalcActions.json`);
        expectedActions[1].routeInfo.points = expectedActions[1].routeInfo.points.map( point => {point.dist=undefined; return point});
        const initialState = require(`${dir}/__test__/recalcRouteState.json`);
        initialState.uiInfo.routeParams.start = DateTime.fromSeconds(1532959200, {zone:'America/Los_Angeles'});
        let store = mockStore(initialState);
        fetchMock.get('begin:https://maps.googleapis.com/maps/api/timezone/json',
                      {body: {dstOffset:0, rawOffset:7200, timeZoneId:'Europe/Madrid'} });

        let v = await(store.dispatch(recalcRoute()));
        expect(store.getActions()).toEqual(expectedActions);

        })
});

