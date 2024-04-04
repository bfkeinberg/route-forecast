import { Toast2 } from '@blueprintjs/core';
import React from 'react';
import ReactGA from "react-ga4";
import { useDispatch,useSelector } from "react-redux";

import { displayControlTableUiSet, errorDetailsSet,metricToggled } from '../../redux/reducer';
import LocationContext from '../locationContext';
import { RouteTitle } from '../shared/RouteTitle';
import { ToggleButton } from "../shared/ToggleButton";
import { ToggleButtonOpaque } from "../shared/ToggleButtonOpaque";
import { ControlTableContainer } from './ControlTableContainer';
import ForecastButton from "./ForecastButton";
import ForecastInterval from "./ForecastInterval";
import RidingPace from "./RidingPace";
import { TimeFields } from "./TimeFields";
import WeatherProviderSelector from "./WeatherProviderSelector";

export const ForecastSettings = () => {
    // always show weather provider
    const showProvider = true; //useSelector(state => state.controls.showWeatherProvider)
    const metric = useSelector(state => state.controls.metric)
    const dispatch = useDispatch()
    const errorDetails = useSelector(state => state.uiInfo.dialogParams.errorDetails)

    const showControlPoints = useSelector(state => state.controls.displayControlTableUI)
    const setShowControlPoints = () => { ReactGA.event('select_content', { content_type: 'controls' });return dispatch(displayControlTableUiSet(!showControlPoints)) }

    return (
        <div style={{ display: "flex", flexFlow: "column", alignItems: "center", marginBottom: "5px" }}>
            <div style={{ padding: "10px" }}>
                <RouteTitle />
                <TimeFields />
                <div style={{ display: "flex" }}>
                    <RidingPace />
                    <ToggleButton style={{ flex: 1, margin: "24px 0px 0px 10px" }} active={metric} onClick={() => dispatch(metricToggled())}>Metric</ToggleButton>
                </div>
                <div style={{ display: "flex", margin: "30px 0px" }}>
                    <ForecastInterval />
                </div>
                {errorDetails !== null && <Toast2 message={errorDetails} timeout={0} onDismiss={() => dispatch(errorDetailsSet(null))} intent="danger"></Toast2>}
                {showProvider && (
                    <WeatherProviderSelector />
                )}
                <div style={{ display: "flex", margin: "30px 0px" }}>
                    <LocationContext.Consumer>
                        {value => <ForecastButton href={value.href} origin={value.origin} />}
                    </LocationContext.Consumer>
                </div>
            </div>
            <ToggleButtonOpaque icon={"chevron-down"} active={showControlPoints} onClick={() => setShowControlPoints(!showControlPoints)}>Add Stops</ToggleButtonOpaque>
            {showControlPoints && <ControlTableContainer />}
        </div>
    );
}
