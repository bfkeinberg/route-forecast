import ErrorBoundary from "./shared/ErrorBoundary";
import ForecastTable from "./resultsTables/ForecastTable";
import MapLoader from "./Map/MapLoader";
import PropTypes from "prop-types";
import React, { useState } from "react";
import RouteInfoForm from "./RouteInfoForm/RouteInfoForm";
import { ForecastSettings } from "./ForecastSettings/ForecastSettings";
import { TopBar } from "./TopBar/TopBar";
import PaceTable from "./resultsTables/PaceTable";
import { useSelector } from "react-redux";
import { useDelay, usePrevious, useValueHasChanged, useWhenChanged, useForecastDependentValues } from "../utils/hooks";
import { TransitionWrapper } from "./shared/TransitionWrapper";
import { TitleScreen } from "./TitleScreen";
import { routeLoadingModes } from "../data/enums";
import { Spinner } from "@blueprintjs/core";
import "./DesktopUI.css"
import { RouteTitle } from "./shared/RouteTitle";
import { InstallExtensionButton } from "./InstallExtensionButton";

const DesktopUI = ({mapsApiKey}) => {
    const {adjustedTimes } = useForecastDependentValues()
    const sidePaneOptions = [
        {title: "Route Info", content: <ErrorBoundary><RouteInfoForm routeProps={{}} /></ErrorBoundary>},
        {title: "Forecast Settings", content: <ErrorBoundary><ForecastSettings/></ErrorBoundary>},
        {title: "Forecast", content: <ErrorBoundary>{<ForecastTable adjustedTimes={adjustedTimes}/>}</ErrorBoundary>},
        {title: "Pace Analysis", content: <ErrorBoundary>{<PaceTable/>}</ErrorBoundary>}
    ]
    const [
        activeSidePane,
        setActiveSidePane
    ] = useState(0)

    const sidebarWidth = 600

    const rwgpsRouteData = useSelector(state => state.routeInfo.rwgpsRouteData)
    const gpxRouteData = useSelector(state => state.routeInfo.gpxRouteData)
    const routeData = rwgpsRouteData ? rwgpsRouteData : gpxRouteData
    const stravaActivityData = useSelector(state => state.strava.activityData)
    const forecastData = useSelector(state => state.forecast.forecast)

    const panesVisible = new Set()
    panesVisible.add("Route Info")
    if (routeData !== null) {
        panesVisible.add("Forecast Settings")
    }
    if (forecastData.length > 0) {
        panesVisible.add("Forecast")
    }
    if (stravaActivityData !== null) {
        panesVisible.add("Pace Analysis")
    }

    useWhenChanged(routeData, () => setActiveSidePane(sidePaneOptions.findIndex(option => option.title === "Forecast Settings")))
    useWhenChanged(forecastData, () => setActiveSidePane(sidePaneOptions.findIndex(option => option.title === "Forecast")), forecastData.length > 0)
    useWhenChanged(stravaActivityData, () => setActiveSidePane(sidePaneOptions.findIndex(option => option.title === "Pace Analysis")))
    if (activeSidePane !== 0 && routeData === null && forecastData.length === 0) {
        setActiveSidePane(0)
    }

    const routeLoadingMode = useSelector(state => state.uiInfo.routeParams.routeLoadingMode)
    const mapDataExists = (routeLoadingMode === routeLoadingModes.RWGPS) ? (forecastData.length > 0) : stravaActivityData !== null

    return (
        <div>
            {!mapDataExists ? <InstallExtensionButton/>:null}
            <TopBar
                sidePaneOptions={sidePaneOptions.map(({title}) => title)}
                activeSidePane={activeSidePane}
                setActiveSidePane={setActiveSidePane}
                sidebarWidth={sidebarWidth}
                panesVisible={panesVisible}
            />
            <div style={{display: "flex"}}>
                <Sidebar sidePaneOptions={sidePaneOptions} activeSidePane={activeSidePane} sidebarWidth={sidebarWidth}/>
                <div style={{
                    flexGrow: 1,
                    height: "calc(100vh - 50px)",
                    borderLeft: "1px solid transparent",
                    borderImage: "linear-gradient(to bottom, grey , transparent)",
                    borderImageSlice: 1
                }}>
                    {mapDataExists ? <MapLoader maps_api_key={mapsApiKey}/> : <TitleScreen/>}
                </div>
            </div>
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

export default DesktopUI;