import { Col, Row } from "reactstrap";
import { FinishTime } from "./FinishTime";
import React, { Suspense } from "react";
import { toggleDisplayBanked, toggleMetric } from "../actions/actions";
import { Tooltip2 } from "@blueprintjs/popover2";
import Recalculate from "./Recalculate";
import ForecastInterval from "./ForecastInterval";
import RidingPace from "./RidingPace";
import { lazy } from '@loadable/component';
import { componentLoader } from "../actions/actions.js";
import StravaAnalysisIntervalInput from "./StravaAnalysisIntervalInput";
import { useSelector } from "react-redux";
import WeatherProviderSelector from "./WeatherProviderSelector";
import { useDispatch } from "react-redux";

const LoadableDatePicker = lazy(() => componentLoader(import(/* webpackChunkName: "DateSelect" */ /* webpackPrefetch: true */ './DateSelect'), 5));

const DatePickerLoader = (props) => {
     return <Suspense fallback={<div>Loading date-time picker...</div>}>
        <LoadableDatePicker {...props}/>
     </Suspense>
};

export const SettingsStrava = () => {
  const showProvider = useSelector(state => state.controls.showWeatherProvider)
  const metric = useSelector(state => state.controls.metric)
  const displayBanked = useSelector(state => state.controls.displayBanked)
  const dispatch = useDispatch()

  return (
    <div className="controls-container">
      <Row>
        <Col>
          <DatePickerLoader />
          <Recalculate />
        </Col>
      </Row>
      <Row>
        <div style={{ display: "flex" }}>
          <div style={{ flex: 1, padding: "5px" }}>
            <RidingPace />
          </div>
        </div>
      </Row>
      <div className="controls-item controls-item-finish-time">
        <FinishTime />
      </div>
      <div className="controls-item">
        <div id="metric" className="controls-item-contents">
          <span className="controls-checkbox-label">Metric</span>
          <Tooltip2 usePortal={true} content='Control distances in km, other units displayed in km or degrees C'>
            <input type='checkbox' checked={metric} onChange={() => dispatch(toggleMetric())} />
          </Tooltip2>
        </div>
      </div>
      <div id="banked" className="controls-item">
        <div id="metric" className="controls-item-contents">
          <span className="controls-checkbox-label">Display banked time</span>
          <Tooltip2 usePortal={true} placement='bottom' content='Show how many minutes remain to be within ACP/RUSA brevet finishing times'>
            <input type='checkbox' checked={displayBanked} onChange={() => dispatch(toggleDisplayBanked())} />
          </Tooltip2>
        </div>
      </div>
      {showProvider && (
        <WeatherProviderSelector />
      )}
    </div>
  )
}