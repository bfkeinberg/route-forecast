import React from "react";
import { useSelector } from 'react-redux';
import { useActualFinishTime } from '../../utils/hooks';
import { DateTime } from "luxon";
import { finishTimeFormat } from "../../redux/reducer.js";
import DateSelect from "./DateSelect";

// const LoadableDatePicker = lazy(() => componentLoader(import(/* webpackChunkName: "DateSelect" */ /* webpackPrefetch: true */ './DateSelect'), 5));

// const DatePickerLoader = (props) => {
//      return <Suspense fallback={<div>Loading date-time picker...</div>}>
//         <LoadableDatePicker {...props}/>
//      </Suspense>
// };

export const TimeFields = () => {
  let predictedFinishTime = useSelector(state => state.routeInfo.finishTime)
  const actualFinishTime = useActualFinishTime()

  // to match datepicker displayed format
  const newDateFormat = 'MMMM dd, yyyy h:mm a';
  predictedFinishTime = DateTime.fromFormat(predictedFinishTime, finishTimeFormat).toFormat(newDateFormat)

  const timeFieldStyle = {
    width: "240px",
    fontSize: "16px",
    border: "1px solid #00000050",
    padding: "5px 13px",
    borderRadius: "3px",
    whiteSpace: "nowrap"
  }

  return (
    <>
      <DateSelect />
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0px" }}>
          <span style={{ fontSize: ".875rem", fontWeight: "bolder", flex: 1, padding: "0px 5px" }}>Projected finish time</span>
            <span style={{flex: 2.5}}>
              <div style={{...timeFieldStyle, backgroundColor: "rgba(0, 0, 0, 0.05)",}}>
                {predictedFinishTime}
              </div>
            </span>
        </div>
        {actualFinishTime !== null &&
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0px" }}>
            <span style={{ fontSize: ".875rem", fontWeight: "bolder", flex: 1, padding: "0px 5px" }}>Actual finish time</span>
            <span style={{flex: 2.5}}>
              <div style={{...timeFieldStyle, backgroundColor: "rgb(234, 89, 41)", color: "white"}}>
                {actualFinishTime}
              </div>
            </span>
          </div>}
      </div>
    </>
  )
}