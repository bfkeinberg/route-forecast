/*
let state = {
    controlPoints: [
        {name:'here', distance:20, duration:15, arrival:'Jan 13', actual:'Jan 14', banked:'11:05'}
    ],
    // input to fetch weather forecast, populated by loading route
    routeInfo:{
        bounds:{min_latitude:0, max_latitude:0, min_longitude:0, max_longitude:0},
        points:[
            {latitude:17.5, longitude:130.9}...
        ],
        name:"This route",
        finishTime:"Thu, Jan 11 3:29pm"
    },
    // received from weather forecast, consumed by map and table rendering components
    forecast:[
        [time, distance, summary, temperature_str, precipitation, cloudCover, windspeed,
        latitude, longitude, temperature_int, long_time, relative_bearing, rain, wind_bearing]
    ],
    action: '/forecast',
    maps_key:'dddsss333',
    timezone_key:'eee444333',
    formVisible:true,
    weatherCorrectionMinutes:null,
    metric:false,
    forecastValid:false,
    fetchingForecast:false,
    fetchingRoute:false,
    fetchAfterLoad:false,
    strava_token:null,
    strava_activity:null,
    actualFinishTime:"Fri, Jan 12 3:29pm",
    actualPace: 18.5,
    stravaStreams:{}
}*/

export default function(state = {}, action) {return state;};
