import React from 'react';
import PropTypes from 'prop-types';
import {Input, FormGroup, UncontrolledTooltip} from 'reactstrap';
import {connect} from 'react-redux';
import {setWeatherProvider} from "../../redux/actions";

const WeatherProviderSelector = ({weatherProvider,setWeatherProvider}) => {
    return (
            <FormGroup size='sm'>
                <UncontrolledTooltip target='provider' placement='bottom'>The weather provider to use for forecasts</UncontrolledTooltip>
                <Input type="select" bsSize="sm" id='provider' tabIndex='2'
                    name="provider"
                    value={weatherProvider} onChange={event => {setWeatherProvider(event.target.value)}}>
                    <option value="darksky">Dark Sky</option>
                    <option value="climacell">Tomorrow.io</option>
                    <option value="weatherapi">WeatherAPI</option>
                    <option value="visualcrossing">Visual Crossing</option>
                    <option value="nws">National Weather Service</option>
                </Input>
            </FormGroup>
    );
};

WeatherProviderSelector.propTypes = {
    weatherProvider:PropTypes.string.isRequired,
    setWeatherProvider:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        weatherProvider: state.forecast.weatherProvider
    });

const mapDispatchToProps = {
    setWeatherProvider
};

export default connect(mapStateToProps,mapDispatchToProps)(WeatherProviderSelector);

