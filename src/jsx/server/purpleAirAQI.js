const axios = require('axios');

const getPurpleAirAQI = async function (lat, lon) {
    let boundingBox = calcBoundingBox(parseFloat(lat), parseFloat(lon), 10);

    const purpleAirKey = process.env.PURPLE_AIR_KEY;
    let purpleAirUrl =
        `https://api.purpleair.com/v1/sensors?fields=pm2.5_cf_1,ozone1,humidity,latitude,longitude&location_type=0&nwlng=${boundingBox[0]}&nwlat=${boundingBox[2]}&selng=${boundingBox[1]}&selat=${boundingBox[3]}&api_key=${purpleAirKey}`;
    try {
        let purpleairResult = await axios.get(purpleAirUrl);
        if (purpleairResult.data.data[0] === undefined) {
            console.error('No conditions returned from Purple Air');
            return undefined;
        }
        return processPurpleResults(lat, lon, purpleairResult.data);

    } catch (err) {
        console.error(err);
        throw Error(`No Purple Air results because : ${err}`)
    }
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
    let ozoneIndex = results.fields.indexOf('ozone1');
    let humidityIndex = results.fields.indexOf('humidity');
    let sensorLatitude = results.fields.indexOf('latitude');
    let sensorLongitude = results.fields.indexOf('longitude');
    results.data.sort((first, second) => {
        return calculateDistance(lat, lon, first[sensorLatitude], first[sensorLongitude]) - calculateDistance(lat, lon, second[sensorLatitude], second[sensorLongitude])
    });
    return usEPAfromPm(results.data[0][pm25index], results.data[0][humidityIndex]);
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

const aqanduAQIFromPM = (pm) => {
    return aqiFromPM(0.778 * pm + 2.65);
};

const usEPAfromPm = (pm, rh) => {
    return aqiFromPM(0.534 * pm - 0.0844 * rh + 5.604);
};

function aqiFromPM (pm) {

    if (isNaN(pm)) {return "-";}
    if (pm == undefined) {return "-";}
    if (pm < 0) {return pm;}
    if (pm > 1000) {return "-";}

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
function bplFromPM (pm) {
    if (isNaN(pm)) {return 0;}
    if (pm == undefined) {return 0;}
    if (pm < 0) {return 0;}

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
function bphFromPM (pm) {
    // return 0;
    if (isNaN(pm)) {return 0;}
    if (pm == undefined) {return 0;}
    if (pm < 0) {return 0;}

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

function calcAQI (Cp, Ih, Il, BPh, BPl) {

    var a = Ih - Il;
    var b = BPh - BPl;
    var c = Cp - BPl;
    return Math.round(a / b * c + Il);

}

module.exports = getPurpleAirAQI;