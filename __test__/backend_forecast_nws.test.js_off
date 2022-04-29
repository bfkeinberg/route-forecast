const callWeatherService = require('../src/jsx/server/weatherForecastDispatcher');
// const callWeatherService = require('../dist/server/weatherForecastDispatcher');
process.env.NO_LOGGING = true;
const app = require("../src/jsx/server/server");
app.set('views', './__test__/views');
const axios = require('axios');

/***
locations:
'[{"lat":37.80756,"lon":-122.47494,"distance":0,"time":"2022-03-18T07:00:00-0700","bearing":338.9934156315169},{"lat":37.92107,"lon":-122.5302,"distance":10,"time":"2022-03-18T08:00:00-0700","bearing":309.7746793517349},{"lat":38.01627,"lon":-122.6755,"distance":23,"time":"2022-03-18T09:00:00-0700","bearing":325.19041411749254},{"lat":38.0922399,"lon":-122.74263,"distance":35,"time":"2022-03-18T10:01:00-0700","bearing":32.7124151211673},{"lat":38.20924,"lon":-122.64696,"distance":46,"time":"2022-03-18T11:01:00-0700","bearing":352.13138820212174},{"lat":38.37646,"lon":-122.67644,"distance":60,"time":"2022-03-18T12:01:00-0700","bearing":328.9053495194686},{"lat":38.54699,"lon":-122.808,"distance":75,"time":"2022-03-18T13:01:00-0700","bearing":238.35009383188532},{"lat":38.51854,"lon":-122.86696,"distance":88,"time":"2022-03-18T14:01:00-0700","bearing":256.09793683037066},{"lat":38.48947,"lon":-123.01652,"distance":100,"time":"2022-03-18T15:01:00-0700","bearing":223.89793644942446},{"lat":38.41953,"lon":-123.10238,"distance":112,"time":"2022-03-18T16:01:00-0700","bearing":135.0617862538803},{"lat":38.3340699,"lon":-122.99373,"distance":124,"time":"2022-03-18T17:02:00-0700","bearing":143.53121830796422},{"lat":38.23996,"lon":-122.9052,"distance":135,"time":"2022-03-18T18:02:00-0700","bearing":159.0282635695124},{"lat":38.1088499,"lon":-122.84134,"distance":147,"time":"2022-03-18T19:02:00-0700","bearing":135.53805794022114},{"lat":38.0235399,"lon":-122.73512,"distance":159,"time":"2022-03-18T20:02:00-0700","bearing":109.07446351554415},{"lat":37.97698,"lon":-122.56475,"distance":171,"time":"2022-03-18T21:02:00-0700","bearing":152.88048903636474},{"lat":37.84359,"lon":-122.47826,"distance":183,"time":"2022-03-18T22:02:00-0700","bearing":175.83610877276087},{"lat":37.80756,"lon":-122.47494,"distance":186,"time":"2022-03-18T22:21:00-0700","bearing":175.83610877276087}]',
timezone: "America/Los_Angeles", service: "nws", routeName: "Healdsburg EPP 300K", routenumber: 36475496
****/
describe("Test forecast", () => {
  const OLD_ENV = process.env;

  test("Forecast with parameters", async () => {
      let forecast = await callWeatherService('nws', 37.80756, -122.47494, '2022-03-18T07:00:00-0700', 0, "America/Los_Angeles", 338.9934156315169);
    expect(forecast).not.toBeNull();
  });


  }
);


