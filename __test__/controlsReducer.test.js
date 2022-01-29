/**
 * @jest-environment jsdom
 */

import React from 'react'
import { configure } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import {controls} from '../src/redux/reducer.js';
import {UPDATE_USER_CONTROLS} from '../src/redux/actions';

configure({ adapter: new Adapter() });

describe('controls reducer', () => {
    it('should return the initial state', () => {
        expect(controls(undefined,{})).toEqual(
            {
                metric:false,displayBanked:false,
                userControlPoints:[], queryString:null,
                showWeatherProvider:false,displayControlTableUI: false
            }
        );
    });

    it('should handle UPDATE_USER_CONTROLS', () => {
        expect(controls({
                userControlPoints:[
                    {
                        "name": "Wungus",
                        "distance": "12",
                        "duration": "12"
                    },
                    {
                        "name": "Alarm",
                        "distance": "29",
                        "duration": "28"
                    }
                ],
                metric:false,
                displayBanked:false,
                queryString:null
            },
            {
                type:UPDATE_USER_CONTROLS,
                controls:[
                    {
                        "name": "Wungus",
                        "distance": "12",
                        "duration": "12"
                    },
                    {
                        "name": "Alarm",
                        "distance": "29",
                        "duration": "28"
                    }
                ]
            })).toEqual(
            {
                userControlPoints:[
                    {
                        "name": "Wungus",
                        "distance": "12",
                        "duration": "12"
                    },
                    {
                        "name": "Alarm",
                        "distance": "29",
                        "duration": "28"
                    }
                ],
                metric:false,
                displayBanked:false,
                queryString:null
            }
        )
    });
});
