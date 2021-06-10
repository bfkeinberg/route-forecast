import React from 'react';
import PropTypes from 'prop-types';
import {Label, FormGroup, UncontrolledTooltip} from 'reactstrap';
import {connect} from 'react-redux';
import {setWeatherProvider} from "../actions/actions";

const WeatherProvider = ({weatherProvider,setWeatherProvider}) => {
    return (
        <FormGroup inline row size='md'>
            <UncontrolledTooltip target='provider' placement='bottom'>The weather provider to use for forecasts</UncontrolledTooltip>
            <Label for='provider' size='sm' tag='b'>Weather service</Label>
            <select size="5" id='provider' tabIndex='2'
                   name="provider"
                 value={weatherProvider} onChange={event => {setWeatherProvider(event.target.value)}}>
                <option value="darksky">Dark Sky</option>
                <option value="climacell">Climacell</option>
                <option value="weatherapi">WeatherAPI</option>
                <option value="visualcrossing">Visual Crossing</option>
               </select>
        </FormGroup>
    );
};

WeatherProvider.propTypes = {
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

export default connect(mapStateToProps,mapDispatchToProps)(WeatherProvider);

