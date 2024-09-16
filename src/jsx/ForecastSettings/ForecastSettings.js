import { Toast2 } from '@blueprintjs/core';
import * as React from 'react';
import ReactGA from "react-ga4";
import { useDispatch,useSelector } from "react-redux";
import {useTranslation} from 'react-i18next'
import  {useMediaQuery} from 'react-responsive';
import { maxWidthForMobile } from '../../utils/util';
import { errorDetailsSet } from '../../redux/reducer';
import { displayControlTableUiSet, metricToggled, celsiusToggled } from '../../redux/controlsSlice';
import LocationContext from '../locationContext';
import { AlwaysFilledSwitch } from '../RouteInfoForm/AlwaysFilledSwitch'
import { RouteTitle } from '../shared/RouteTitle';
import { ToggleButtonOpaque } from "../shared/ToggleButtonOpaque";
import { ControlTableContainer } from './ControlTableContainer';
import ForecastButton from "./ForecastButton";
import ForecastInterval from "./ForecastInterval";
import RidingPace from "./RidingPace";
import { TimeFields } from "./TimeFields";
import WeatherProviderSelector from "./WeatherProviderSelector"
import Segment from './Segment'
import * as Sentry from "@sentry/react";

export const ForecastSettings = () => {
    const metric = useSelector(state => state.controls.metric)
    const celsius = useSelector(state => state.controls.celsius)
    const dispatch = useDispatch()
    const errorDetails = useSelector(state => state.uiInfo.dialogParams.errorDetails)
    const { t } = useTranslation()
    const showControlPoints = useSelector(state => state.controls.displayControlTableUI)
    const setShowControlPoints = () => { ReactGA.event('select_content', { content_type: 'controls' });return dispatch(displayControlTableUiSet(!showControlPoints)) }
    const onDesktop = useMediaQuery({query:`(min-width: ${maxWidthForMobile})`})
    return (
        <div style={{ display: "flex", flexFlow: "column", alignItems: "center", marginBottom: "5px" }}>
            <div style={{ padding: "10px" }}>
                <RouteTitle />
                <TimeFields />
                <div style={{ display: "flex" }}>
                    <RidingPace />
                    <div style={{ flex: 1, cursor: "pointer", display: "flex", flexFlow: "column", alignItems: "flex-end" }} onClick={() => {Sentry.metrics.increment("metric", 1); dispatch(metricToggled())}}>
                        <div style={{ width: "fit-content", borderBottom: !metric ? "1px solid #106ba3" : "1px solid #0000" }}>{t('labels.englishSystem')}</div>
                        <div style={{ fontSize: "10px", color: "grey", opacity: !metric ? 1 : 0, transition: "opacity 0.3s", marginTop: "3px", textAlign: "end" }}>{t('labels.miles')}</div>
                    </div>
                    <AlwaysFilledSwitch id={'metricImperialSwitch'} checked={metric} onChange={() => dispatch(metricToggled())}></AlwaysFilledSwitch>
                    <div style={{ flex: 1, cursor: "pointer", display: "flex", flexFlow: "column" }} onClick={() => dispatch(metricToggled())}>
                        <div style={{ width: "fit-content", borderBottom: metric ? "1px solid rgb(234, 89, 41)" : "1px solid #0000" }}>{t('labels.metricSystem')}</div>
                        <div style={{ fontSize: "10px", color: "grey", opacity: metric ? 1 : 0, transition: "opacity 0.3s", marginTop: "3px" }}>{t('labels.kilometers')}</div>
                    </div>
                    <div style={{ flex: 1, cursor: "pointer", display: "flex", flexFlow: "column", alignItems: "flex-end" }} onClick={() => {Sentry.metrics.increment("celsius", 1); dispatch(celsiusToggled())}}>
                        <div style={{ width: "fit-content", borderBottom: !celsius ? "1px solid #106ba3" : "1px solid #0000" }}>{onDesktop?'Fahrenheit':'F'}</div>
                        <div style={{ fontSize: "10px", color: "grey", opacity: !celsius ? 1 : 0, transition: "opacity 0.3s", marginTop: "3px", textAlign: "end" }}>{t('labels.degreesF')}</div>
                    </div>
                    <AlwaysFilledSwitch id={'celsiusFahrenheitSwitch'} checked={celsius} onChange={() => dispatch(celsiusToggled())}></AlwaysFilledSwitch>
                    <div style={{ flex: 1, cursor: "pointer", display: "flex", flexFlow: "column" }} onClick={() => dispatch(celsiusToggled())}>
                        <div style={{ width: "fit-content", borderBottom: celsius ? "1px solid rgb(234, 89, 41)" : "1px solid #0000" }}>{onDesktop?'Celsius':'C'}</div>
                        <div style={{ fontSize: "10px", color: "grey", opacity: celsius ? 1 : 0, transition: "opacity 0.3s", marginTop: "3px" }}>{t('labels.degreesC')}</div>
                    </div>
                </div>
                <Segment/>
                <div style={{ display: "flex", margin: "30px 0px" }}>
                    <ForecastInterval />
                </div>
                {errorDetails !== null && <Toast2 message={errorDetails} timeout={0} onDismiss={() => dispatch(errorDetailsSet(null))} intent="danger"></Toast2>}
                <WeatherProviderSelector />
                <div style={{ display: "flex", margin: "30px 0px" }}>
                    <LocationContext.Consumer>
                        {value => <ForecastButton href={value.href} origin={value.origin} />}
                    </LocationContext.Consumer>
                </div>
            </div>
            <ToggleButtonOpaque icon={"chevron-down"} active={showControlPoints} onClick={() => {Sentry.metrics.increment("controls", 1); setShowControlPoints(!showControlPoints)}}>{t('buttons.stops')}</ToggleButtonOpaque>
            {showControlPoints && <ControlTableContainer />}
        </div>
    )
}
