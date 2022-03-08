import ErrorBoundary from "./shared/ErrorBoundary";
import PaceTable from "./resultsTables/PaceTable";
import ForecastTable from "./resultsTables/ForecastTable";
import MapLoader from "./Map/MapLoader";
import PropTypes from "prop-types";
import React from "react";
import { Route, Routes, Link, MemoryRouter, useNavigate } from "react-router-dom";
import {createMemoryHistory} from 'history';
import {Nav, NavItem, NavbarBrand} from "reactstrap";
import { Icon, Intent } from "@blueprintjs/core";
import {IconNames} from "@blueprintjs/icons";
import {connect, useSelector} from 'react-redux';
import RouteInfoForm from "./RouteInfoForm/RouteInfoForm";
import { ForecastSettings } from "./ForecastSettings/ForecastSettings";
import { useWhenChanged } from "../utils/hooks";

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
    const navigate = useNavigate()
    const routeData = useSelector(state => state.routeInfo.rwgpsRouteData)
    const stravaActivityData = useSelector(state => state.strava.activityData)
    const forecastData = useSelector(state => state.forecast.forecast)
    useWhenChanged(routeData, () => navigate("/controlPoints", {replace:true}))
    useWhenChanged(forecastData, () => navigate("/forecastTable", {replace:true}), forecastData.length > 0)
    useWhenChanged(stravaActivityData, () => navigate("/paceTable", {replace:true}))
    return (
        <>
            <Nav tabs>
                <NavbarBrand>Route plan</NavbarBrand>
                <NavItem>
                    <ErrorBoundary>
                        <Link to={"/"} className={'nav-link'}>
                            <Icon icon={IconNames.HOME} iconSize={Icon.SIZE_STANDARD} intent={Intent.PRIMARY} />
                        </Link>
                    </ErrorBoundary>
                </NavItem>
                <NavItem>
                    <ErrorBoundary>
                        <Link to={"/controlPoints/"} className={'nav-link'}>
                            <Icon icon={IconNames.SHOP} iconSize={Icon.SIZE_STANDARD} intent={Intent.NONE} />
                        </Link>
                    </ErrorBoundary>
                </NavItem>
                <NavItem>
                    <Link to={"/map/"} className={'nav-link'}>
                        <Icon icon={IconNames.GLOBE} iconSize={Icon.SIZE_STANDARD} intent={props.needToViewMap ? Intent.DANGER : Intent.NONE} />
                    </Link>
                </NavItem>
                <NavItem>
                    <Link to={"/forecastTable/"} className={'nav-link'}>
                        <Icon icon={IconNames.TH} iconSize={Icon.SIZE_STANDARD} intent={props.needToViewTable ? Intent.DANGER : Intent.NONE} />
                    </Link>
                </NavItem>
                <NavItem>
                    <Link to={"/paceTable/"} className={'nav-link'}>
                        <Icon color="orange" icon={IconNames.TH} iconSize={Icon.SIZE_STANDARD} intent={props.needToViewTable ? Intent.DANGER : Intent.NONE} />
                    </Link>
                </NavItem>
            </Nav>
            <Routes>
                <Route path="/" element={<RouteInfoForm/>} />
                <Route path="/controlPoints/" element={<ForecastSettings/>} />
                <Route path="/map/" element={<MapLoader maps_api_key={props.mapsApiKey} />} />
                <Route path="/forecastTable/" element={<ForecastTable/>} />
                <Route path="/paceTable/" element={<PaceTable/>} />
            </Routes>
        </>
    )
}

MobileUITabs.propTypes = {
    mapsApiKey:PropTypes.string.isRequired,
    needToViewTable:PropTypes.bool.isRequired,
    needToViewMap:PropTypes.bool.isRequired
};