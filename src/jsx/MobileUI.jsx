import { Alignment,Button, IconSize, Intent, Navbar, NavbarDivider, NavbarGroup, NavbarHeading, Divider } from "@blueprintjs/core";
import {Cloud, Cycle,Globe, Route as RouteIcon, Shop } from "@blueprintjs/icons";
import PropTypes from "prop-types";
import React from "react";
import {connect, useDispatch,useSelector} from 'react-redux';
import { Link, MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { errorDetailsSet } from "../redux/reducer";
import { useForecastDependentValues,useWhenChanged } from "../utils/hooks";
import { ForecastSettings } from "./ForecastSettings/ForecastSettings";
import MapLoader from "./Map/MapLoader";
import ForecastTable from "./resultsTables/ForecastTable";
import PaceTable from "./resultsTables/PaceTable";
import RouteInfoForm from "./RouteInfoForm/RouteInfoForm";
import ErrorBoundary from "./shared/ErrorBoundary";
import DonationRequest from "./TopBar/DonationRequest";

const MobileUI = (props) => {
    return (
        <MemoryRouter>
            <MobileUITabs {...props} />
        </MemoryRouter>
    )
};

MobileUI.propTypes = {
    mapsApiKey: PropTypes.string.isRequired,
    needToViewTable: PropTypes.bool.isRequired,
    needToViewMap: PropTypes.bool.isRequired
};

const mapStateToProps = (state) =>
    ({
        needToViewTable:state.forecast.valid && !state.forecast.tableViewed,
        needToViewMap:state.forecast.valid && !state.forecast.mapViewed
    });

export default connect(mapStateToProps)(MobileUI);

const MobileUITabs = (props) => {
    const dispatch = useDispatch()
    const location = useLocation()
    const { pathname } = location
    try {
        const navigate = useNavigate()
        const type = useSelector(state => state.routeInfo.type)
        const routeData = useSelector(state => state.routeInfo[type === "rwgps" ? "rwgpsRouteData" : "gpxRouteData"])
        const stravaActivityData = useSelector(state => state.strava.activityData)
        const forecastData = useSelector(state => state.forecast.forecast)
        useWhenChanged(routeData, () => navigate("/controlPoints", { replace: true }))
        useWhenChanged(forecastData, () => navigate("/forecastTable", { replace: true }), forecastData.length > 0)
        useWhenChanged(stravaActivityData, () => navigate("/paceTable", { replace: true }))
        const { adjustedTimes } = useForecastDependentValues()

        return (
            <>
                <Navbar>
                    <NavbarGroup align={Alignment.CENTER}>
                        <NavbarHeading>Randoplan</NavbarHeading>
                        <ErrorBoundary>
                            <Link to={"/"} className={'nav-link'}>
                                <Button small icon={<RouteIcon />} title={"home"} intent={pathname==='/'?Intent.PRIMARY:Intent.NONE}></Button>
                            </Link>
                        </ErrorBoundary>
                        <NavbarDivider />
                        <ErrorBoundary>
                            <Link to={"/controlPoints/"} className={'nav-link'}>
                                <Button small icon={<Shop/>} size={IconSize.STANDARD} title={"controls"} intent={pathname.startsWith('/controlPoints')?Intent.PRIMARY:Intent.NONE} />
                            </Link>
                        </ErrorBoundary>
                        <NavbarDivider />
                        <Link to={"/map/"} className={'nav-link'}>
                        <Button small icon={<Globe/>} size={IconSize.STANDARD} title={"map"} intent={props.needToViewMap ? Intent.WARNING : (pathname.startsWith('/map')?Intent.PRIMARY:Intent.NONE)} />
                        </Link>
                        <NavbarDivider />
                        <Link to={"/forecastTable/"} className={'nav-link'}>
                            <Button small icon={<Cloud/>} size={IconSize.STANDARD} title={"forecast"} intent={props.needToViewTable ? Intent.WARNING : (pathname.startsWith('/forecastTable')?Intent.PRIMARY:Intent.NONE)} />
                        </Link>
                        <NavbarDivider />
                        {
                            stravaActivityData &&
                            <Link to={"/paceTable/"} className={'nav-link'}>
                                <Button small icon={<Cycle />} color="orange" disabled={!stravaActivityData} title={"strava"} size={IconSize.STANDARD} intent={props.needToViewTable ? Intent.WARNING : pathname.startsWith('/paceTable') ? Intent.PRIMARY : Intent.NONE} />
                            </Link>
                        }
                    </NavbarGroup>
                </Navbar>
                <Divider/>
                <Routes>
                    <Route path="/" element={<RouteInfoForm />} />
                    <Route path="/controlPoints/" element={<ForecastSettings />} />
                    <Route path="/map/" element={<MapLoader maps_api_key={props.mapsApiKey} />} />
                    <Route path="/forecastTable/" element={<ForecastTable adjustedTimes={adjustedTimes} />} />
                    <Route path="/paceTable/" element={<PaceTable />} />
                </Routes>
                <DonationRequest wacky={false}/>
            </>
        )
    } catch (err) {
        dispatch(errorDetailsSet(err))
    }
}

MobileUITabs.propTypes = {
    mapsApiKey:PropTypes.string.isRequired,
    needToViewTable:PropTypes.bool.isRequired,
    needToViewMap:PropTypes.bool.isRequired
};