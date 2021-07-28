const request = require("supertest");
jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox());
const fetchMock = require('node-fetch');
process.env.NO_LOGGING = true;
const app = require("../src/jsx/server/server");
app.set('views', './__test__/views');

describe("Test the root path", () => {
  test("It should respond to the root method", () => {
    debugger;
    return request(app)
      .get("/")
      .expect(200);
  });
});

describe("Test forecast", () => {
  const OLD_ENV = process.env;

    //
    fetchMock.get('glob:https://api.darksky.net/forecast/*/37.35234,-122.05129,2021-07-27T11:00:00-0700?exclude=hourly,daily,flags',
    {"latitude":37.35234,"longitude":-122.05129,"timezone":"America/Los_Angeles","currently":{"time":1627408800,"summary":"Clear","icon":"clear-day","precipIntensity":0,"precipProbability":0,"temperature":78.71,"apparentTemperature":78.71,"dewPoint":54.22,"humidity":0.43,"pressure":1016.2,"windSpeed":4.35,"windGust":6.83,"windBearing":357,"cloudCover":0.29,"uvIndex":6,"visibility":10,"ozone":306.9},"offset":-7});
    fetchMock.get('glob:https://api.darksky.net/forecast/*/37.37648,-122.16631,2021-07-27T12:00:00-0700?exclude=hourly,daily,flags',
    {"latitude":37.37648,"longitude":-122.16631,"timezone":"America/Los_Angeles","currently":{"time":1627412400,"summary":"Clear","icon":"clear-day","precipIntensity":0,"precipProbability":0,"temperature":80.57,"apparentTemperature":80.57,"dewPoint":54.48,"humidity":0.41,"pressure":1016.1,"windSpeed":5.01,"windGust":8.78,"windBearing":347,"cloudCover":0.23,"uvIndex":8,"visibility":10,"ozone":306.6},"offset":-7});
    fetchMock.get('glob:https://api.darksky.net/forecast/*/37.41531,-122.23805,2021-07-27T13:00:00-0700?exclude=hourly,daily,flags',
    {"latitude":37.41531,"longitude":-122.23805,"timezone":"America/Los_Angeles","currently":{"time":1627416000,"summary":"Clear","icon":"clear-day","precipIntensity":0,"precipProbability":0,"temperature":79.49,"apparentTemperature":79.49,"dewPoint":55.62,"humidity":0.44,"pressure":1016.1,"windSpeed":6.35,"windGust":10.38,"windBearing":319,"cloudCover":0.14,"uvIndex":9,"visibility":10,"ozone":306.1},"minutely":{"summary":"Clear for the hour.","icon":"clear-day","data":[{"time":1627416000,"precipIntensity":0,"precipProbability":0},{"time":1627416060,"precipIntensity":0,"precipProbability":0}]},"offset":-7});
    fetchMock.get('glob:https://api.darksky.net/forecast/*/37.35212,-122.07239,2021-07-27T14:00:00-0700?exclude=hourly,daily,flags',{"latitude":37.35212,"longitude":-122.07239,"timezone":"America/Los_Angeles","currently":{"time":1627419600,"summary":"Clear","icon":"clear-day","precipIntensity":0,"precipProbability":0,"temperature":86.21,"apparentTemperature":86.21,"dewPoint":52.75,"humidity":0.32,"pressure":1015.6,"windSpeed":6.93,"windGust":10.99,"windBearing":343,"cloudCover":0.04,"uvIndex":10,"visibility":10,"ozone":303.6},"minutely":{"summary":"Clear for the hour.","icon":"clear-day","data":[{"time":1627419600,"precipIntensity":0,"precipProbability":0},{"time":1627419660,"precipIntensity":0,"precipProbability":0}]},"offset":-7});
    fetchMock.get('glob:https://api.darksky.net/forecast/*/37.35253,-122.05134,2021-07-27T14:04:00-0700?exclude=hourly,daily,flags',{"latitude":37.35253,"longitude":-122.05134,"timezone":"America/Los_Angeles","currently":{"time":1627419840,"summary":"Clear","icon":"clear-day","precipIntensity":0,"precipProbability":0,"temperature":86.36,"apparentTemperature":86.36,"dewPoint":53.15,"humidity":0.32,"pressure":1015.6,"windSpeed":7.24,"windGust":10.96,"windBearing":340,"cloudCover":0.04,"uvIndex":9,"visibility":10,"ozone":303.6},"minutely":{"summary":"Clear for the hour.","icon":"clear-day","data":[{"time":1627419840,"precipIntensity":0,"precipProbability":0},{"time":1627419900,"precipIntensity":0,"precipProbability":0}]},"offset":-7});

    test("Forecast with parameters", () => {
      return request(app)
        .post("/forecast").send({locations:
          "[{\"lat\":37.35234,\"lon\":-122.05129,\"distance\":0,\"time\":\"2021-07-27T11:00:00-0700\",\"bearing\":284.8270466961735},{\"lat\":37.37648,\"lon\":-122.16631,\"distance\":9,\"time\":\"2021-07-27T12:00:00-0700\",\"bearing\":304.2881770410651},{\"lat\":37.41531,\"lon\":-122.23805,\"distance\":19,\"time\":\"2021-07-27T13:00:00-0700\",\"bearing\":115.59316344832101},{\"lat\":37.35212,\"lon\":-122.07239,\"distance\":32,\"time\":\"2021-07-27T14:00:00-0700\",\"bearing\":88.59001156082968},{\"lat\":37.35253,\"lon\":-122.05134,\"distance\":33,\"time\":\"2021-07-27T14:04:00-0700\",\"bearing\":88.59001156082968}]",
      timezone: "America/Los_Angeles",service:"darksky",routeName:"SS-4thTU-D-Tuesday Loop-Taafe/Golden Oak",routenumber:28104621
    }).expect(200).expect({forecast:[
      {
          "time": "11:00AM",
          "distance": 0,
          "summary": "Clear",
          "tempStr": "79F",
          "precip": "0.0%",
          "cloudCover": "29.0%",
          "windSpeed": "4",
          "lat": 37.35234,
          "lon": -122.05129,
          "temp": "79",
          "fullTime": "Tue Jul 27 11:00AM 2021",
          "relBearing": 72.17295330382649,
          "rainy": false,
          "windBearing": 357,
          "vectorBearing": 284.8270466961735,
          "gust": "7",
          "feel": 79
      },
      {
          "time": "12:00PM",
          "distance": 9,
          "summary": "Clear",
          "tempStr": "81F",
          "precip": "0.0%",
          "cloudCover": "23.0%",
          "windSpeed": "5",
          "lat": 37.37648,
          "lon": -122.16631,
          "temp": "81",
          "fullTime": "Tue Jul 27 12:00PM 2021",
          "relBearing": 42.711822958934874,
          "rainy": false,
          "windBearing": 347,
          "vectorBearing": 304.2881770410651,
          "gust": "9",
          "feel": 81
      },
      {
          "time": "1:00PM",
          "distance": 19,
          "summary": "Clear",
          "tempStr": "79F",
          "precip": "0.0%",
          "cloudCover": "14.0%",
          "windSpeed": "6",
          "lat": 37.41531,
          "lon": -122.23805,
          "temp": "79",
          "fullTime": "Tue Jul 27 1:00PM 2021",
          "relBearing": 156.593163448321,
          "rainy": false,
          "windBearing": 319,
          "vectorBearing": 115.59316344832101,
          "gust": "10",
          "feel": 79
      },
      {
          "time": "2:00PM",
          "distance": 32,
          "summary": "Clear",
          "tempStr": "86F",
          "precip": "0.0%",
          "cloudCover": "4.0%",
          "windSpeed": "7",
          "lat": 37.35212,
          "lon": -122.07239,
          "temp": "86",
          "fullTime": "Tue Jul 27 2:00PM 2021",
          "relBearing": 105.59001156082968,
          "rainy": false,
          "windBearing": 343,
          "vectorBearing": 88.59001156082968,
          "gust": "11",
          "feel": 86
      },
      {
          "time": "2:04PM",
          "distance": 33,
          "summary": "Clear",
          "tempStr": "86F",
          "precip": "0.0%",
          "cloudCover": "4.0%",
          "windSpeed": "7",
          "lat": 37.35253,
          "lon": -122.05134,
          "temp": "86",
          "fullTime": "Tue Jul 27 2:04PM 2021",
          "relBearing": 108.59001156082968,
          "rainy": false,
          "windBearing": 340,
          "vectorBearing": 88.59001156082968,
          "gust": "11",
          "feel": 86
      }
  ]});
    });

  });

