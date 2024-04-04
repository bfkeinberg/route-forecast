import {Button, FormGroup, MenuItem} from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import {setWeatherProvider} from "../../redux/actions";
import {providerValues} from "../../redux/reducer";
import { getForecastRequestLength } from '../../utils/forecastUtilities';
import { DesktopTooltip } from '../shared/DesktopTooltip';

const renderProvider = (provider, { handleClick, handleFocus, modifiers }) => {
    if (!modifiers.matchesPredicate) {
        return null;
    }
    return (
        <MenuItem
            active={modifiers.active}
            key={provider.key}
            disabled={!provider.enabled}
            onClick={handleClick}
            onFocus={handleFocus}
            text={provider.name}
        />
    );
};

const WeatherProviderSelector = ({weatherProvider,setWeatherProvider,forecastLength}) => {
    return (
        <FormGroup>
            <DesktopTooltip content={"The weather provider to use for forecasts"} placement={"bottom"}>
                <Select tabIndex="0"
                    id='provider'
                    items={Object.entries(providerValues).filter(entry => entry[1].maxCallsPerHour===undefined||entry[1].maxCallsPerHour>forecastLength).map(element => { return { key: element[0], ...element[1] } })}
                    itemsEqual={"name"}
                    itemRenderer={renderProvider}
                    filterable={false}
                    fill={true}
                    activeItem={{ key: weatherProvider, ...providerValues[weatherProvider] }}
                    onItemSelect={(selected) => { setWeatherProvider(selected.key) }}
                >
                    <Button text={providerValues[weatherProvider].name} rightIcon="symbol-triangle-down" />
                </Select>
            </DesktopTooltip>
        </FormGroup>
    );
};

WeatherProviderSelector.propTypes = {
    weatherProvider:PropTypes.string.isRequired,
    setWeatherProvider:PropTypes.func.isRequired,
    forecastLength:PropTypes.number.isRequired
};

const mapStateToProps = (state) =>
    ({
        weatherProvider: state.forecast.weatherProvider,
        forecastLength: getForecastRequestLength(state)
    });

const mapDispatchToProps = {
    setWeatherProvider
};

export default connect(mapStateToProps,mapDispatchToProps)(WeatherProviderSelector);

