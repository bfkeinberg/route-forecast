import { Alignment,Button, Intent, Navbar, NavbarDivider, NavbarGroup, NavbarHeading, Divider } from "@blueprintjs/core";
import {Cloud, Cycle,Globe, Map as MapIcon, Shop } from "@blueprintjs/icons";
import * as React from "react";
import { Link, MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import { errorDetailsSet, lastErrorCleared } from "../redux/dialogParamsSlice";
import { useForecastDependentValues,useWhenChanged } from "../utils/hooks";
import { ForecastSettings } from "./ForecastSettings/ForecastSettings";
import MapLoader from "./Map/MapLoader";
import ForecastTable from "./resultsTables/ForecastTable";
import PaceTable from "./resultsTables/PaceTable";
import RouteInfoForm from "./RouteInfoForm/RouteInfoForm";
import DonationRequest from "./TopBar/DonationRequest";
import DisplayErrorList from "./app/DisplayErrorList";
import { useAppDispatch, useAppSelector } from "../utils/hooks";
import { Dispatch, SetStateAction } from "react";
import * as Sentry from "@sentry/react"
export interface MobileUIPropTypes {
    mapsApiKey:string, 
    orientationChanged:boolean
    setOrientationChanged: Dispatch<SetStateAction<boolean>>
}

const MobileUI = (props : MobileUIPropTypes) => {
    return (
        <MemoryRouter>
            <MobileUITabs {...props} />
        </MemoryRouter>
    )
};

export default MobileUI;

const MobileUITabs = (props : MobileUIPropTypes) => {
    const dispatch = useAppDispatch()
    const location = useLocation()
    const { pathname } = location
    try {
        const navigate = useNavigate()
        const type = useAppSelector(state => state.routeInfo.type)
        const routeData = useAppSelector(state => state.routeInfo[type === "rwgps" ? "rwgpsRouteData" : "gpxRouteData"])
        const stravaActivityData = useAppSelector(state => state.strava.activityData)
        const forecastData = useAppSelector(state => state.forecast.forecast)
        // if we've been reset while displaying another tab
        if (pathname !== '/' && routeData === null) {
            navigate('/')
        }
        useWhenChanged(routeData, () => navigate("/controlPoints", { replace: true }), routeData !== null)
        useWhenChanged(forecastData, () => navigate("/forecastTable", { replace: true }), forecastData.length > 0)
        useWhenChanged(stravaActivityData, () => navigate("/paceTable", { replace: true }))

        React.useEffect(() => {
            // if we've been reset while displaying another tab
            if (pathname !== '/' && routeData === null) {
                navigate('/')
            }
        }), [pathname, routeData]

        React.useEffect(() => {
            if (props.orientationChanged) {
                if (forecastData.length > 0) {
                    navigate("/forecastTable", { replace: true })
                }
                else if (routeData) {
                    navigate("/controlPoints", { replace: true })
                }
            }
        }, [props.orientationChanged, forecastData, routeData])
        
        React.useEffect(() => {
            if (props.orientationChanged) {
                props.setOrientationChanged(() => false)
            }
        }, [props.orientationChanged])
    
        const { adjustedTimes } = useForecastDependentValues()
        const errorMessageList = useAppSelector(state => state.uiInfo.dialogParams.errorMessageList)

        const closeErrorList = () => {
            dispatch(lastErrorCleared())
        }

        const needToViewTable = useAppSelector(state => state.forecast.valid && !state.forecast.tableViewed)
        const needToViewMap = useAppSelector(state => state.forecast.valid && !state.forecast.mapViewed)

        return (
            <>
                <DisplayErrorList errorList={errorMessageList} onClose={closeErrorList}/>
                <Navbar>
                    <NavbarGroup align={Alignment.CENTER}>
                        <NavbarHeading>Randoplan</NavbarHeading>
                        <Sentry.ErrorBoundary fallback={<h2>Something went wrong.</h2>}>
                            <Link to={"/"} className={'nav-link'}>
                                <Button small icon={<MapIcon />} title={"home"} intent={pathname==='/'?Intent.PRIMARY:Intent.NONE}></Button>
                            </Link>
                        </Sentry.ErrorBoundary>
                        <NavbarDivider />
                        <Sentry.ErrorBoundary fallback={<h2>Something went wrong.</h2>}>
                            <Link to={"/controlPoints/"} className={'nav-link'}>
                                <Button small disabled={!routeData} icon={<Shop/>} title={"controls"} intent={pathname.startsWith('/controlPoints')?Intent.PRIMARY:Intent.NONE} />
                            </Link>
                        </Sentry.ErrorBoundary>
                        <NavbarDivider />
                        <Link to={"/forecastTable/"} className={'nav-link'}>
                            <Button small icon={<Cloud/>} title={"forecast"} intent={needToViewTable ? Intent.WARNING : (pathname.startsWith('/forecastTable')?Intent.PRIMARY:Intent.NONE)} />
                        </Link>
                        <NavbarDivider />
                        <Link to={"/map/"} className={'nav-link'}>
                        <Button small icon={<Globe/>} title={"map"} intent={needToViewMap ? Intent.WARNING : (pathname.startsWith('/map')?Intent.PRIMARY:Intent.NONE)} />
                        </Link>
                        <NavbarDivider />
                        {
                            stravaActivityData &&
                            <Link to={"/paceTable/"} className={'nav-link'}>
                                <Button small icon={<Cycle />} color="orange" disabled={!stravaActivityData} title={"strava"} intent={needToViewTable ? Intent.WARNING : pathname.startsWith('/paceTable') ? Intent.PRIMARY : Intent.NONE} />
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
    } catch (err : any) {
        dispatch(errorDetailsSet(err.message))
    }
}
