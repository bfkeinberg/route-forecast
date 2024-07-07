import {Button, FormGroup, MenuItem} from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {setWeatherProvider} from "../../redux/actions";
import {providerValues} from "../../redux/reducer";
import { DesktopTooltip } from '../shared/DesktopTooltip';
import {useTranslation} from 'react-i18next'
import {useForecastRequestData} from "../../utils/hooks"
import * as Sentry from "*sentry/react"

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

const WeatherProviderSelector = ({weatherProvider,setWeatherProvider}) => {
    const { t } = useTranslation()
    const forecastData = useForecastRequestData()

    return (
        <FormGroup label={<span><b>{t('labels.source')}</b></span>} labelFor={'provider'}>
            <DesktopTooltip content={t('tooltips.provider')} placement={"right"}>
                <Select tabIndex="0"
                    items={Object.entries(providerValues).
                        filter(entry => entry[1].maxCallsPerHour === undefined || 
                            entry[1].maxCallsPerHour > forecastData.length).
                        filter(entry => entry[1].max_days >= forecastData.daysInFuture).
                        map(element => { return { key: element[0], ...element[1] } })}
                    itemsEqual={"name"}
                    itemRenderer={renderProvider}
                    filterable={false}
                    fill={true}
                    activeItem={{ key: weatherProvider, ...providerValues[weatherProvider] }}
                    onItemSelect={(selected) => { Sentry.metrics.set("provider", selected.key); setWeatherProvider(selected.key) }}
                >
                    <Button id={'provider'} text={providerValues[weatherProvider].name} rightIcon="symbol-triangle-down" />
                </Select>
            </DesktopTooltip>
        </FormGroup>
    );
};

WeatherProviderSelector.propTypes = {
    weatherProvider:PropTypes.string.isRequired,
    setWeatherProvider:PropTypes.func.isRequired,
};

const mapStateToProps = (state) =>
    ({
        weatherProvider: state.forecast.weatherProvider
    });

const mapDispatchToProps = {
    setWeatherProvider
};

export default connect(mapStateToProps,mapDispatchToProps)(WeatherProviderSelector);

