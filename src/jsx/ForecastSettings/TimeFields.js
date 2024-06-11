import { DateTime, Interval } from "luxon";
import React, {useState} from "react";
import { useDispatch, useSelector } from "react-redux";
import { finishTimeFormat, speedForTargetSet, editingFinishTimeSet } from "../../redux/reducer.js";
import { useActualFinishTime, useForecastDependentValues } from '../../utils/hooks';
import DateSelect from "./DateSelect";
import {useTranslation} from 'react-i18next'
import { Button } from "@blueprintjs/core";
import { Edit, PredictiveAnalysis} from '@blueprintjs/icons'
import { computeTargetSpeed } from "../../redux/actions.js";
import { DateInput3, TimePrecision } from "@blueprintjs/datetime2";
// import { Tooltip } from "@blueprintjs/core";
import Tooltip from "@mui/material/Tooltip"

// const LoadableDatePicker = lazy(() => componentLoader(import(/* webpackChunkName: "DateSelect" */ /* webpackPrefetch: true */ './DateSelect'), 5));

// const DatePickerLoader = (props) => {
//      return <Suspense fallback={<div>Loading date-time picker...</div>}>
//         <LoadableDatePicker {...props}/>
//      </Suspense>
// };

export const TimeFields = () => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const { finishTime: predictedFinishTime } = useForecastDependentValues()
  const [desiredElapsedTimeMinutes, setDesiredElapsedTimeMinutes] = React.useState(0)
  const distanceInKm = useSelector(state => state.routeInfo.distanceInKm)
  const startTimeMillis = useSelector(state => state.uiInfo.routeParams.startTimestamp)
  const timezone = useSelector(state => state.uiInfo.routeParams.zone)
  const startTime = DateTime.fromMillis(startTimeMillis, {zone:timezone})
  const predictedFinishTimeExists = predictedFinishTime !== null
  const [desiredFinishTime, setDesiredFinishTime] = useState(predictedFinishTimeExists ?  DateTime.fromFormat(predictedFinishTime, finishTimeFormat) : startTime)
  const actualFinishTime = useActualFinishTime()
  const editingFinishTime = useSelector(state => state.uiInfo.dialogParams.editingFinishTime)

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

  const editFinishTime = () => {
    dispatch(editingFinishTimeSet(!editingFinishTime))
    if (editingFinishTime) {      // if this is true then we are about to disable this mode
      dispatch(speedForTargetSet(0))
    }
  }

  const setDesiredCompletionTime = (event) => {
    const selectedTime = DateTime.fromISO(event)
    setDesiredFinishTime(selectedTime)
    const selectedInterval = Interval.fromDateTimes(startTime, selectedTime)
    setDesiredElapsedTimeMinutes(selectedInterval.length('minutes'))
  }

  const getTargetSpeed = (event) => {
    return dispatch(computeTargetSpeed(desiredElapsedTimeMinutes))
  }

  const rightElement = () => {
    return editingFinishTime ? (<Button minimal icon={<PredictiveAnalysis size={16}/>} onClick={getTargetSpeed}/>) : <></>
  }

  // roughly 8mph, why not
  const maxHoursPermitted = Math.ceil(distanceInKm / 13)
  let maxDate = startTime.plus({hours:maxHoursPermitted}).toJSDate()
  
  const showPicker = () => {
    return (editingFinishTime ? (
      <div style={{ display: "flex", justifyContent: "center", margin: "5px 0px 10px 0px", width: '370px' }}>
        <span style={{ fontSize: ".875rem", fontWeight: "bolder", flex: '3.75 ', padding: "0px 5px" }}>{t('labels.predictFromFinish')}</span>
        <div style={{flex: 7.5, width: 304}}>
        <DateInput3
          onChange={setDesiredCompletionTime}
          closeOnSelection={false}
          placeholder="M/D/YYYY"
          value={desiredFinishTime.toISO()}
          fill={false}
          minDate={startTime.toJSDate()}
          maxDate={maxDate}
          timePrecision={TimePrecision.MINUTE}
          showTimezoneSelect={false}
          timePickerProps={{ useAmPm: true, showArrowButtons: true }}
          dateFnsFormat='MMMM d, yyyy h:mmaaa'
          timezone={timezone}
          rightElement={rightElement()}
        />
        </div>
      </div>
    ) : <></>)
  }

  return (
    <>
      <DateSelect />
      <div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0px" }}>
            <span style={{ fontSize: ".875rem", fontWeight: "bolder", flex: 1, padding: "0px 5px" }}>{t('labels.projectedFinish')}</span>
            <span style={{ display: "flex", flex: 2.5 }}>
              <div style={{ ...timeFieldStyle, backgroundColor: predictedFinishTimeExists ? "rgb(19, 124, 189)" : "rgba(0, 0, 0, 0.05)", fontStyle: predictedFinishTimeExists ? "" : "oblique", color: predictedFinishTimeExists ? "white" : "rgba(0, 0, 0, 0.5)" }}>
                {displayPredictedFinishTime}
              </div>
              <Tooltip followCursor arrow title={t('buttons.editFinishTime')}>
                <Button minimal icon={<Edit size={12} />} onClick={editFinishTime} />
              </Tooltip>
            </span>
          </div>
          {showPicker()}
        </div>
        {actualFinishTime !== null &&
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "10px 0px" }}>
            <span style={{ fontSize: ".875rem", fontWeight: "bolder", flex: 1, padding: "0px 5px" }}>Actual finish time</span>
            <span style={{ flex: 2.5 }}>
              <div style={{ ...timeFieldStyle, backgroundColor: "rgba(234, 89, 41, 0.8)", color: "white" }}>
                {actualFinishTime}
              </div>
            </span>
          </div>}
      </div>
    </>
  )
}