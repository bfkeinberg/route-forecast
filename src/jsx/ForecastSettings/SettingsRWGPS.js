import { Col, Row } from "reactstrap";
import { FinishTime } from "./FinishTime";
import React, { Suspense } from "react";
import { toggleDisplayBanked, toggleMetric } from "../../redux/actions";
import { Tooltip2 } from "@blueprintjs/popover2";
import Recalculate from "./Recalculate";
import ForecastInterval from "./ForecastInterval";
import RidingPace from "./RidingPace";
import { lazy } from '@loadable/component';
import { componentLoader } from "../../redux/actions.js";
import { useSelector } from "react-redux";
import WeatherProviderSelector from "./WeatherProviderSelector";
import { useDispatch } from "react-redux";
import ForecastButton from "./ForecastButton";
import { ToggleButton } from "../shared/ToggleButton";

const LoadableDatePicker = lazy(() => componentLoader(import(/* webpackChunkName: "DateSelect" */ /* webpackPrefetch: true */ './DateSelect'), 5));

const DatePickerLoader = (props) => {
     return <Suspense fallback={<div>Loading date-time picker...</div>}>
        <LoadableDatePicker {...props}/>
     </Suspense>
};

export const SettingsRWGPS = () => {
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
            <ForecastInterval />
          </div>
          <div style={{ flex: 1, padding: "5px" }}>
            <RidingPace />
          </div>
        </div>
      </Row>
      <div className="controls-item controls-item-finish-time">
        <FinishTime />
      </div>
      <ToggleButton active={metric} onClick={() => dispatch(toggleMetric())}>Metric</ToggleButton>
      <Tooltip2 usePortal={true} placement='bottom' content='Show how many minutes remain to be within ACP/RUSA brevet finishing times'>
        <ToggleButton active={displayBanked} onClick={() => dispatch(toggleDisplayBanked())}>Display banked time</ToggleButton>
      </Tooltip2>
      {showProvider && (
        <WeatherProviderSelector />
      )}
      <ForecastButton />
    </div>
  )
}