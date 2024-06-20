import {Button, FormGroup, MenuItem} from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import PropTypes from 'prop-types';
import React, {useMemo} from 'react';
import {connect, useSelector} from 'react-redux';

import {setWeatherProvider} from "../../redux/actions";
import {providerValues} from "../../redux/reducer";
import { DesktopTooltip } from '../shared/DesktopTooltip';
import {useTranslation} from 'react-i18next'
import { getForecastRequest } from "../../utils/util";

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
    // TODO: move into separate component, design pattern as yet unclear
    const type = useSelector(state => state.routeInfo.rwgpsRouteData) ? "rwgps" : "gpx"
    const timeZoneId = useSelector(state => state.uiInfo.routeParams.zone)
    const routeData = useSelector(state => state.routeInfo[type === "rwgps" ? "rwgpsRouteData" : "gpxRouteData"])
    const startTimestamp = useSelector(state => state.uiInfo.routeParams.startTimestamp)
    const pace = useSelector(state => state.uiInfo.routeParams.pace)
    const interval = useSelector(state => state.uiInfo.routeParams.interval)
    const controlPoints = useSelector(state => state.controls.userControlPoints)
    const segment = useSelector(state => state.uiInfo.routeParams.segment)
    const getForecastRequestLength = () => {
        const forecastRequest = getForecastRequest(
            routeData, 
            startTimestamp, 
            type, timeZoneId, pace, 
            interval, controlPoints,
            segment)
        return forecastRequest.length
    }
    const forecastLength = useMemo(getForecastRequestLength, [routeData,interval])

    return (
        <FormGroup label={<span><b>{t('labels.source')}</b></span>} labelFor={'provider'}>
            <DesktopTooltip content={t('tooltips.provider')} placement={"right"}>
                <Select tabIndex="0"
                    items={Object.entries(providerValues).filter(entry => entry[1].maxCallsPerHour===undefined||entry[1].maxCallsPerHour>forecastLength).map(element => { return { key: element[0], ...element[1] } })}
                    itemsEqual={"name"}
                    itemRenderer={renderProvider}
                    filterable={false}
                    fill={true}
                    activeItem={{ key: weatherProvider, ...providerValues[weatherProvider] }}
                    onItemSelect={(selected) => { setWeatherProvider(selected.key) }}
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

