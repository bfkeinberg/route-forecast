import ErrorBoundary from "./errorBoundary";
import ControlPoints from "./ControlPoints/ControlPoints";
import PaceTable from "./paceTable";
import ForecastTable from "./forecastTable";
import MapLoader from "./mapLoader";
import PropTypes from "prop-types";
import React, { useState } from "react";
import RouteInfoForm from "./RouteInfoForm/RouteInfoForm";

const DesktopUI = ({showPacePerTme, mapsApiKey}) => {
    const sidePaneOptions = [
        {title: "Route Info", content: <ErrorBoundary><RouteInfoForm routeProps={{}} /></ErrorBoundary>},
        {title: "Control Points", content: <ErrorBoundary><ControlPoints/></ErrorBoundary>},
        {title: "Forecast", content: <ErrorBoundary>{showPacePerTme ? <PaceTable/> : <ForecastTable/>}</ErrorBoundary>}
    ]
    const [activeSidePane, setActiveSidePane] = useState(0)
    
    return (
        <div>
            <TopBar sidePaneOptions={sidePaneOptions.map(({title}) => title)} activeSidePane={activeSidePane} setActiveSidePane={setActiveSidePane}/>
            <div style={{display: "flex"}}>
                <Sidebar>
                    {sidePaneOptions.map(({content}, index) =>
                        <div style={{display: index !== activeSidePane ? "none" : "", width: "400px"}}>
                            {content}
                        </div>
                    )}
                </Sidebar>
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

const TopBar = ({sidePaneOptions, activeSidePane, setActiveSidePane}) => {
    return (
        <div style={{height: "50px", display: "flex", alignItems: "center"}}>
            <NonexistentLogo/>
            {sidePaneOptions.map((option, index) =>
                <TopBarItem active={activeSidePane === index} key={option} onClick={() => setActiveSidePane(index)}>
                    <div style={{fontWeight: "bold"}}>
                        {option}
                    </div>
                </TopBarItem>
            )}
        </div>
    )
}

const NonexistentLogo = () => {
    return (
        <TopBarItem>
            <div style={{fontSize: "30px"}}>
                Randoplan
            </div>
            <span style={{fontSize: "6px"}}>(imagine a world where one had a logo)</span>
        </TopBarItem>
    )
}

const TopBarItem = ({children, active, onClick}) => {
    const style = {
        cursor: onClick !== undefined ? "pointer" : "",
        borderRight: "1px solid #00000050",
        borderBottom: active ? "" : "1px solid #00000030",
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "10px",
        userSelect: "none",
        backgroundColor: (active || onClick === undefined) ? "" : "#00000030"
    }

    return (
        <div onClick={onClick} style={style}>
            {children}
        </div>
    )
}

const Sidebar = ({children}) => {
    return children
}