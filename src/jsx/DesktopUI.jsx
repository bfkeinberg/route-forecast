import ErrorBoundary from "./errorBoundary";
import ForecastTable from "./forecastTable";
import MapLoader from "./mapLoader";
import PropTypes from "prop-types";
import React, { useState } from "react";
import RouteInfoForm from "./RouteInfoForm/RouteInfoForm";
import ForecastSettings from "./ForecastSettings/ForecastSettings";
import { TopBar } from "./TopBar/TopBar";
import PaceTable from "./resultsTab/PaceTable";
import { useSelector } from "react-redux";

const DesktopUI = ({showPaceTable, mapsApiKey}) => {
    const sidePaneOptions = [
        {title: "Route Info", content: <ErrorBoundary><RouteInfoForm routeProps={{}} /></ErrorBoundary>},
        {title: "Forecast Settings", content: <ErrorBoundary><ForecastSettings/></ErrorBoundary>},
        {title: "Forecast", content: <ErrorBoundary>{showPaceTable ? <PaceTable/> : <ForecastTable/>}</ErrorBoundary>}
    ]
    const [activeSidePane, setActiveSidePane] = useState(0)

    const sidebarWidth = 400

    const routeData = useSelector(state => state.routeInfo.rwgpsRouteData)
    const stravaActivityData = useSelector(state => state.strava.activityData)
    const forecastData = useSelector(state => state.forecast.forecast)
    // this is comically ugly but w/e
    const panesVisible = stravaActivityData !== null ? 3 : (routeData !== null ? (forecastData.length > 0 ? 3 : 2) : 1)
    
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
    showPaceTable: PropTypes.bool,
    mapsApiKey: PropTypes.string
};

export default DesktopUI;

const Sidebar = ({sidePaneOptions, activeSidePane, sidebarWidth}) => {
    return (
        sidePaneOptions.map(({title, content}, index) =>
            <div key={title} style={{display: index !== activeSidePane ? "none" : "", width: `${sidebarWidth}px`}}>
                {content}
            </div>
        )
    )
}