import { Cloud, Globe, BuildingStore, Bike, Map as MapIcon } from "tabler-icons-react";
import * as React from "react";
import { Link, NavLink, MemoryRouter, Route, Routes, To, useLocation, useNavigate } from "react-router-dom";
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
import {Button, Group, Divider} from "@mantine/core";
import FaqButton, { ShowFaq } from "./TopBar/FaqButton";
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
        const viewingControls = useAppSelector(state => state.uiInfo.dialogParams.viewControls)

        // if we've been reset while displaying another tab
        if (pathname !== '/' && routeData === null) {
            navigate('/')
        }
        useWhenChanged(routeData, () => navigate("/controlPoints", { replace: true }), routeData !== null)
        useWhenChanged(forecastData, () => navigate("/forecastTable", { replace: true }), forecastData.length > 0 && !viewingControls)
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
        const hasForecast = useAppSelector(state => state.forecast.valid)
        
        return (
            <>
                <DisplayErrorList errorList={errorMessageList} onClose={closeErrorList}/>
                <Sentry.ErrorBoundary fallback={<h2>Something went wrong.</h2>}>
                <Group title="Randoplan" wrap={'nowrap'}>
                    <span style={{fontSize:'18px'}}>Randoplan</span>
                    <NavLink to={"/"}>
                        <Button size='compact-xs' leftSection={<MapIcon />} title={"home"} variant={pathname==='/'?'filled':'default'}></Button>
                    </NavLink>
                    <NavLink to={"/controlPoints/"}>
                        <Button size='compact-xs' leftSection={<BuildingStore />} right={3} disabled={!routeData} title={"controls"} variant={pathname==='/'?'filled':'default'}></Button>
                    </NavLink>
                    <NavLink to={"/forecastTable/"}>
                        <Button size='compact-xs' leftSection={<Cloud />} disabled={!hasForecast} title={"forecast"} variant={needToViewTable ? 'warning' : (pathname==='/'?'filled':'default')}></Button>
                    </NavLink>
                    <NavLink to={"/map/"}>
                        <Button size='compact-xs' leftSection={<Globe />} disabled={!hasForecast} title={"forecast"} variant={needToViewMap ? 'warning' : (pathname==='/'?'filled':'default')}></Button>
                    </NavLink>
                    {
                        stravaActivityData &&
                        <NavLink to={"/paceTable/"} className={'nav-link'}>
                            <Button size='compact-xs' leftSection={<Bike />} color="orange" disabled={!stravaActivityData} title={"strava"} variant={needToViewTable ? 'warning' : (pathname==='/'?'filled':'default')} />
                        </NavLink>
                    }
                    <FaqButton/>
                </Group>
                </Sentry.ErrorBoundary>
                <Divider/>
                <Routes>
                    <Route path="/" element={<RouteInfoForm />} />
                    <Route path="/controlPoints/" element={<ForecastSettings />} />
                    <Route path="/map/" element={<MapLoader maps_api_key={props.mapsApiKey} />} />
                    <Route path="/forecastTable/" element={<ForecastTable adjustedTimes={adjustedTimes} />} />
                    <Route path="/paceTable/" element={<PaceTable />} />
                    <Route path="/faq" element={<ShowFaq/>} />
                </Routes>
                <DonationRequest wacky={false}/>
            </>
        )
    } catch (err : any) {
        dispatch(errorDetailsSet(err.message))
    }
}
