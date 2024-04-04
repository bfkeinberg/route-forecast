import {Toast} from '@blueprintjs/core';
import PropTypes from 'prop-types';
import React from 'react';
import ReactGA from "react-ga4";
import {connect, useDispatch} from 'react-redux';
import MediaQuery from 'react-responsive';

import { routeLoadingModes } from '../../data/enums';
import { errorDetailsSet, routeLoadingModeSet } from '../../redux/reducer';
import ShortUrl from '../TopBar/ShortUrl';
import { AlwaysFilledSwitch } from './AlwaysFilledSwitch';
import { RouteInfoInputRWGPS } from './RouteInfoInputRWGPS';
import { RouteInfoInputStrava } from './RouteInfoInputStrava';
// import mobile_usage_demo from "Images/mobile_usage_demo.gif";

const RouteInfoForm = ({ errorDetails, errorDetailsSet, routeLoadingMode, routeLoadingModeSet/* , routeInfo */ }) => {
    const mode = routeLoadingMode
    const dispatch = useDispatch()

    const modeSwitched = (event) => {
        routeLoadingModeSet(event.target.checked ? routeLoadingModes.STRAVA : routeLoadingModes.RWGPS);
        if (event.target.checked) {ReactGA.event('select_content', {content_type:'strava'})}
    }

    return (
        <div style={{padding: "16px"}}>
            <RouteLoadingModeSelector mode={mode} setMode={routeLoadingModeSet} modeSwitched={modeSwitched}/>
            {mode === routeLoadingModes.RWGPS ?
                <RouteInfoInputRWGPS/> :
                <RouteInfoInputStrava/>}
            {errorDetails !== null && <Toast style={{ padding: '10px', marginTop: "10px" }} message={errorDetails} timeout={0} onDismiss={() => dispatch(errorDetailsSet(null))} intent="danger"></Toast>}
            <MediaQuery maxDeviceWidth={500}>
                <div style={{marginTop: "10px", textAlign: "center"}}>
                    <ShortUrl/>
                </div>
                {/* {routeInfo.name === '' && <img src={mobile_usage_demo} style={{ position: "relative", width:"100%", height:"100%" }}/>} */}
            </MediaQuery>
        </div>
    );
}

const RouteLoadingModeSelector = ({mode, setMode, modeSwitched}) => {
    return (
        <div style={{display: "flex", justifyContent: "center"}}>
            <div style={{flex: 1, cursor: "pointer", display: "flex", flexFlow: "column", alignItems: "flex-end"}} onClick={() => setMode(routeLoadingModes.RWGPS)}>
                <div style={{width: "fit-content", borderBottom: mode === routeLoadingModes.RWGPS ? "1px solid #106ba3" : "1px solid #0000"}}>Ride with GPS</div>
                <div style={{fontSize: "10px", color: "grey", opacity: mode === routeLoadingModes.RWGPS ? 1 : 0, transition: "opacity 0.3s", marginTop: "3px", textAlign: "end"}}>Load a route from Ride with GPS, and create a weather and arrival time forecast for the ride.</div>
            </div>
            <AlwaysFilledSwitch tabIndex={1} checked={mode === routeLoadingModes.STRAVA} onChange={modeSwitched} />
            <div style={{flex: 1, cursor: "pointer", display: "flex", flexFlow: "column"}} onClick={() => setMode(routeLoadingModes.STRAVA)}>
                <div style={{width: "fit-content", borderBottom: mode === routeLoadingModes.STRAVA ? "1px solid rgb(234, 89, 41)" : "1px solid #0000"}}>Strava</div>
                <div style={{fontSize: "10px", color: "grey", opacity: mode === routeLoadingModes.STRAVA ? 1 : 0, transition: "opacity 0.3s", marginTop: "3px"}}>Load an activity or a route from Strava, and analyze your pace over the ride or get a forecast for the route.</div>
            </div>
        </div>
    )
}

RouteLoadingModeSelector.propTypes = {
    mode:PropTypes.number.isRequired,
    setMode:PropTypes.func.isRequired,
    modeSwitched:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        errorDetails: state.uiInfo.dialogParams.errorDetails,
        routeInfo: state.routeInfo,
        controlPoints: state.controls.userControlPoints,
        needToViewTable: state.forecast.valid && !state.forecast.tableViewed,
        routeLoadingMode: state.uiInfo.routeParams.routeLoadingMode
    });

const mapDispatchToProps = {
    routeLoadingModeSet, errorDetailsSet
};

RouteInfoForm.propTypes = {
    controlPoints: PropTypes.arrayOf(PropTypes.object).isRequired,
    errorDetails: PropTypes.string,
    routeInfo: PropTypes.shape({ name: PropTypes.string }),
    needToViewTable: PropTypes.bool.isRequired,
    routeProps: PropTypes.object,
    routeLoadingMode: PropTypes.number,
    routeLoadingModeSet: PropTypes.func.isRequired,
    errorDetailsSet:PropTypes.func.isRequired
};

export default connect(mapStateToProps, mapDispatchToProps, null)(RouteInfoForm);
