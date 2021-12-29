/**
 * @jest-environment jsdom
 */

import React from 'react'
import { configure } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import {controls} from '../src/redux/reducer.js';
import {UPDATE_CALCULATED_VALUES} from '../src/redux/actions';

configure({ adapter: new Adapter() });

describe('controls reducer', () => {
    it('should return the initial state', () => {
        expect(controls(undefined,{})).toEqual(
            {
                metric:false,displayBanked:false,
                userControlPoints:[], calculatedControlValues:[],queryString:null,
                showWeatherProvider:false,displayControlTableUI: false
            }
        );
    });

    it('should handle UPDATE_CALCULATED_VALUES', () => {
        expect(controls({
                calculatedControlValues:[
                    {
                        "arrival": "Sat, Jul 14 2018 5:30am",
                        "banked": -13,
                        "val": 1,
                        "lat": 38.66683,
                        "lon": -119.63601
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 6:42am",
                        "banked": -27,
                        "val": 2,
                        "lat": 38.64231,
                        "lon": -119.55148
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 8:10am",
                        "banked": -44,
                        "val": 3,
                        "lat": 38.67462,
                        "lon": -119.62253
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 10:52am",
                        "banked": -71,
                        "val": 4,
                        "lat": 38.54632,
                        "lon": -119.81012
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 11:35am",
                        "banked": -82,
                        "val": 5,
                        "lat": 38.54217,
                        "lon": -119.88666
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 12:17pm",
                        "banked": -92,
                        "val": 6,
                        "lat": 38.54699,
                        "lon": -119.8089
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 2:52pm",
                        "banked": -118,
                        "val": 7,
                        "lat": 38.72277,
                        "lon": -119.79849
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 3:27pm",
                        "banked": -127,
                        "val": 8,
                        "lat": 38.77446,
                        "lon": -119.82219
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 5:25pm",
                        "banked": -148,
                        "val": 9,
                        "lat": 38.69634,
                        "lon": -119.99097
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 7:22pm",
                        "banked": -169,
                        "val": 10,
                        "lat": 38.77348,
                        "lon": -119.81972
                    }
                ],
                metric:false,
                displayBanked:false,
                queryString:null,
                userControlPoints:[],
                initialControlValues:[
                    {
                        "arrival": "Sat, Jul 14 2018 5:30am",
                        "banked": -13,
                        "val": 1,
                        "lat": 38.66683,
                        "lon": -119.63601
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 6:42am",
                        "banked": -27,
                        "val": 2,
                        "lat": 38.64231,
                        "lon": -119.55148
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 8:10am",
                        "banked": -44,
                        "val": 3,
                        "lat": 38.67462,
                        "lon": -119.62253
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 10:52am",
                        "banked": -71,
                        "val": 4,
                        "lat": 38.54632,
                        "lon": -119.81012
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 11:35am",
                        "banked": -82,
                        "val": 5,
                        "lat": 38.54217,
                        "lon": -119.88666
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 12:17pm",
                        "banked": -92,
                        "val": 6,
                        "lat": 38.54699,
                        "lon": -119.8089
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 2:52pm",
                        "banked": -118,
                        "val": 7,
                        "lat": 38.72277,
                        "lon": -119.79849
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 3:27pm",
                        "banked": -127,
                        "val": 8,
                        "lat": 38.77446,
                        "lon": -119.82219
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 5:25pm",
                        "banked": -148,
                        "val": 9,
                        "lat": 38.69634,
                        "lon": -119.99097
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 7:22pm",
                        "banked": -169,
                        "val": 10,
                        "lat": 38.77348,
                        "lon": -119.81972
                    }
                ],
            },
            {
                type:UPDATE_CALCULATED_VALUES,
                values:[
                    {
                        "arrival": "Sat, Jul 14 2018 5:26am",
                        "banked": -10,
                        "val": 1,
                        "lat": 38.66683,
                        "lon": -119.63601
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 6:37am",
                        "banked": -23,
                        "val": 2,
                        "lat": 38.64231,
                        "lon": -119.55148
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 8:07am",
                        "banked": -41,
                        "val": 3,
                        "lat": 38.67462,
                        "lon": -119.62253
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 10:49am",
                        "banked": -68,
                        "val": 4,
                        "lat": 38.54632,
                        "lon": -119.81012
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 11:31am",
                        "banked": -78,
                        "val": 5,
                        "lat": 38.54217,
                        "lon": -119.88666
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 12:16pm",
                        "banked": -91,
                        "val": 6,
                        "lat": 38.54699,
                        "lon": -119.8089
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 2:58pm",
                        "banked": -124,
                        "val": 7,
                        "lat": 38.72277,
                        "lon": -119.79849
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 3:37pm",
                        "banked": -138,
                        "val": 8,
                        "lat": 38.77446,
                        "lon": -119.82219
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 5:39pm",
                        "banked": -163,
                        "val": 9,
                        "lat": 38.69634,
                        "lon": -119.99097
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 7:30pm",
                        "banked": -178,
                        "val": 10,
                        "lat": 38.77348,
                        "lon": -119.81972
                    }
                ]
            })).toEqual(
            {
                calculatedControlValues:[
                    {
                        "arrival": "Sat, Jul 14 2018 5:26am",
                        "banked": -10,
                        "val": 1,
                        "lat": 38.66683,
                        "lon": -119.63601
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 6:37am",
                        "banked": -23,
                        "val": 2,
                        "lat": 38.64231,
                        "lon": -119.55148
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 8:07am",
                        "banked": -41,
                        "val": 3,
                        "lat": 38.67462,
                        "lon": -119.62253
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 10:49am",
                        "banked": -68,
                        "val": 4,
                        "lat": 38.54632,
                        "lon": -119.81012
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 11:31am",
                        "banked": -78,
                        "val": 5,
                        "lat": 38.54217,
                        "lon": -119.88666
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 12:16pm",
                        "banked": -91,
                        "val": 6,
                        "lat": 38.54699,
                        "lon": -119.8089
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 2:58pm",
                        "banked": -124,
                        "val": 7,
                        "lat": 38.72277,
                        "lon": -119.79849
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 3:37pm",
                        "banked": -138,
                        "val": 8,
                        "lat": 38.77446,
                        "lon": -119.82219
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 5:39pm",
                        "banked": -163,
                        "val": 9,
                        "lat": 38.69634,
                        "lon": -119.99097
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 7:30pm",
                        "banked": -178,
                        "val": 10,
                        "lat": 38.77348,
                        "lon": -119.81972
                    }
                ],
                metric:false,
                displayBanked:false,
                queryString:null,
                userControlPoints:[],
                initialControlValues:[
                    {
                        "arrival": "Sat, Jul 14 2018 5:30am",
                        "banked": -13,
                        "val": 1,
                        "lat": 38.66683,
                        "lon": -119.63601
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 6:42am",
                        "banked": -27,
                        "val": 2,
                        "lat": 38.64231,
                        "lon": -119.55148
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 8:10am",
                        "banked": -44,
                        "val": 3,
                        "lat": 38.67462,
                        "lon": -119.62253
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 10:52am",
                        "banked": -71,
                        "val": 4,
                        "lat": 38.54632,
                        "lon": -119.81012
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 11:35am",
                        "banked": -82,
                        "val": 5,
                        "lat": 38.54217,
                        "lon": -119.88666
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 12:17pm",
                        "banked": -92,
                        "val": 6,
                        "lat": 38.54699,
                        "lon": -119.8089
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 2:52pm",
                        "banked": -118,
                        "val": 7,
                        "lat": 38.72277,
                        "lon": -119.79849
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 3:27pm",
                        "banked": -127,
                        "val": 8,
                        "lat": 38.77446,
                        "lon": -119.82219
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 5:25pm",
                        "banked": -148,
                        "val": 9,
                        "lat": 38.69634,
                        "lon": -119.99097
                    },
                    {
                        "arrival": "Sat, Jul 14 2018 7:22pm",
                        "banked": -169,
                        "val": 10,
                        "lat": 38.77348,
                        "lon": -119.81972
                    }
                ],
            }
        )
    });
});
