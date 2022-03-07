import React from 'react';
import { ControlTableContainer } from './ControlTableContainer';
import { setDisplayControlTableUI, toggleMetric } from "../../redux/actions";
import ForecastInterval from "./ForecastInterval";
import RidingPace from "./RidingPace";
import { useSelector, useDispatch } from "react-redux";
import WeatherProviderSelector from "./WeatherProviderSelector";
import ForecastButton from "./ForecastButton";
import { ToggleButton } from "../shared/ToggleButton";
import { TimeFields } from "./TimeFields";
import { RouteTitle } from '../shared/RouteTitle';
import LocationContext from '../locationContext';

export const ForecastSettings = () => {
    const showProvider = useSelector(state => state.controls.showWeatherProvider)
    const metric = useSelector(state => state.controls.metric)
    const dispatch = useDispatch()

    const showControlPoints = useSelector(state => state.controls.displayControlTableUI)
    const setShowControlPoints = () => dispatch(setDisplayControlTableUI(!showControlPoints))

    return (
        <div style={{display: "flex", flexFlow: "column", alignItems: "center", marginBottom: "5px"}}>
            <div style={{ padding: "10px" }}>
                <RouteTitle/>
                <TimeFields />
                <div style={{ display: "flex" }}>
                    <RidingPace />
                    <ToggleButton style={{flex: 1, margin: "24px 0px 0px 10px"}} active={metric} onClick={() => dispatch(toggleMetric())}>Metric</ToggleButton>
                </div>
                <div style={{ display: "flex", margin: "30px 0px" }}>
                    <ForecastInterval />
                </div>
                <div style={{ display: "flex", margin: "30px 0px" }}>
                    <LocationContext.Consumer>
                        <ForecastButton />
                    </LocationContext.Consumer>
            </div>
                {showProvider && (
                    <WeatherProviderSelector />
                )}
            </div>
            <ToggleButton icon={"chevron-down"} active={showControlPoints} onClick={() => setShowControlPoints(!showControlPoints)}>Add Stops</ToggleButton>
            {showControlPoints && <ControlTableContainer/>}
        </div>
    );
}