import { Toast2 } from '@blueprintjs/core';
import React from 'react';
import ReactGA from "react-ga4";
import { useDispatch,useSelector } from "react-redux";
import {useTranslation} from 'react-i18next'

import { displayControlTableUiSet, errorDetailsSet,metricToggled } from '../../redux/reducer';
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
import Segment from './Segment';

export const ForecastSettings = () => {
    const metric = useSelector(state => state.controls.metric)
    const dispatch = useDispatch()
    const errorDetails = useSelector(state => state.uiInfo.dialogParams.errorDetails)
    const { t } = useTranslation()
    const showControlPoints = useSelector(state => state.controls.displayControlTableUI)
    const editingFinishTime = useSelector(state => state.uiInfo.dialogParams.editingFinishTime)
    const setShowControlPoints = () => { ReactGA.event('select_content', { content_type: 'controls' });return dispatch(displayControlTableUiSet(!showControlPoints)) }

    return (
        <div style={{ display: "flex", flexFlow: "column", alignItems: "center", marginBottom: "5px" }}>
            <div style={{ padding: "10px" }}>
                <RouteTitle />
                <TimeFields />
                <div style={{ display: "flex" }}>
                    <RidingPace disabled={editingFinishTime}/>
                    <div style={{ flex: 1, cursor: "pointer", display: "flex", flexFlow: "column", alignItems: "flex-end" }} onClick={() => dispatch(metricToggled())}>
                        <div style={{ width: "fit-content", borderBottom: !metric ? "1px solid #106ba3" : "1px solid #0000" }}>{t('labels.englishSystem')}</div>
                        <div style={{ fontSize: "10px", color: "grey", opacity: !metric ? 1 : 0, transition: "opacity 0.3s", marginTop: "3px", textAlign: "end" }}>{t('labels.miles')}</div>
                    </div>
                    <AlwaysFilledSwitch checked={metric} onChange={() => dispatch(metricToggled())}></AlwaysFilledSwitch>
                    <div style={{ flex: 1, cursor: "pointer", display: "flex", flexFlow: "column" }} onClick={() => dispatch(metricToggled())}>
                        <div style={{ width: "fit-content", borderBottom: metric ? "1px solid rgb(234, 89, 41)" : "1px solid #0000" }}>{t('labels.metricSystem')}</div>
                        <div style={{ fontSize: "10px", color: "grey", opacity: metric ? 1 : 0, transition: "opacity 0.3s", marginTop: "3px" }}>{t('labels.kilometers')}</div>
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
            <ToggleButtonOpaque icon={"chevron-down"} active={showControlPoints} onClick={() => setShowControlPoints(!showControlPoints)}>{t('buttons.stops')}</ToggleButtonOpaque>
            {showControlPoints && <ControlTableContainer />}
        </div>
    )
}
