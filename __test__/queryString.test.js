/**
 * @jest-environment jsdom
 */

import React from 'react'
import { configure } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import {dateToShortDate, makeQuery} from '../src/jsx/queryString';

configure({ adapter: new Adapter() });

describe('<QueryString />', () => {
    it('check short date', () => {
        let shortDate = dateToShortDate(new Date('2018-08-01T15:00:00Z'));
        expect(shortDate).toEqual("Wed Aug 1 2018 08:00:00");
        shortDate = dateToShortDate('ggg6677');
        expect(shortDate).toEqual('Invalid DateTime');
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

