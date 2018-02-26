import React from 'react';
import PropTypes from 'prop-types';
import {Button, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {connect} from 'react-redux';
import {requestForecast, setFetchAfterLoad} from "../actions/actions";
import MediaQuery from 'react-responsive';

const ForecastButton = ({fetchingForecast,requestForecast,routeInfo,submitDisabled,routeIsLoaded}) => {
    let forecast_tooltip = submitDisabled ? (
            <Tooltip id="forecast_tooltip">Must either upload a gpx file or provide an rwgps route id</Tooltip> ):
        (<Tooltip id="'forecast_tooltip">Request a ride forecast</Tooltip>);
    let buttonStyle = submitDisabled ? {pointerEvents : 'none', display:'inline-flex'} : null;
    const forecastClick = () => {
        // this weirdness is to handle the case where the user clicked this button
        // while the route was loading asynchronously. Putting this state in keeps them from having to wait
        // until the route is done loading to click.
        if (!routeIsLoaded) {
            setFetchAfterLoad(true);
            return;
        }
        requestForecast(routeInfo);
    };

    return (
        <OverlayTrigger placement='bottom' overlay={forecast_tooltip}>
            <div style={{'display':'inline-flex',padding:'0px 14px'}} cursor='not-allowed'>
                <MediaQuery minDeviceWidth={1000}>
                    <Button tabIndex='6' bsStyle="primary" onClick={forecastClick}
                            style={buttonStyle}
                            disabled={submitDisabled || fetchingForecast} bsSize="large">
                        {fetchingForecast?'Updating...':'Find forecast'}</Button>
                </MediaQuery>
                <MediaQuery maxDeviceWidth={800}>
                    <Button tabIndex='6' bsStyle="primary" onClick={forecastClick}
                            style={buttonStyle}
                            disabled={submitDisabled || fetchingForecast} bsSize="xsmall">
                        {fetchingForecast?'Updating...':'Find forecast'}</Button>
                </MediaQuery>
            </div>
        </OverlayTrigger>
    );
};

ForecastButton.propTypes = {
    routeIsLoaded:PropTypes.bool.isRequired,
    requestForecast:PropTypes.func.isRequired,
    setFetchAfterLoad:PropTypes.func.isRequired,
    fetchingForecast:PropTypes.bool.isRequired,
    submitDisabled:PropTypes.bool.isRequired,
    routeInfo:PropTypes.object.isRequired
};

const mapStateToProps = (state) =>
    ({
        fetchingForecast: state.uiInfo.dialogParams.fetchingForecast,
        // can't request a forecast without a route loaded
        submitDisabled: state.uiInfo.routeParams.rwgpsRoute === '' && state.routeInfo.gpxRouteData === null,
        routeIsLoaded: state.routeInfo.forecastRequest !== null,
        routeInfo: state.routeInfo
    });

const mapDispatchToProps = {
    requestForecast,setFetchAfterLoad
};

export default connect(mapStateToProps,mapDispatchToProps)(ForecastButton);