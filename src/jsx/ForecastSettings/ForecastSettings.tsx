import ReactGA from "react-ga4";i18n
import {useTranslation} from 'react-i18next'
import  MediaQuery, {useMediaQuery} from 'react-responsive';
import { maxWidthForMobile } from '../../utils/util';
import { errorDetailsSet } from '../../redux/dialogParamsSlice';
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
import i18n from '../app/i18n';
import { Button, Notification, Checkbox, Collapse, Stack, CheckboxGroup, Paper } from '@mantine/core';
import { Settings} from "tabler-icons-react"
import { useAppSelector, useAppDispatch } from '../../utils/hooks';
import { ChangeEvent, useState } from 'react';
import { ChevronDown } from 'tabler-icons-react';
import { useDisclosure } from '@mantine/hooks';

export const ForecastSettings = () => {
    // const [showSettings, setShowSettings] = useState(false)
    const [settingsOpened, { toggle }] = useDisclosure(false);
    const [computeStdDev, setComputeStdDEv] = useState(false)
    const [downloadAll, setDownloadAll] = useState(false)
    const metric = useAppSelector(state => state.controls.metric)
    const celsius = useAppSelector(state => state.controls.celsius)
    const dispatch = useAppDispatch()
    const errorDetails = useAppSelector(state => state.uiInfo.dialogParams.errorDetails)
    const { t } = useTranslation()
    const showControlPoints = useAppSelector(state => state.controls.displayControlTableUI)
    const setShowControlPoints = () => { ReactGA.event('select_content', { content_type: 'controls' });return dispatch(displayControlTableUiSet(!showControlPoints)) }
    const onDesktop = useMediaQuery({query:`(min-width: ${maxWidthForMobile})`})

    const toggleStdDev = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target) setDownloadAll(false)
        return setComputeStdDEv(event.target.value==='on')
    }

    const toggleDownloadAll = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target) setComputeStdDEv(false)
        return setDownloadAll(event.target.value==='on')
    }
    
    return (
        <div style={{ display: "flex", flexFlow: "column", alignItems: "center", marginBottom: "5px" }}>
            <div style={{ padding: "10px" }}>
                <RouteTitle />
                <TimeFields />
                <div style={{ display: "flex", justifyContent: 'space-evenly'}}>
                    <RidingPace />
                    <div style={{ display: 'flex', justifyContent: 'space-evenly' }}>
                        <div style={{ flex: 2, cursor: "pointer", display: "flex", flexFlow: "column", alignItems: "flex-end" }} 
                            onClick={() => {ReactGA.event('select_content', {content_type: 'metric'}); dispatch(metricToggled())}}>
                            <div style={{ width: "fit-content", borderBottom: !metric ? "1px solid #106ba3" : "1px solid #0000" }}>{t('labels.englishSystem')}</div>
                            <div style={{ display: onDesktop ? 'block' : 'none', fontSize: "10px", color: "grey", opacity: !metric ? 1 : 0, transition: "opacity 0.3s", marginTop: "3px", textAlign: "end" }}>{t('labels.miles')}</div>
                        </div>
                        <AlwaysFilledSwitch id={'metricImperialSwitch'} checked={metric} onChange={() => {ReactGA.event('select_content', {content_type: 'metric'}); dispatch(metricToggled())}}></AlwaysFilledSwitch>
                        <div style={{ flex: 2, cursor: "pointer", display: "flex", flexFlow: "column" }} onClick={() => dispatch(metricToggled())}>
                            <div style={{ width: "fit-content", borderBottom: metric ? "1px solid rgb(234, 89, 41)" : "1px solid #0000" }}>{t('labels.metricSystem')}</div>
                            <div style={{  display: onDesktop ? 'block' : 'none', fontSize: "10px", color: "grey", opacity: metric ? 1 : 0, transition: "opacity 0.3s", marginTop: "3px" }}>{t('labels.kilometers')}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex' }}>
                        <div style={{ flex: 1, cursor: "pointer", display: "flex", flexFlow: "column", alignItems: "flex-end" }} onClick={() => {ReactGA.event('select_content', {content_type: 'celsius'}); dispatch(celsiusToggled())}}>
                            <div style={{ width: "fit-content", borderBottom: !celsius ? "1px solid #106ba3" : "1px solid #0000" }}>{onDesktop?'Fahrenheit':'F'}</div>
                            <div style={{  display: onDesktop ? 'block' : 'none', fontSize: "10px", color: "grey", opacity: !celsius ? 1 : 0, transition: "opacity 0.3s", marginTop: "3px", textAlign: "end" }}>{t('labels.degreesF')}</div>
                        </div>
                        <AlwaysFilledSwitch id={'celsiusFahrenheitSwitch'} checked={celsius} onChange={() => {ReactGA.event('select_content', {content_type: 'celsius'}); dispatch(celsiusToggled())}}></AlwaysFilledSwitch>
                        <div style={{ flex: 1, cursor: "pointer", display: "flex", flexFlow: "column" }} onClick={() => dispatch(celsiusToggled())}>
                            <div style={{ width: "fit-content", borderBottom: celsius ? "1px solid rgb(234, 89, 41)" : "1px solid #0000" }}>{onDesktop?'Celsius':'C'}</div>
                            <div style={{  display: onDesktop ? 'block' : 'none', fontSize: "10px", color: "grey", opacity: celsius ? 1 : 0, transition: "opacity 0.3s", marginTop: "3px" }}>{ t('labels.degreesC')}</div>
                        </div>
                    </div>
                </div>
                <Segment/>
                <div style={{ display: "flex", margin: "30px 0px" }}>
                    <ForecastInterval />
                </div>
                {errorDetails !== null && <Notification color='red' onClose={() => dispatch(errorDetailsSet(null))}>{errorDetails}</Notification>}
                <Collapse in={settingsOpened}>
                    <Stack>
                        <Paper withBorder shadow={"md"} radius={3} >
                            <CheckboxGroup>
                                <Checkbox label={t("buttons.standardDeviation")} checked={computeStdDev} onChange={toggleStdDev} />
                                <Checkbox label={t("buttons.downloadAll")} labelPosition='right' checked={downloadAll} onChange={toggleDownloadAll} />
                            </CheckboxGroup>
                        </Paper>
                    </Stack>
                </Collapse>
                <div style={{ display: "flex", justifyContent: 'space-between' }}>
                    <WeatherProviderSelector />
{                    <MediaQuery maxDeviceWidth={1050}>
                        <Button size='small' variant='subtle' onClick={toggle} leftSection={<Settings/>}></Button>
                    </MediaQuery>
}                </div>
                <div style={{ display: "flex", margin: "30px 0px" }}>
                    <LocationContext.Consumer>
                        {value => <ForecastButton href={value.href} origin={value.origin} computeStdDev={computeStdDev} downloadAll={downloadAll} />}
                    </LocationContext.Consumer>
                </div>
            </div>
            <ToggleButtonOpaque icon={<ChevronDown/>} active={showControlPoints} onClick={() => {setShowControlPoints()}}>{t('buttons.stops')}</ToggleButtonOpaque>
            {showControlPoints && <ControlTableContainer />}
        </div>
    )
}
