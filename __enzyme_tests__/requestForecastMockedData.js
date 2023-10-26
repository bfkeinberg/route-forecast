import { DateTime } from 'luxon';
import { routeLoadingModes } from '../src/data/enums';

export const forecast = [
  {
      "time": "7:00AM",
      "distance": 0,
      "summary": "Clear",
      "precip": "0.0%",
      "cloudCover": "19.0%",
      "windSpeed": "7",
      "lat": 37.80605,
      "lon": -122.45043,
      "temp": "44",
      "fullTime": "Thu Dec 30 7:00AM 2021",
      "relBearing": 113.96924558733622,
      "rainy": false,
      "windBearing": 45,
      "vectorBearing": 291.0307544126638,
      "gust": "10",
      "feel": 40,
      "aqi": 9
  },
  {
      "time": "8:00AM",
      "distance": 7,
      "summary": "Clear",
      "precip": "0.0%",
      "cloudCover": "20.0%",
      "windSpeed": "8",
      "lat": 37.82796,
      "lon": -122.52265,
      "temp": "42",
      "fullTime": "Thu Dec 30 8:00AM 2021",
      "relBearing": 9.390943657517198,
      "rainy": false,
      "windBearing": 37,
      "vectorBearing": 27.609056342482802,
      "gust": "12",
      "feel": 37,
      "aqi": 4
  },
  {
      "time": "9:00AM",
      "distance": 13,
      "summary": "Clear",
      "precip": "20.0%",
      "cloudCover": "16.0%",
      "windSpeed": "8",
      "lat": 37.84161,
      "lon": -122.51361,
      "temp": "42",
      "fullTime": "Thu Dec 30 9:00AM 2021",
      "relBearing": 34.927800651999746,
      "rainy": false,
      "windBearing": 27,
      "vectorBearing": 352.07219934800025,
      "gust": "11",
      "feel": 37,
      "aqi": 7
  },
  {
      "time": "10:00AM",
      "distance": 20,
      "summary": "Partly Cloudy",
      "precip": "0.0%",
      "cloudCover": "36.0%",
      "windSpeed": "4",
      "lat": 37.89635,
      "lon": -122.52327,
      "temp": "45",
      "fullTime": "Thu Dec 30 10:00AM 2021",
      "relBearing": 75.77104285910457,
      "rainy": false,
      "windBearing": 36,
      "vectorBearing": 111.77104285910457,
      "gust": "8",
      "feel": 43,
      "aqi": 3
  },
  {
      "time": "11:00AM",
      "distance": 29,
      "summary": "Clear",
      "precip": "0.0%",
      "cloudCover": "30.0%",
      "windSpeed": "5",
      "lat": 37.87313,
      "lon": -122.44969,
      "temp": "47",
      "fullTime": "Thu Dec 30 11:00AM 2021",
      "relBearing": 108.27930769315662,
      "rainy": false,
      "windBearing": 42,
      "vectorBearing": 293.7206923068434,
      "gust": "8",
      "feel": 45,
      "aqi": 8
  },
  {
      "time": "12:00PM",
      "distance": 37,
      "summary": "Partly Cloudy",
      "precip": "0.0%",
      "cloudCover": "44.0%",
      "windSpeed": "3",
      "lat": 37.90046,
      "lon": -122.52859,
      "temp": "49",
      "fullTime": "Thu Dec 30 12:00PM 2021",
      "relBearing": 76.55750371923136,
      "rainy": false,
      "windBearing": 21,
      "vectorBearing": 304.44249628076864,
      "gust": "6",
      "feel": 48,
      "aqi": 6
  },
  {
      "time": "1:00PM",
      "distance": 41,
      "summary": "Partly Cloudy",
      "precip": "0.0%",
      "cloudCover": "49.0%",
      "windSpeed": "3",
      "lat": 37.91872,
      "lon": -122.56235,
      "temp": "48",
      "fullTime": "Thu Dec 30 1:00PM 2021",
      "relBearing": 10.432934386356038,
      "rainy": false,
      "windBearing": 244,
      "vectorBearing": 254.43293438635604,
      "gust": "7",
      "feel": 48,
      "aqi": 7
  },
  {
      "time": "2:00PM",
      "distance": 47,
      "summary": "Partly Cloudy",
      "precip": "0.0%",
      "cloudCover": "52.0%",
      "windSpeed": "4",
      "lat": 37.911,
      "lon": -122.59745,
      "temp": "46",
      "fullTime": "Thu Dec 30 2:00PM 2021",
      "relBearing": 144.7744926116423,
      "rainy": false,
      "windBearing": 320,
      "vectorBearing": 104.77449261164229,
      "gust": "7",
      "feel": 45,
      "aqi": 0.3
  },
  {
      "time": "3:00PM",
      "distance": 54,
      "summary": "Mostly Cloudy",
      "precip": "0.0%",
      "cloudCover": "61.0%",
      "windSpeed": "3",
      "lat": 37.89658,
      "lon": -122.52826,
      "temp": "51",
      "fullTime": "Thu Dec 30 3:00PM 2021",
      "relBearing": 176.86901114484246,
      "rainy": false,
      "windBearing": 328,
      "vectorBearing": 151.13098885515754,
      "gust": "6",
      "feel": 51,
      "aqi": 7
  },
  {
      "time": "4:01PM",
      "distance": 61,
      "summary": "Partly Cloudy",
      "precip": "0.0%",
      "cloudCover": "59.0%",
      "windSpeed": "6",
      "lat": 37.82677,
      "lon": -122.47954,
      "temp": "51",
      "fullTime": "Thu Dec 30 4:01PM 2021",
      "relBearing": 162.98961593871428,
      "rainy": false,
      "windBearing": 295,
      "vectorBearing": 132.01038406128572,
      "gust": "10",
      "feel": 51,
      "aqi": 24
  },
  {
      "time": "4:22PM",
      "distance": 64,
      "summary": "Mostly Cloudy",
      "precip": "0.0%",
      "cloudCover": "61.0%",
      "windSpeed": "7",
      "lat": 37.80605,
      "lon": -122.45043,
      "temp": "51",
      "fullTime": "Thu Dec 30 4:22PM 2021",
      "relBearing": 163.98961593871428,
      "rainy": false,
      "windBearing": 296,
      "vectorBearing": 132.01038406128572,
      "gust": "11",
      "feel": 52,
      "aqi": 9
  }
]

export const timezoneData = {
  "dstOffset": 0,
  "rawOffset": -28800,
  "status": "OK",
  "timeZoneId": "America/Los_Angeles",
  "timeZoneName": "Pacific Standard Time"
}

export const calculatedControls = [
  {
      "arrival": "Thu, Dec 30 2021 8:42AM",
      "banked": -25,
      "val": 0,
      "lat": 37.83179,
      "lon": -122.53223
  },
  {
      "arrival": "Thu, Dec 30 2021 10:13AM",
      "banked": -58,
      "val": 1,
      "lat": 37.89115,
      "lon": -122.51697
  },
  {
      "arrival": "Thu, Dec 30 2021 11:36AM",
      "banked": -70,
      "val": 2,
      "lat": 37.89374,
      "lon": -122.46253
  },
  {
      "arrival": "Thu, Dec 30 2021 2:57PM",
      "banked": -136,
      "val": 3,
      "lat": 37.89669,
      "lon": -122.53949
  },
  {
      "arrival": "Thu, Dec 30 2021 3:28PM",
      "banked": -135,
      "val": 4,
      "lat": 37.85481,
      "lon": -122.47893
  },
  {
      "arrival": "Thu, Dec 30 2021 4:18PM",
      "banked": -153,
      "val": 5,
      "lat": 37.80632,
      "lon": -122.46998
  }
];

const dir = process.cwd();
const routeData = require(`${dir}/__test__/routeData.json`);
export const initialState = {
  routeInfo: { rwgpsRouteData: routeData },
  params: {
    "action": "/forecast"
  },
  forecast: {
    weatherProvider: 'darksky'
  },
  controls: {
    "metric": false,
    "displayBanked": false,
    "userControlPoints": [
      {
        "name": "Pass 1",
        "distance": 12,
        "duration": 5,
        "id": 1
      },
      {
        "name": "Pass 2",
        "distance": 21,
        "duration": 5,
        "id": 2
      },
      {
        "name": "Pass 2b",
        "distance": 32,
        "duration": 5,
        "id": 3
      },
      {
        "name": "Pass 3",
        "distance": 53,
        "duration": 5,
        "id": 4
      },
      {
        "name": "Pass 4",
        "distance": 58,
        "duration": 5,
        "id": 5
      },
      {
        "name": "pass 4b",
        "distance": 63,
        "duration": 5,
        "id": 6
      },
      {
        "name": "Turtle Rock",
        "distance": 83,
        "duration": 5,
        "id": 7
      },
      {
        "name": "woodfords",
        "distance": 87,
        "duration": 5,
        "id": 8
      },
      {
        "name": "Pass 5",
        "distance": 102,
        "duration": 5,
        "id": 9
      },
      {
        "name": "Woodfords",
        "distance": 117,
        "duration": 5,
        "id": 10
      }
    ],
    "queryString": null
  },
  uiInfo: {
    "routeParams": {
      "interval": 1,
      "pace": "B+",
      "rwgpsRoute": 27904106,
      "rwgpsRouteIsTrip": false,
      "start": DateTime.fromSeconds(1640876400, { zone: 'America/Los_Angeles' }),
      "loadingSource": null,
      "succeeded": null,
      "routeLoadingMode": routeLoadingModes.RWGPS
    },
    "dialogParams": {
      "formVisible": false,
      "errorDetails": null,
      "succeeded": true,
      "shortUrl": "https://goo.gl/Kf9fF5",
      "loadingSource": "rwgps",
      "fetchingForecast": false,
      "fetchingRoute": false
    }
  }
};