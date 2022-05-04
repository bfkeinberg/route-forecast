/**
 * @jest-environment jsdom
 */

import React from 'react'
import { configure } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import {routeParams} from '../src/redux/reducer.js';
import {SET_START_TIME} from '../src/redux/actions';
import { DateTime } from 'luxon';
import { routeLoadingModes } from '../src/data/enums.js';

configure({ adapter: new Adapter() });

describe('route params reducer', () => {
    it('should return the initial state', () => {
        const routeParamsState = routeParams(undefined,{});
        expect(routeParamsState).toEqual(
            {
                interval:1,min_interval:0.25,pace:'D',rwgpsRoute:'',
                rwgpsRouteIsTrip:false,canForecastPast:true,
                start: expect.any(DateTime),
                stopAfterLoad: expect.any(Boolean),
                initialStart: expect.any(DateTime),
                maxDaysInFuture:14,
                routeLoadingMode: routeLoadingModes.RWGPS
            }
        );
    });

    it('should handle SET_START_TIME', () => {
        const routeParamsState = {
            "canForecastPast":true,
            "interval": 0.5,
            "min_interval":0.25,
            "maxDaysInFuture":14,
            "pace": "C",
            "rwgpsRoute": 201276,
            "rwgpsRouteIsTrip": false,
            "start": DateTime.fromISO("2018-07-31T14:00:00.981Z"),
            "stopAfterLoad": false,
            "initialStart": DateTime.fromISO("2018-07-31T14:00:00.981Z"),
            "loadingSource": null,
            "succeeded": null
        };
        expect(routeParams( routeParamsState,
            {
                type:SET_START_TIME,
                start:DateTime.fromISO('2018-08-01T15:00:00.000Z')
        })).toEqual(
            {
                "canForecastPast":true,
                "interval": 0.5,
                "min_interval":0.25,
                "maxDaysInFuture":14,
                "pace": "C",
                "rwgpsRoute": 201276,
                "rwgpsRouteIsTrip": false,
                "start": DateTime.fromISO('2018-08-01T15:00:00.000Z'),
                "stopAfterLoad": false,
                "initialStart": DateTime.fromISO('2018-07-31T14:00:00.981Z'),
                "loadingSource": null,
                "succeeded": null
            }
        )
    });

    it('SET_START_TIME with bad data', () => {
        const routeParamsState = {
            "interval": 0.5,
            "pace": "C",
            "rwgpsRoute": 201276,
            "rwgpsRouteIsTrip": false,
            "start": "2018-07-31T14:00:00.981Z",
            "stopAfterLoad": false,
            "loadingSource": null,
            "succeeded": null
        };
        expect(routeParams( routeParamsState,
            {
                type:SET_START_TIME,
                start:'Invalid date'
        })).toEqual(
            {
                "interval": 0.5,
                "pace": "C",
                "rwgpsRoute": 201276,
                "rwgpsRouteIsTrip": false,
                "start":'2018-07-31T14:00:00.981Z',
                "stopAfterLoad": false,
                "loadingSource": null,
                "succeeded": null
            }
        )
    });

});
