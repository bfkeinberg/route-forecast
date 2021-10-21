const axios = require('axios');
const fetch = require('node-fetch');

const iqAirHandler = (lat, lon) => {

    const iqAirkey = process.env.IQAIR_KEY;
    const iqAirurl = `https://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${iqAirkey}`;

    console.info(`IQAir url ${iqAirurl}`);
    fetch(iqAirurl).then(fetchResult => {
        if (!fetchResult.ok) {
            throw Error(fetchResult.status)
        }
        return fetchResult.json()
    })
        .then(body => {
            if (body.status === 'success') {
                const aqi = body.data.current.pollution.aqius;
                return aqi;
            } else {
                console.error(`Error, status : ${body.status}`);
                throw Error(400);
            }
        })
        .catch(err => {
            console.error(`NO IQAir results because of ${err}`);
            return undefined;
        });
};

const makeUrl = (lat, lon, rangeInKm) => {
    let boundingBox = calcBoundingBox(parseFloat(lat), parseFloat(lon), rangeInKm);

    const purpleAirKey = process.env.PURPLE_AIR_KEY;
    let purpleAirUrl =
        `https://api.purpleair.com/v1/sensors?fields=pm2.5_cf_1,ozone1,humidity,latitude,longitude&location_type=0&nwlng=${boundingBox[0]}&nwlat=${boundingBox[2]}&selng=${boundingBox[1]}&selat=${boundingBox[3]}&api_key=${purpleAirKey}`;
    // console.info(`purpleAir url for ${lat},${lon} at ${rangeInKm}km is ${purpleAirUrl}`);
    return purpleAirUrl;
};
  
const getPurpleAirAQI = async function (lat, lon) {
    let ranges = [0.5, 2, 5, 10, 20, 40];
    try {
        for (let range of ranges) {
            let purpleAirUrl = makeUrl(lat, lon, range);
            let purpleairResult = await axios.get(purpleAirUrl).catch(async error => {
                if (error.response !== undefined) {
                    console.error(`[AXIOS] error at ${lat} ${lon}`, error.response.data);
                }
                else {
                    console.error(`[AXIOS] error at ${lat} ${lon}`, error);
                }
                return undefined;
            });
            // if (purpleairResult !== undefined) {
            //     console.info(`Purple Air result ${JSON.stringify(purpleairResult.data)}`);
            // }
            if (purpleairResult !== undefined && purpleairResult.data !== undefined && purpleairResult.data.data[0] !== undefined) {
                const aqi = processPurpleResults(lat, lon, purpleairResult.data);
                return aqi;
            }
        }
    } catch (err) {
        console.error(`No Purple Air results for ${lat} ${lon} because : ${err}`);
    }
    console.error(`No conditions returned from Purple Air`);
    return undefined; //iqAirHandler(lat, lon);
}

const toRad = function (val) {
    return val * Math.PI / 180;
};

const greatCircleRadius = {
    miles: 3956,
    km: 6367
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    var dLat = toRad(lat2 - lat1),
        dLon = toRad(lon2 - lon1);

    lat1 = toRad(lat1);
    lat2 = toRad(lat2);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return greatCircleRadius.km * c;
};

// sort the results so that we take aqi from the closest sensor
const processPurpleResults = (lat, lon, results) => {
    let pm25index = results.fields.indexOf('pm2.5_cf_1');
    let humidityIndex = results.fields.indexOf('humidity');
    let sensorLatitude = results.fields.indexOf('latitude');
    let sensorLongitude = results.fields.indexOf('longitude');
    const data = results.data.sort((first, second) => {
        return calculateDistance(lat, lon, first[sensorLatitude], first[sensorLongitude]) - calculateDistance(lat, lon, second[sensorLatitude], second[sensorLongitude])
    });
    if (data[0] === undefined) {
        return undefined;       // if all the PM2.5 entries are zero
    }
    return usEPAfromPm(data[0][pm25index], data[0][humidityIndex]);
};

const toDegrees = (radians) => radians * 180 / Math.PI;
const toRadians = (degrees) => degrees * Math.PI / 180;

const calcBoundingBox = (lat, lon, distInKm) => {
    const R = 6371;   // radius of Earth in km

    let widthInDegrees = toDegrees(distInKm / R / Math.cos(toRadians(lat)));
    let x1 = lon - widthInDegrees;
    let x2 = lon + widthInDegrees;
    let heightInDegrees = toDegrees(distInKm / R);
    let y1 = lat + heightInDegrees;
    let y2 = lat - heightInDegrees;
    return [
        x1,
        x2,
        y1,
        y2
    ];
}

const usEPAfromPm = (pm, rh) => {
    const aqi = aqiFromPM(0.534 * pm - 0.0844 * rh + 5.604);
    if (aqi < 0) {
        console.warn(`weird AQI: PM=${pm} humidity=${rh}`);
        return pm;
    }
    return aqi;
};

function aqiFromPM(pm) {

    if (isNaN(pm)) { return "-"; }
    if (pm == undefined) { return "-"; }
    if (pm < 0) { return pm; }
    if (pm > 1000) { return "-"; }

    //
    //       Good                              0 - 50         0.0 - 15.0         0.0 – 12.0
    // Moderate                        51 - 100           >15.0 - 40        12.1 – 35.4
    // Unhealthy for Sensitive Groups   101 – 150     >40 – 65          35.5 – 55.4
    // Unhealthy                                 151 – 200         > 65 – 150       55.5 – 150.4
    // Very Unhealthy                    201 – 300 > 150 – 250     150.5 – 250.4
    // Hazardous                                 301 – 400         > 250 – 350     250.5 – 350.4
    // Hazardous                                 401 – 500         > 350 – 500     350.5 – 500
    //
    if (pm > 350.5) {
        return calcAQI(pm, 500, 401, 500, 350.5);
    } else if (pm > 250.5) {
        return calcAQI(pm, 400, 301, 350.4, 250.5);
    } else if (pm > 150.5) {
        return calcAQI(pm, 300, 201, 250.4, 150.5);
    } else if (pm > 55.5) {
        return calcAQI(pm, 200, 151, 150.4, 55.5);
    } else if (pm > 35.5) {
        return calcAQI(pm, 150, 101, 55.4, 35.5);
    } else if (pm > 12.1) {
        return calcAQI(pm, 100, 51, 35.4, 12.1);
    } else if (pm >= 0) {
        return calcAQI(pm, 50, 0, 12, 0);
    }
    return undefined;


}
function bplFromPM(pm) {
    if (isNaN(pm)) { return 0; }
    if (pm == undefined) { return 0; }
    if (pm < 0) { return 0; }

    //
    //       Good                              0 - 50         0.0 - 15.0         0.0 – 12.0
    // Moderate                        51 - 100           >15.0 - 40        12.1 – 35.4
    // Unhealthy for Sensitive Groups   101 – 150     >40 – 65          35.5 – 55.4
    // Unhealthy                                 151 – 200         > 65 – 150       55.5 – 150.4
    // Very Unhealthy                    201 – 300 > 150 – 250     150.5 – 250.4
    // Hazardous                                 301 – 400         > 250 – 350     250.5 – 350.4
    // Hazardous                                 401 – 500         > 350 – 500     350.5 – 500
    //
    if (pm > 350.5) {
        return 401;
    } else if (pm > 250.5) {
        return 301;
    } else if (pm > 150.5) {
        return 201;
    } else if (pm > 55.5) {
        return 151;
    } else if (pm > 35.5) {
        return 101;
    } else if (pm > 12.1) {
        return 51;
    } else if (pm >= 0) {
        return 0;
    }
    return 0;


}
function bphFromPM(pm) {
    // return 0;
    if (isNaN(pm)) { return 0; }
    if (pm == undefined) { return 0; }
    if (pm < 0) { return 0; }

    //
    //       Good                              0 - 50         0.0 - 15.0         0.0 – 12.0
    // Moderate                        51 - 100           >15.0 - 40        12.1 – 35.4
    // Unhealthy for Sensitive Groups   101 – 150     >40 – 65          35.5 – 55.4
    // Unhealthy                                 151 – 200         > 65 – 150       55.5 – 150.4
    // Very Unhealthy                    201 – 300 > 150 – 250     150.5 – 250.4
    // Hazardous                                 301 – 400         > 250 – 350     250.5 – 350.4
    // Hazardous                                 401 – 500         > 350 – 500     350.5 – 500
    //
    if (pm > 350.5) {
        return 500;
    } else if (pm > 250.5) {
        return 500;
    } else if (pm > 150.5) {
        return 300;
    } else if (pm > 55.5) {
        return 200;
    } else if (pm > 35.5) {
        return 150;
    } else if (pm > 12.1) {
        return 100;
    } else if (pm >= 0) {
        return 50;
    }
    return 0;


}

function calcAQI(Cp, Ih, Il, BPh, BPl) {

    var a = Ih - Il;
    var b = BPh - BPl;
    var c = Cp - BPl;
    return Math.round(a / b * c + Il);

}

module.exports = getPurpleAirAQI;