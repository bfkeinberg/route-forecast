import React from 'react';
import PropTypes from 'prop-types';
import {Tooltip2} from '@blueprintjs/popover2';
import {connect} from 'react-redux';
import {requestForecast} from "../../redux/actions";
import { useMediaQuery } from 'react-responsive';
import { Spinner, Button } from '@blueprintjs/core';
import { updateHistory } from "../app/updateHistory";

const ForecastButton = ({fetchingForecast,requestForecast,routeInfo,submitDisabled,queryString}) => {
    let tooltipContent = submitDisabled ?
        "Must either upload a gpx file or provide an rwgps route id" :
        "Request a ride forecast";
    let buttonStyle = submitDisabled ? { pointerEvents: 'none', display: 'inline-flex' } : null;
    const forecastClick = () => {
        requestForecast(routeInfo);
        updateHistory(queryString);
    };

    const smallScreen = useMediaQuery({query: "(max-width: 800px)"})

    return (
        <Tooltip2 content={tooltipContent}>
            <div id='forecast' style={{ 'display': 'flex', width: '100%', justifyContent: "center", margin: "10px 0px 0px 10px", flex: 1.6 }} cursor='not-allowed'>
                <Button
                    tabIndex='0'
                    intent="primary"
                    onClick={forecastClick}
                    style={{ ...buttonStyle, width: "100%", backgroundColor: "#137cbd", borderColor: "#137cbd", }}
                    disabled={submitDisabled || fetchingForecast}
                    small={smallScreen}
                    large={!smallScreen}
                    fill={true}
                >
                    {fetchingForecast ? 'Creating forecast...' : 'Find Forecast'}
                    {fetchingForecast && <Spinner />}
                </Button>
            </div>
        </Tooltip2>
    );
};

ForecastButton.propTypes = {
    requestForecast:PropTypes.func.isRequired,
    fetchingForecast:PropTypes.bool.isRequired,
    submitDisabled:PropTypes.bool.isRequired,
    routeInfo:PropTypes.object.isRequired,
    queryString:PropTypes.string.isRequired
};

const mapStateToProps = (state) =>
    ({
        fetchingForecast: state.uiInfo.dialogParams.fetchingForecast,
        // can't request a forecast without a route loaded
        submitDisabled: state.uiInfo.routeParams.rwgpsRoute === '' && state.routeInfo.gpxRouteData === null,
        routeInfo: state.routeInfo,
        queryString: state.controls.queryString
    });

const mapDispatchToProps = {
    requestForecast
};

export default connect(mapStateToProps,mapDispatchToProps)(ForecastButton);