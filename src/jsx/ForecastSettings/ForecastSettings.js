import React from 'react';
import { ControlTableContainer } from './ControlTableContainer';
import { setDisplayControlTableUI, toggleMetric, setErrorDetails } from "../../redux/actions";
import ForecastInterval from "./ForecastInterval";
import RidingPace from "./RidingPace";
import { useSelector, useDispatch } from "react-redux";
import WeatherProviderSelector from "./WeatherProviderSelector";
import ForecastButton from "./ForecastButton";
import { ToggleButton } from "../shared/ToggleButton";
import { ToggleButtonOpaque } from "../shared/ToggleButtonOpaque";
import { TimeFields } from "./TimeFields";
import { RouteTitle } from '../shared/RouteTitle';
import LocationContext from '../locationContext';
import ReactGA from "react-ga4";
import { Toast } from '@blueprintjs/core';

export const ForecastSettings = () => {
    // always show weather provider
    const showProvider = true; //useSelector(state => state.controls.showWeatherProvider)
    const metric = useSelector(state => state.controls.metric)
    const dispatch = useDispatch()
    const errorDetails = useSelector(state => state.uiInfo.dialogParams.errorDetails)

    const showControlPoints = useSelector(state => state.controls.displayControlTableUI)
    const setShowControlPoints = () => { ReactGA.event('select_content', { content_type: 'controls' });return dispatch(setDisplayControlTableUI(!showControlPoints)) }

    return (
        <div style={{ display: "flex", flexFlow: "column", alignItems: "center", marginBottom: "5px" }}>
            <div style={{ padding: "10px" }}>
                <RouteTitle />
                <TimeFields />
                <div style={{ display: "flex" }}>
                    <RidingPace />
                    <ToggleButton style={{ flex: 1, margin: "24px 0px 0px 10px" }} active={metric} onClick={() => dispatch(toggleMetric())}>Metric</ToggleButton>
                </div>
                <div style={{ display: "flex", margin: "30px 0px" }}>
                    <ForecastInterval />
                </div>
                {errorDetails !== null && <Toast message={errorDetails} timeout={0} onDismiss={() => dispatch(setErrorDetails(null))} intent="danger"></Toast>}
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