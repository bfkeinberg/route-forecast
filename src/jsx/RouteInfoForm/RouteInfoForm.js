import { Spinner } from '@blueprintjs/core';
import {Alert, Form, Card, CardBody, CardTitle, Col, Row} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import ShortUrl from '../TopBar/ShortUrl';
import MediaQuery from 'react-responsive';
import PropTypes from 'prop-types';
import {loadFromRideWithGps, saveCookie} from '../actions/actions';
import {connect} from 'react-redux';
import { formatControlsForUrl } from '../../util';
import { AlwaysFilledSwitch } from './AlwaysFilledSwitch';
import { RouteInfoInputRWGPS } from './RouteInfoInputRWGPS';
import { RouteInfoInputStrava } from './RouteInfoInputStrava';

const routeLoadingModes = {
    RWGPS: 1,
    STRAVA: 2
}

const RouteInfoForm = ({ rwgpsRoute, rwgpsRouteIsTrip, controlPoints, fetchingRoute, errorDetails, routeInfo, loadFromRideWithGps, firstUse, routeSelected, needToViewTable, showProvider, routeProps }) => {
    const [mode, setMode] = useState(routeLoadingModes.RWGPS)
    const modeSwitched = (event) => {
        setMode(event.target.checked ? routeLoadingModes.STRAVA : routeLoadingModes.RWGPS)
    }

    useEffect(() => {
        if (rwgpsRoute !== '') {
            // loadFromRideWithGps(rwgpsRoute, rwgpsRouteIsTrip);
        }
    }, [])

    useEffect(() => {
        if (rwgpsRoute !== '' && !routeSelected) {
            // loadFromRideWithGps(rwgpsRoute,rwgpsRouteIsTrip);
        }
    }, [rwgpsRoute, routeSelected, rwgpsRouteIsTrip])
    
    useEffect(() => {
        if (routeProps != null && routeProps.history != null && needToViewTable) {
            routeProps.history.replace('/table/')
        }
    }, [routeProps, needToViewTable])

    useEffect(() => {
        if (routeInfo.name !== '') {
            document.title = `Forecast for ${routeInfo.name}`;
            if (!firstUse && controlPoints !== '' && controlPoints.length !== 0) {
                saveCookie(routeInfo.name, formatControlsForUrl(controlPoints));
            }
        }
    }, [routeInfo.name, firstUse, controlPoints])

    const header = (<div style={{textAlign:"center",'fontSize':'90%'}}>Load Route</div>);

    return (
        <div>
            <Card style={{borderTop: "none"}}>
                <CardBody>
                    <CardTitle className='dlgTitle' tag='h6'>{header}</CardTitle>
                    <Form inline id="forecast_form">
                        <RouteLoadingModeSelector mode={mode} setMode={setMode} modeSwitched={modeSwitched}/>
                        {mode === routeLoadingModes.RWGPS ?
                            <RouteInfoInputRWGPS showProvider={showProvider}/> :
                            <RouteInfoInputStrava/>}
                        {errorDetails !== null && <Alert style={{ padding: '10px' }} color="danger">{errorDetails}</Alert>}
                        {fetchingRoute && <Spinner/>}
                    </Form>
                    <MediaQuery maxDeviceWidth={500}>
                        <div style={{marginTop: "10px", textAlign: "center"}}>
                            <ShortUrl/>
                        </div>
                    </MediaQuery>
                </CardBody>
            </Card>
        </div>
    );
}

const RouteLoadingModeSelector = ({mode, setMode, modeSwitched}) => {
    return (
        <>
            <div>Load From</div>
            <div style={{display: "flex", justifyContent: "center"}}>
                <div style={{flex: 1, cursor: "pointer", display: "flex", justifyContent: "flex-end"}} onClick={() => setMode(routeLoadingModes.RWGPS)}>
                    <div style={{width: "fit-content", borderBottom: mode === routeLoadingModes.RWGPS ? "1px solid #106ba3" : "1px solid #0000"}}>Ride with GPS</div>
                </div>
                <AlwaysFilledSwitch checked={mode === routeLoadingModes.STRAVA} onChange={modeSwitched} />
                <div style={{flex: 1, cursor: "pointer"}} onClick={() => setMode(routeLoadingModes.STRAVA)}>
                    <div style={{width: "fit-content", borderBottom: mode === routeLoadingModes.STRAVA ? "1px solid rgb(234, 89, 41)" : "1px solid #0000"}}>Strava</div>
                </div>
            </div>
        </>
    )
}

const mapStateToProps = (state) =>
    ({
        rwgpsRoute: state.uiInfo.routeParams.rwgpsRoute,
        rwgpsRouteIsTrip: state.uiInfo.routeParams.rwgpsRouteIsTrip,
        fetchingRoute: state.uiInfo.dialogParams.fetchingRoute,
        errorDetails:state.uiInfo.dialogParams.errorDetails,
        routeInfo:state.routeInfo,
        controlPoints:state.controls.userControlPoints,
        firstUse: state.params.newUserMode,
        routeSelected: state.uiInfo.dialogParams.loadingSource !== null,
        needToViewTable:state.forecast.valid && !state.forecast.tableViewed,
        showProvider:state.controls.showWeatherProvider,
    });

const mapDispatchToProps = {
    loadFromRideWithGps
};

RouteInfoForm.propTypes = {
    rwgpsRoute:PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.oneOf([''])
    ]),
    rwgpsRouteIsTrip: PropTypes.bool.isRequired,
    controlPoints:PropTypes.arrayOf(PropTypes.object).isRequired,
    fetchingRoute:PropTypes.bool,
    errorDetails:PropTypes.string,
    routeInfo:PropTypes.shape({name:PropTypes.string}),
    loadFromRideWithGps:PropTypes.func.isRequired,
    firstUse:PropTypes.bool.isRequired,
    routeSelected:PropTypes.bool.isRequired,
    needToViewTable: PropTypes.bool.isRequired,
    showProvider: PropTypes.bool.isRequired,
    routeProps:PropTypes.object
};

export default connect(mapStateToProps, mapDispatchToProps, null, {pure:true})(RouteInfoForm);
