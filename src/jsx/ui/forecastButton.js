import React from 'react';
import PropTypes from 'prop-types';
import {Button, UncontrolledTooltip} from 'reactstrap';
import {connect} from 'react-redux';
import {requestForecast, setFetchAfterLoad} from "../actions/actions";
import MediaQuery from 'react-responsive';

const ForecastButton = ({fetchingForecast,requestForecast,routeInfo,submitDisabled,routeIsLoaded,setFetchAfterLoad}) => {
    let forecast_tooltip = submitDisabled ? (
            <UncontrolledTooltip target='forecast' placement='bottom' id="forecast_tooltip">Must either upload a gpx file or provide an rwgps route id</UncontrolledTooltip> ):
        (<UncontrolledTooltip target='forecast' placement='bottom' id="'forecast_tooltip">Request a ride forecast</UncontrolledTooltip>);
    let buttonStyle = submitDisabled ? {pointerEvents : 'none', display:'inline-flex'} : null;
    const forecastClick = () => {
        // if the user clicked this button
        // while the route was loading asynchronously. Putting this state in keeps them from having to wait
        // until the route is done loading to click.
        if (!routeIsLoaded) {
            setFetchAfterLoad(true);
            return;
        }
        requestForecast(routeInfo);
    };

    return (
        <div id='forecast' style={{'display':'inline-flex',padding:'0px 14px'}} cursor='not-allowed'>
            {forecast_tooltip}
            <MediaQuery minDeviceWidth={1000}>
                <Button tabIndex='6' color="primary" onClick={forecastClick}
                        style={buttonStyle}
                        disabled={submitDisabled || fetchingForecast}>
                    {fetchingForecast?'Updating...':'Find forecast'}</Button>
            </MediaQuery>
            <MediaQuery maxDeviceWidth={800}>
                <Button id='forecast' tabIndex='6' color="primary" onClick={forecastClick}
                        style={buttonStyle}
                        disabled={submitDisabled || fetchingForecast} size="sm">
                    {fetchingForecast?'Updating...':'Find forecast'}</Button>
            </MediaQuery>
        </div>
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