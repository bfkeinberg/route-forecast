import ErrorBoundary from "./shared/ErrorBoundary";
import ForecastTable from "./resultsTables/ForecastTable";
import MapLoader from "./Map/MapLoader";
import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
import RouteInfoForm from "./RouteInfoForm/RouteInfoForm";
import { ForecastSettings } from "./ForecastSettings/ForecastSettings";
import { TopBar } from "./TopBar/TopBar";
import PaceTable from "./resultsTables/PaceTable";
import { useSelector } from "react-redux";
import { usePrevious } from "../utils/hooks";
import { TransitionWrapper } from "./shared/TransitionWrapper";

const DesktopUI = ({mapsApiKey}) => {
    const sidePaneOptions = [
        {title: "Route Info", content: <ErrorBoundary><RouteInfoForm routeProps={{}} /></ErrorBoundary>},
        {title: "Forecast Settings", content: <ErrorBoundary><ForecastSettings/></ErrorBoundary>},
        {title: "Forecast", content: <ErrorBoundary>{<ForecastTable/>}</ErrorBoundary>},
        {title: "Pace Analysis", content: <ErrorBoundary>{<PaceTable/>}</ErrorBoundary>}
    ]
    const [activeSidePane, setActiveSidePane] = useState(0)

    const sidebarWidth = 400

    const routeData = useSelector(state => state.routeInfo.rwgpsRouteData)
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

    // these three are a bit repetitive, could probably abstract somehow
    // however, i am lazy
    const previousRouteData = usePrevious(routeData)
    const newRouteData = previousRouteData !== routeData && routeData !== null
    useEffect(() => {
        if (newRouteData) {
            setActiveSidePane(sidePaneOptions.findIndex(option => option.title === "Forecast Settings"))
        }
    }, [newRouteData])

    const previousForecastData = usePrevious(forecastData)
    const newForecastData = previousForecastData !== forecastData && forecastData.length > 0
    useEffect(() => {
        if (newForecastData) {
            setActiveSidePane(sidePaneOptions.findIndex(option => option.title === "Forecast"))
        }
    }, [newForecastData])

    const previousStravaActivityData = usePrevious(stravaActivityData)
    const newStravaActivityData = previousStravaActivityData !== stravaActivityData && stravaActivityData !== null
    useEffect(() => {
        if (newStravaActivityData) {
            setActiveSidePane(sidePaneOptions.findIndex(option => option.title === "Pace Analysis"))
        }
    }, [newStravaActivityData])
    
    return (
        <div>
            <TopBar
                sidePaneOptions={sidePaneOptions.map(({title}) => title)}
                activeSidePane={activeSidePane}
                setActiveSidePane={setActiveSidePane}
                sidebarWidth={sidebarWidth}
                panesVisible={panesVisible}
            />
            <div style={{display: "flex"}}>
                <Sidebar sidePaneOptions={sidePaneOptions} activeSidePane={activeSidePane} sidebarWidth={sidebarWidth}/>
                <MapLoader maps_api_key={mapsApiKey}/>
            </div>
        </div>
    );
};

DesktopUI.propTypes = {
    mapsApiKey: PropTypes.string
};

export default DesktopUI;

const Sidebar = ({sidePaneOptions, activeSidePane, sidebarWidth}) => {
    const previousActivePane = usePrevious(activeSidePane)
    return (
        <TransitionWrapper diffData={activeSidePane} transitionTime={1} transitionType={previousActivePane < activeSidePane ? "slideLeft" : "slideRight"} width={sidebarWidth}>
            <div style={{width: `${sidebarWidth}px`}}>
                {sidePaneOptions[activeSidePane].content}
            </div>
        </TransitionWrapper>
    )
}