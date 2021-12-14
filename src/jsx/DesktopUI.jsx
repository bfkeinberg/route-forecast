import ErrorBoundary from "./errorBoundary";
import PaceTable from "./paceTable";
import ForecastTable from "./forecastTable";
import MapLoader from "./mapLoader";
import PropTypes from "prop-types";
import React, { useState } from "react";
import RouteInfoForm from "./RouteInfoForm/RouteInfoForm";
import DonationRequest from "./DonationRequest";
import BugReportButton from "./BugReportButton";
import PaceExplanation from "./PaceExplanation";
import ShortUrl from "./RouteInfoForm/ShortUrl";
import ForecastSettings from "./ForecastSettings/ForecastSettings";

const DesktopUI = ({showPacePerTme, mapsApiKey}) => {
    const sidePaneOptions = [
        {title: "Route Info", content: <ErrorBoundary><RouteInfoForm routeProps={{}} /></ErrorBoundary>},
        {title: "Control Points", content: <ErrorBoundary><ForecastSettings/></ErrorBoundary>},
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

const TopBar = ({sidePaneOptions, activeSidePane, setActiveSidePane, sidebarWidth}) => {
    return (
        <div style={{display: "flex"}}>
            <div style={{height: "50px", display: "flex", alignItems: "center", width: `${sidebarWidth}px`}}>
                {sidePaneOptions.map((option, index) =>
                    <TopBarItem active={activeSidePane === index} key={option} onClick={() => setActiveSidePane(index)}>
                        <div style={{fontWeight: "bold"}}>
                            {option}
                        </div>
                    </TopBarItem>
                )}
            </div>
            <div style={{display: "flex", flexGrow: 1, alignItems: "center", padding: "0px 20px"}}>
                <PaceExplanation/>
                <div style={{flexGrow: 1, display: "flex", justifyContent: "flex-end", alignItems: "center"}}>
                    <ShortUrl/>
                    <DonationRequest wacky/>
                    <div style={{margin: "0px 10px", flexShrink: 0}}><BugReportButton/></div>
                    <NonexistentLogo/>
                </div>
            </div>
        </div>
    )
}

const NonexistentLogo = () => {
    return (
        <div style={{userSelect: "none", padding: "0px 10px"}}>
            <span style={{fontSize: "30px"}}>
                Randoplan
            </span>
            <span style={{fontSize: "6px"}}>(pretend this is a logo)</span>
        </div>
    )
}

const TopBarItem = ({children, active, onClick}) => {
    const style = {
        cursor: "pointer",
        borderRight: "1px solid #00000050",
        borderBottom: active ? "" : "1px solid #00000030",
        height: "100%",
        display: "flex",
        alignItems: "center",
        padding: "10px",
        userSelect: "none",
        backgroundColor: active ? "" : "#00000030",
        flex: 1,
        justifyContent: "center",
        transition: "background-color 0.3s"
    }

    return (
        <div onClick={onClick} style={style}>
            {children}
        </div>
    )
}

const Sidebar = ({sidePaneOptions, activeSidePane, sidebarWidth}) => {
    return (
        sidePaneOptions.map(({content}, index) =>
            <div style={{display: index !== activeSidePane ? "none" : "", width: `${sidebarWidth}px`}}>
                {content}
            </div>
        )
    )
}