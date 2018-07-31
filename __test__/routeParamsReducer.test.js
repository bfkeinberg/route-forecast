import React from 'react'
import { configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16';
import {routeParams} from '../src/jsx/reducers/reducer.js';
import {SET_START} from '../src/jsx/actions/actions';

configure({ adapter: new Adapter() });

describe('route params reducer', () => {
    it('should return the initial state', () => {
        const routeParamsState = routeParams(undefined,{});
        expect(routeParamsState).toEqual(
            {
                interval:1,pace:'D',rwgpsRoute:'',
                rwgpsRouteIsTrip:false,
                start: expect.any(Date)
            }
        );
    });

    it('should handle SET_START', () => {
        const routeParamsState = {
            "interval": 0.5,
            "pace": "C",
            "rwgpsRoute": 201276,
            "rwgpsRouteIsTrip": false,
            "start": "2018-07-31T14:00:00.981Z",
            "loadingSource": null,
            "succeeded": null
        };
        expect(routeParams( routeParamsState,
            {
                type:SET_START,
                start:new Date('2018-08-01T15:00:00.000Z')
        })).toEqual(
            {
                "interval": 0.5,
                "pace": "C",
                "rwgpsRoute": 201276,
                "rwgpsRouteIsTrip": false,
                "start": new Date('2018-08-01T15:00:00.000Z'),
                "loadingSource": null,
                "succeeded": null
            }
        )
    });

    it('SET_START with bad data', () => {
        const routeParamsState = {
            "interval": 0.5,
            "pace": "C",
            "rwgpsRoute": 201276,
            "rwgpsRouteIsTrip": false,
            "start": "2018-07-31T14:00:00.981Z",
            "loadingSource": null,
            "succeeded": null
        };
        expect(routeParams( routeParamsState,
            {
                type:SET_START,
                start:'Invalid date'
        })).toEqual(
            {
                "interval": 0.5,
                "pace": "C",
                "rwgpsRoute": 201276,
                "rwgpsRouteIsTrip": false,
                "start":'2018-07-31T14:00:00.981Z',
                "loadingSource": null,
                "succeeded": null
            }
        )
    });

});
