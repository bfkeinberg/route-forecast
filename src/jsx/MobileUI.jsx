import ErrorBoundary from "./shared/ErrorBoundary";
import PaceTable from "./resultsTables/PaceTable";
import ForecastTable from "./resultsTables/ForecastTable";
import MapLoader from "./Map/MapLoader";
import { useJsApiLoader } from '@react-google-maps/api';
import PropTypes from "prop-types";
import React from "react";
import { Route, Routes, Link, MemoryRouter, useNavigate } from "react-router-dom";
import { Button, IconSize, Intent, Navbar, NavbarGroup, NavbarDivider, NavbarHeading, Alignment } from "@blueprintjs/core";
import {Shop, Globe, Route as RouteIcon, Cloud, Cycle } from "@blueprintjs/icons";
import {connect, useSelector} from 'react-redux';
import RouteInfoForm from "./RouteInfoForm/RouteInfoForm";
import { ForecastSettings } from "./ForecastSettings/ForecastSettings";
import { useWhenChanged, useForecastDependentValues } from "../utils/hooks";

const MobileUI = (props) => {
    return (
        <MemoryRouter>
            <MobileUITabs {...props} />
        </MemoryRouter>
    )
};

MobileUI.propTypes = {
    routeLoadingMode: PropTypes.number,
    mapsApiKey: PropTypes.string.isRequired,
    needToViewTable: PropTypes.bool.isRequired,
    needToViewMap: PropTypes.bool.isRequired
};

const mapStateToProps = (state) =>
    ({
        routeLoadingMode:state.uiInfo.routeParams.routeLoadingMode,
        needToViewTable:state.forecast.valid && !state.forecast.tableViewed,
        needToViewMap:state.forecast.valid && !state.forecast.mapViewed
    });

export default connect(mapStateToProps)(MobileUI);

const MobileUITabs = (props) => {
    const { isLoaded:googleMapsIsLoaded } = useJsApiLoader({
        googleMapsApiKey: props.mapsApiKey
      })

    const navigate = useNavigate()
    const type = useSelector(state => state.routeInfo.type)
    const routeData = useSelector(state => state.routeInfo[type === "rwgps" ? "rwgpsRouteData" : "gpxRouteData"])
    const stravaActivityData = useSelector(state => state.strava.activityData)
    const forecastData = useSelector(state => state.forecast.forecast)
    useWhenChanged(routeData, () => navigate("/controlPoints", {replace:true}))
    useWhenChanged(forecastData, () => navigate("/forecastTable", {replace:true}), forecastData.length > 0)
    useWhenChanged(stravaActivityData, () => navigate("/paceTable", {replace:true}))
    const {adjustedTimes} = useForecastDependentValues()
    return (
        <>
            <Navbar>
                <NavbarGroup align={Alignment.CENTER}>
                    <NavbarHeading>Randoplan</NavbarHeading>
                    <ErrorBoundary>
                        <Link to={"/"} className={'nav-link'}>
                            <Button minimal icon={<RouteIcon/>} title={"home"} intent={Intent.PRIMARY}></Button>
                        </Link>
                    </ErrorBoundary>
                    <NavbarDivider/>
                    <ErrorBoundary>
                        <Link to={"/controlPoints/"} className={'nav-link'}>
                            <Shop icon={Shop } size={IconSize.STANDARD} title={"controls"} htmlTitle={"controls"} intent={Intent.NONE} />
                        </Link>
                    </ErrorBoundary>
                    <NavbarDivider/>
                    <Link to={"/map/"} className={'nav-link'}>
                        <Globe size={IconSize.STANDARD} title={"map"} htmlTitle={"map"} intent={props.needToViewMap ? Intent.DANGER : Intent.NONE}/>
                    </Link>
                    <NavbarDivider/>
                    <Link to={"/forecastTable/"} className={'nav-link'}>
                        <Cloud size={IconSize.STANDARD} title={"forecast"} htmlTitle={"forecast"} intent={props.needToViewTable ? Intent.DANGER : Intent.NONE}/>
                    </Link>
                    <NavbarDivider/>
                    <Link to={"/paceTable/"} className={'nav-link'}>
                        <Cycle color="orange" title={"strava"} htmlTitle={"Strava"} size={IconSize.STANDARD} intent={props.needToViewTable ? Intent.DANGER : Intent.NONE} />
                    </Link>
                </NavbarGroup>
            </Navbar>
            <Routes>
                <Route path="/" element={<RouteInfoForm />} />
                <Route path="/controlPoints/" element={<ForecastSettings />} />
                <Route path="/map/" element={googleMapsIsLoaded ? <MapLoader maps_api_key={props.mapsApiKey}/> : <span>Maps not loaded</span>} />
                <Route path="/forecastTable/" element={<ForecastTable adjustedTimes={adjustedTimes}/>} />
                <Route path="/paceTable/" element={<PaceTable />} />
            </Routes>
        </>
    )
}

MobileUITabs.propTypes = {
    mapsApiKey:PropTypes.string.isRequired,
    needToViewTable:PropTypes.bool.isRequired,
    needToViewMap:PropTypes.bool.isRequired
};