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
                interval:1,min_interval:1,pace:'D',rwgpsRoute:'',
                rwgpsRouteIsTrip:false,canForecastPast:false,
                start: expect.any(DateTime),
                stopAfterLoad: expect.any(Boolean),
                initialStart: expect.any(DateTime),
                maxDaysInFuture:3,
                routeLoadingMode: routeLoadingModes.RWGPS
            }
        );
    });

    it('should handle SET_START_TIME', () => {
        const routeParamsState = {
            "canForecastPast":false,
            "interval": 1,
            "min_interval":1,
            "maxDaysInFuture":3,
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
                "canForecastPast":false,
                "interval": 1,
                "min_interval":1,
                "maxDaysInFuture":3,
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
            "interval": 1,
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
                "interval": 1,
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
