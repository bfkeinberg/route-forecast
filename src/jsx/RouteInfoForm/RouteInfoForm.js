import {Alert} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ShortUrl from '../TopBar/ShortUrl';
import MediaQuery from 'react-responsive';
import PropTypes from 'prop-types';
import {setRouteLoadingMode} from '../../redux/actions';
import {connect} from 'react-redux';
import { AlwaysFilledSwitch } from './AlwaysFilledSwitch';
import { RouteInfoInputRWGPS } from './RouteInfoInputRWGPS';
import { RouteInfoInputStrava } from './RouteInfoInputStrava';
import { routeLoadingModes } from '../../data/enums';

const RouteInfoForm = ({ controlPoints, errorDetails, routeInfo, needToViewTable, routeProps, routeLoadingMode, setRouteLoadingMode }) => {
    const mode = routeLoadingMode
    const modeSwitched = (event) => {
        setRouteLoadingMode(event.target.checked ? routeLoadingModes.STRAVA : routeLoadingModes.RWGPS)
    }

    // TODO
    // mobile magic
    // useEffect(() => {
    //     if (routeProps != null && routeProps.history != null && needToViewTable) {
    //         routeProps.history.replace('/table/')
    //     }
    // }, [routeProps, needToViewTable])

    return (
        <div style={{padding: "16px"}}>
            <RouteLoadingModeSelector mode={mode} setMode={setRouteLoadingMode} modeSwitched={modeSwitched}/>
            {mode === routeLoadingModes.RWGPS ?
                <RouteInfoInputRWGPS/> :
                <RouteInfoInputStrava/>}
            {errorDetails !== null && <Alert style={{ padding: '10px', marginTop: "10px" }} color="danger">{errorDetails}</Alert>}
            <MediaQuery maxDeviceWidth={500}>
                <div style={{marginTop: "10px", textAlign: "center"}}>
                    <ShortUrl/>
                </div>
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
                <div style={{fontSize: "10px", color: "grey", opacity: mode === routeLoadingModes.STRAVA ? 1 : 0, transition: "opacity 0.3s", marginTop: "3px"}}>Load an activity from Strava, and analyze your pace over the ride.</div>
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
    setRouteLoadingMode
};

RouteInfoForm.propTypes = {
    controlPoints: PropTypes.arrayOf(PropTypes.object).isRequired,
    errorDetails: PropTypes.string,
    routeInfo: PropTypes.shape({ name: PropTypes.string }),
    needToViewTable: PropTypes.bool.isRequired,
    routeProps: PropTypes.object,
    routeLoadingMode: PropTypes.number,
    setRouteLoadingMode: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps, null, {pure:true})(RouteInfoForm);