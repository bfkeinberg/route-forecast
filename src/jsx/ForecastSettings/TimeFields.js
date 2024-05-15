import { DateTime } from "luxon";
import React from "react";

import { finishTimeFormat } from "../../redux/reducer.js";
import { useActualFinishTime, useForecastDependentValues } from '../../utils/hooks';
import DateSelect from "./DateSelect";
import {useTranslation} from 'react-i18next'
// const LoadableDatePicker = lazy(() => componentLoader(import(/* webpackChunkName: "DateSelect" */ /* webpackPrefetch: true */ './DateSelect'), 5));

// const DatePickerLoader = (props) => {
//      return <Suspense fallback={<div>Loading date-time picker...</div>}>
//         <LoadableDatePicker {...props}/>
//      </Suspense>
// };

export const TimeFields = () => {
  const { t } = useTranslation()
  const { finishTime: predictedFinishTime } = useForecastDependentValues()

  const predictedFinishTimeExists = predictedFinishTime !== null
  const actualFinishTime = useActualFinishTime()

  // to match datepicker displayed format
  const newDateFormat = 'MMMM dd, yyyy h:mm a';
  const displayPredictedFinishTime = predictedFinishTimeExists ?
    DateTime.fromFormat(predictedFinishTime, finishTimeFormat).toFormat(newDateFormat) :
    t('data.noForecastPlaceholder')

  const timeFieldStyle = {
    width: "240px",
    fontSize: "16px",
    border: "1px solid #00000050",
    padding: "5px 0px",
    borderRadius: "3px",
    whiteSpace: "nowrap",
    textAlign: "center"
  }

  return (
    <>
      <DateSelect />
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0px" }}>
          <span style={{ fontSize: ".875rem", fontWeight: "bolder", flex: 1, padding: "0px 5px" }}>{t('labels.projectedFinish')}</span>
            <span style={{flex: 2.5}}>
              <div style={{...timeFieldStyle, backgroundColor: predictedFinishTimeExists ? "rgb(19, 124, 189)" : "rgba(0, 0, 0, 0.05)", fontStyle: predictedFinishTimeExists ? "" : "oblique", color: predictedFinishTimeExists ? "white" : "rgba(0, 0, 0, 0.5)"}}>
                {displayPredictedFinishTime}
              </div>
            </span>
        </div>
        {actualFinishTime !== null &&
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0px" }}>
            <span style={{ fontSize: ".875rem", fontWeight: "bolder", flex: 1, padding: "0px 5px" }}>Actual finish time</span>
            <span style={{flex: 2.5}}>
              <div style={{...timeFieldStyle, backgroundColor: "rgba(234, 89, 41, 0.8)", color: "white"}}>
                {actualFinishTime}
              </div>
            </span>
          </div>}
      </div>
    </>
  )
}