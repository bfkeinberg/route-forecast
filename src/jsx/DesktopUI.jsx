import "./DesktopUI.css"

import { Spinner } from "@blueprintjs/core";
import lazyRetry from "@tdotcode/react-lazy-retry";
import PropTypes from "prop-types";
import React, { Suspense,useState,StrictMode } from "react";
import { useSelector } from "react-redux";

import { routeLoadingModes } from "../data/enums";
import { useDelay, useForecastDependentValues,usePrevious, useValueHasChanged, useWhenChanged } from "../utils/hooks";
import { ForecastSettings } from "./ForecastSettings/ForecastSettings";
import { InstallExtensionButton } from "./InstallExtensionButton";
import MapLoader from "./Map/MapLoader";
import PaceTable from "./resultsTables/PaceTable";
import RouteInfoForm from "./RouteInfoForm/RouteInfoForm";
import ErrorBoundary from "./shared/ErrorBoundary";
import { RouteTitle } from "./shared/RouteTitle";
import { TransitionWrapper } from "./shared/TransitionWrapper";
import { TitleScreen } from "./TitleScreen";
import { TopBar } from "./TopBar/TopBar";
import LangSwitcher from "./app/LangSwitcher";
import {useTranslation} from 'react-i18next'

const DesktopUI = ({mapsApiKey}) => {
    const { t } = useTranslation()

    const LoadableForecastTable = lazyRetry(() => import(/* webpackChunkName: "ForecastTable" */ './resultsTables/ForecastTable'));
    const {adjustedTimes } = useForecastDependentValues()
    const titleRouteInfo = t("titles.routeInfo")
    const titleForecastSettings = t("titles.forecastSettings")
    const titleForecast = t("titles.forecast")
    const titlePaceAnalyis = t("titles.paceAnalysis")
    const sidePaneOptions = [
        {title: titleRouteInfo, content: <ErrorBoundary><RouteInfoForm routeProps={{}} /></ErrorBoundary>},
        {title: titleForecastSettings, content: <ErrorBoundary><ForecastSettings/></ErrorBoundary>},
        {title: titleForecast, content: <ErrorBoundary><Suspense fallback={<div>Loading ForecastTable...</div>}>{<LoadableForecastTable adjustedTimes={adjustedTimes}/>}</Suspense></ErrorBoundary>},
        {title: titlePaceAnalyis, content: <ErrorBoundary>{<PaceTable/>}</ErrorBoundary>}
    ]
    const [
        activeSidePane,
        setActiveSidePane
    ] = useState(0)

    const sidebarWidth = 645

    const rwgpsRouteData = useSelector(state => state.routeInfo.rwgpsRouteData)
    const gpxRouteData = useSelector(state => state.routeInfo.gpxRouteData)
    const routeData = rwgpsRouteData ? rwgpsRouteData : gpxRouteData
    const stravaActivityData = useSelector(state => state.strava.activityData)
    const forecastData = useSelector(state => state.forecast.forecast)

    const panesVisible = new Set()
    panesVisible.add(titleRouteInfo)
    if (routeData !== null) {
        panesVisible.add(titleForecastSettings)
    }
    if (forecastData.length > 0) {
        panesVisible.add(titleForecast)
    }
    if (stravaActivityData !== null) {
        panesVisible.add(titlePaceAnalyis)
    }

    useWhenChanged(routeData, () => setActiveSidePane(sidePaneOptions.findIndex(option => option.title === titleForecastSettings)))
    useWhenChanged(forecastData, () => setActiveSidePane(sidePaneOptions.findIndex(option => option.title === titleForecast)), forecastData.length > 0)
    useWhenChanged(stravaActivityData, () => setActiveSidePane(sidePaneOptions.findIndex(option => option.title === titlePaceAnalyis)))
    if (activeSidePane !== 0 && routeData === null && forecastData.length === 0) {
        setActiveSidePane(0)
    }

    const routeLoadingMode = useSelector(state => state.uiInfo.routeParams.routeLoadingMode)
    const mapDataExists = (routeLoadingMode === routeLoadingModes.RWGPS || routeLoadingMode === routeLoadingModes.RUSA_PERM) ?
     (forecastData.length > 0) :
    stravaActivityData !== null

    return (
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '100vh' }}>
            <StrictMode>
                {!mapDataExists ? <InstallExtensionButton /> : null}
                <div style={{ flexShrink: 0 }}>
                    <TopBar
                        sidePaneOptions={sidePaneOptions.map(({ title }) => title)}
                        activeSidePane={activeSidePane}
                        setActiveSidePane={setActiveSidePane}
                        sidebarWidth={sidebarWidth}
                        panesVisible={panesVisible}
                    />
                </div>
                <div style={{ display: "flex", flex: 1, height: '0px' }}>
                    <div style={{ maxHeight: '100%', overflowY: 'scroll' }}>
                        <Sidebar sidePaneOptions={sidePaneOptions} activeSidePane={activeSidePane} sidebarWidth={sidebarWidth} />
                    </div>
                    <div style={{
                        flexGrow: 1,
                        maxHeight: "100%",
                        borderLeft: "1px solid transparent",
                        borderImage: "linear-gradient(to bottom, grey , transparent)",
                        borderImageSlice: 1
                    }}>
                        {
                            (mapDataExists) ?
                                <MapLoader maps_api_key={mapsApiKey} /> :
                                <TitleScreen />
                        }
                    </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                    <LangSwitcher />
                </div>
            </StrictMode>
        </div>
    );
};

DesktopUI.propTypes = {
    mapsApiKey: PropTypes.string
};

export const useLoadingFromURLStatus = () => {
    const delay = 1000

    const loadingFromURL = useSelector(state => state.routeInfo.loadingFromURL)
    const started = useValueHasChanged(loadingFromURL, false)
    const finished = useValueHasChanged(loadingFromURL, true)
    const delayFinished = useDelay(delay, finished) || !started

    return [
        started,
         finished,
        delayFinished
    ]
}

const Sidebar = ({sidePaneOptions, activeSidePane, sidebarWidth}) => {

    const [
        loadingFromURLStarted,
        loadingFromURLFinished,
         displayContent
        ] = useLoadingFromURLStatus()

    const previousActivePane = usePrevious(activeSidePane)
    return (
        displayContent ?
        <TransitionWrapper diffData={activeSidePane} transitionTime={1} transitionType={previousActivePane < activeSidePane ? "slideLeft" : "slideRight"} width={sidebarWidth}>
            <div style={{width: `${sidebarWidth}px`}} className={loadingFromURLStarted ? "fade-in" : ""}>
                {sidePaneOptions[activeSidePane].content}
            </div>
        </TransitionWrapper> :
        <div style={{
            width: `${sidebarWidth - 25 * 2}px`,
            display: "flex",
            flexFlow: "column",
            alignItems: "center",
            padding: "25px",
            backgroundColor: "rgb(19,124,189)",
            height: "fit-content",
            borderRadius: "5px",
            margin: "25px",
            opacity: loadingFromURLFinished ? 0 : 1,
            transition: loadingFromURLFinished ? "opacity 1s ease-in" : ""
        }}>
            <LoadingFromURLOverlay/>
        </div>
    )
}

Sidebar.propTypes = {
    sidePaneOptions:PropTypes.array.isRequired,
    activeSidePane:PropTypes.number.isRequired,
    sidebarWidth:PropTypes.number.isRequired
};

const LoadingFromURLOverlay = () => {
    const type = useSelector(state => state.routeInfo.type)
    const routeData = useSelector(state => state.routeInfo[type === "rwgps" ? "rwgpsRouteData" : "gpxRouteData"])

    return (
        <>
            <RouteTitle style={{color: "white"}} className={routeData !== null ? "fade-in" : ""}/>
            <div style={{fontSize: "24px", color: "white", marginBottom: "10px"}}>Loading forecast...</div>
            <Spinner style={{color: "white"}}/>
        </>
    )
}

export default React.memo(DesktopUI)