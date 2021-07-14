/**
 * @jest-environment jsdom
 */

import React from 'react'
import { configure } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import {dateToShortDate, makeQuery} from '../src/jsx/queryString';
import { DateTime } from 'luxon';

configure({ adapter: new Adapter() });

describe('<QueryString />', () => {
    it('check short date', () => {
        let shortDate = dateToShortDate(DateTime.fromISO('2018-08-01T15:00:00Z'));
        expect(shortDate).toEqual(1533135600);
    });

    it('make query', () => {
        let query = makeQuery(201276, 'C', 0.5, false, [], '');
        expect(query).toEqual({
            "pace": "C",
            "interval": 0.5,
            "metric": false,
            "rwgpsRoute": 201276,
            "controlPoints": "",
            "strava_activity": ""
        })
    });
});

