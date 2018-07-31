import React from 'react'
import { configure, shallow, mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16';
import {dateToShortDate, makeQuery} from '../src/jsx/queryString';

configure({ adapter: new Adapter() });

describe('<QueryString />', () => {
    it('check short date', () => {
        let shortDate = dateToShortDate('2018-08-01T15:00:00.000Z');
        expect(shortDate).toEqual("Wed Aug 1 2018 08:00:00");
        shortDate = dateToShortDate('ggg6677');
        expect(shortDate).toEqual('Invalid date');
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

