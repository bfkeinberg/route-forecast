/**
 * @jest-environment jsdom
 */

import React from 'react'
import { configure } from 'enzyme'
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import {controls} from '../src/jsx/reducers/reducer.js';
import {SET_ROUTE_INFO, UPDATE_CALCULATED_VALUES} from '../src/jsx/actions/actions';

configure({ adapter: new Adapter() });

describe('controls reducer', () => {
    it('should return the initial state', () => {
        expect(controls(undefined,{})).toEqual(
            {
                metric:false,displayBanked:false,stravaAnalysis:false,
                userControlPoints:[],initialControlValues:[], calculatedControlValues:[],count:0,displayedFinishTime:'',queryString:null,
                showWeatherProvider:false
            }
        );
    });

    it('should handle SET_ROUTE_INFO', () => {
        expect(controls( {
            metric:false,displayBanked:false,stravaAnalysis:false,
            userControlPoints:[],calculatedControlValues:[],initialControlValues:[],count:0,displayedFinishTime:'',queryString:null
        },
            {
                type:SET_ROUTE_INFO,
                routeInfo:{
                    "forecastRequest": [
                        {
                            "lat": 38.69463,
                            "lon": -119.78078,
                            "distance": 0,
                            "time": "2018-07-14T04:00:00-0700",
                            "bearing": 115.16806839193319
                        },
                        {
                            "lat": 38.65696,
                            "lon": -119.67824,
                            "distance": 8,
                            "time": "2018-07-14T05:00:00-0700",
                            "bearing": 75.6344294100287
                        },
                        {
                            "lat": 38.67471,
                            "lon": -119.5893,
                            "distance": 15,
                            "time": "2018-07-14T06:00:00-0700",
                            "bearing": 126.0396198092446
                        },
                        {
                            "lat": 38.64203,
                            "lon": -119.53182,
                            "distance": 23,
                            "time": "2018-07-14T07:00:00-0700",
                            "bearing": 302.78069340658595
                        },
                        {
                            "lat": 38.67693,
                            "lon": -119.60128,
                            "distance": 31,
                            "time": "2018-07-14T08:00:00-0700",
                            "bearing": 261.2808220513156
                        },
                        {
                            "lat": 38.66587,
                            "lon": -119.69334,
                            "distance": 38,
                            "time": "2018-07-14T09:00:00-0700",
                            "bearing": 224.53188385740162
                        },
                        {
                            "lat": 38.60324,
                            "lon": -119.77215,
                            "distance": 46,
                            "time": "2018-07-14T10:00:00-0700",
                            "bearing": 209.16346804909142
                        },
                        {
                            "lat": 38.54368,
                            "lon": -119.81464,
                            "distance": 53,
                            "time": "2018-07-14T11:00:00-0700",
                            "bearing": 282.8538221483575
                        },
                        {
                            "lat": 38.5496,
                            "lon": -119.84784,
                            "distance": 61,
                            "time": "2018-07-14T12:00:00-0700",
                            "bearing": 51.85929291279664
                        },
                        {
                            "lat": 38.58637,
                            "lon": -119.78791,
                            "distance": 68,
                            "time": "2018-07-14T13:00:00-0700",
                            "bearing": 32.31526535693433
                        },
                        {
                            "lat": 38.66242,
                            "lon": -119.72629,
                            "distance": 76,
                            "time": "2018-07-14T14:00:00-0700",
                            "bearing": 317.457058558095
                        },
                        {
                            "lat": 38.72679,
                            "lon": -119.80204,
                            "distance": 83,
                            "time": "2018-07-14T15:00:00-0700",
                            "bearing": 308.7644240278883
                        },
                        {
                            "lat": 38.77595,
                            "lon": -119.88061,
                            "distance": 91,
                            "time": "2018-07-14T16:00:00-0700",
                            "bearing": 220.94486459433304
                        },
                        {
                            "lat": 38.70628,
                            "lon": -119.95804,
                            "distance": 99,
                            "time": "2018-07-14T17:00:00-0700",
                            "bearing": 11.335640251206863
                        },
                        {
                            "lat": 38.72247,
                            "lon": -119.95388,
                            "distance": 106,
                            "time": "2018-07-14T18:01:00-0700",
                            "bearing": 58.273638878862556
                        },
                        {
                            "lat": 38.7652,
                            "lon": -119.86517,
                            "distance": 114,
                            "time": "2018-07-14T19:02:00-0700",
                            "bearing": 132.36881095592057
                        },
                        {
                            "lat": 38.71263,
                            "lon": -119.79134,
                            "distance": 122,
                            "time": "2018-07-14T20:02:00-0700",
                            "bearing": 156.85065457766424
                        },
                        {
                            "lat": 38.69432,
                            "lon": -119.78131,
                            "distance": 123,
                            "time": "2018-07-14T20:13:00-0700",
                            "bearing": 156.85065457766424
                        }
                    ],
                    "name": "DR2018 gv",
                    "values": [
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
                    "bounds": {
                        "min_latitude": 38.54177,
                        "min_longitude": -119.99185,
                        "max_latitude": 38.77764,
                        "max_longitude": -119.52807
                    },
                    "finishTime": "Sat, Jul 14 2018 8:13pm"
                }
        })).toEqual(
            {
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
                stravaAnalysis:false,
                count:0,
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
                displayedFinishTime:'Sat, Jul 14 2018 8:13pm'
            }
        )
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
                stravaAnalysis:false,
                count:0,
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
                displayedFinishTime:'Sat, Jul 14 2018 8:13pm'
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
                stravaAnalysis:false,
                count:0,
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
                displayedFinishTime:'Sat, Jul 14 2018 8:13pm'
            }
        )
    });
});
