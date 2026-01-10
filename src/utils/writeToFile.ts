import { mkConfig, generateCsv, asBlob } from "export-to-csv";
import type { AllForecasts } from "../jsx/ForecastSettings/ForecastButton";
import { Forecast } from "../redux/forecastSlice";
export const writeObjToFile = (dataToWrite: AllForecasts, writeCsvNotJson: boolean) => {
    const aElement = document.createElement('a');
    let href
    if (writeCsvNotJson) {
        let dataArray = new Array<Forecast>()
        const dataAsArray = Object.entries(dataToWrite)
            .reduce((accum,current)=>{let cRes=current[1]
                .reduce((iA,iC) => {let cr={provider:current[0],...iC};iA
                .push(cr);return iA},new Array<Forecast>);return accum.concat(cRes)},dataArray)
        Object.keys(dataToWrite).map((key) => {return {key:key, ...dataToWrite[key]}})
        const csvConfig = mkConfig({ columnHeaders: ["provider","time","distance",
            "summary","precip","temp","cloudCover","windSpeed","humidity"] });
        const csv = generateCsv(csvConfig)(dataAsArray);
        const blob = asBlob(csvConfig)(csv);
        aElement.setAttribute('download', 'forecasts.csv');
        href = URL.createObjectURL(blob)

    } else {
        aElement.setAttribute('download', 'forecasts.json');

        href = URL.createObjectURL(new Blob([JSON.stringify(dataToWrite)], {type:'application/json'}))
    }
    aElement.href = href;
    aElement.setAttribute('target', '_blank');
    aElement.click();
    URL.revokeObjectURL(href)
}