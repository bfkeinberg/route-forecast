import React from 'react';
import {FormGroup, Button, MenuItem} from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { DesktopTooltip } from '../shared/DesktopTooltip';
import {connect} from 'react-redux';
import {setWeatherProvider} from "../../redux/actions";
import {providerValues} from "../../redux/reducer";
import PropTypes from 'prop-types';

const renderProvider = (provider, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
        return null;
    }
    return (
        <MenuItem
            active={modifiers.active}
            key={provider.key}
            onClick={handleClick}
            text={provider.name}
        />
    );
};

const WeatherProviderSelector = ({weatherProvider,setWeatherProvider}) => {
    return (
        <FormGroup>
            <DesktopTooltip content={"The weather provider to use for forecasts"} placement={"bottom"}>
                <Select tabIndex="0"
                    id='provider'
                    items={Object.entries(providerValues).map(element => { return { key: element[0], ...element[1] } })}
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

