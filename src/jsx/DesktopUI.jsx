import ErrorBoundary from "./errorBoundary";
import ForecastTable from "./forecastTable";
import MapLoader from "./mapLoader";
import PropTypes from "prop-types";
import React, { useState } from "react";
import RouteInfoForm from "./RouteInfoForm/RouteInfoForm";
import ForecastSettings from "./ForecastSettings/ForecastSettings";
import { TopBar } from "./TopBar/TopBar";
import PaceTable from "./resultsTab/PaceTable";

const DesktopUI = ({showPacePerTme, mapsApiKey}) => {
    const sidePaneOptions = [
        {title: "Route Info", content: <ErrorBoundary><RouteInfoForm routeProps={{}} /></ErrorBoundary>},
        {title: "Forecast Settings", content: <ErrorBoundary><ForecastSettings/></ErrorBoundary>},
        {title: "Forecast", content: <ErrorBoundary>{showPacePerTme ? <PaceTable/> : <ForecastTable/>}</ErrorBoundary>}
    ]
    const [activeSidePane, setActiveSidePane] = useState(0)

    const sidebarWidth = 400
    
    return (
        <div>
            <TopBar
                sidePaneOptions={sidePaneOptions.map(({title}) => title)}
                activeSidePane={activeSidePane}
                setActiveSidePane={setActiveSidePane}
                sidebarWidth={sidebarWidth}
            />
            <div style={{display: "flex"}}>
                <Sidebar sidePaneOptions={sidePaneOptions} activeSidePane={activeSidePane} sidebarWidth={sidebarWidth}/>
                <MapLoader maps_api_key={mapsApiKey}/>
            </div>
        </div>
    );
};

DesktopUI.propTypes = {
    showPacePerTme: PropTypes.bool,
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