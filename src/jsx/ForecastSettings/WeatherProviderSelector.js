import {Button, FormGroup, MenuItem} from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import PropTypes from 'prop-types';
import React, {useMemo} from 'react';
import {connect, useSelector} from 'react-redux';
import { DateTime, Interval } from 'luxon';
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
    const rwgpsRouteData = useSelector(state => state.routeInfo.rwgpsRouteData)
    const gpxRouteData = useSelector(state => state.routeInfo.gpxRouteData)
    const type = rwgpsRouteData ? "rwgps" : (gpxRouteData ? "gpx" : null)
    const timeZoneId = useSelector(state => state.uiInfo.routeParams.zone)
    const routeData = useSelector(state => state.routeInfo[type === "rwgps" ? "rwgpsRouteData" : "gpxRouteData"])
    const startTimestamp = useSelector(state => state.uiInfo.routeParams.startTimestamp)
    const pace = useSelector(state => state.uiInfo.routeParams.pace)
    const interval = useSelector(state => state.uiInfo.routeParams.interval)
    const controlPoints = useSelector(state => state.controls.userControlPoints)
    const segment = useSelector(state => state.uiInfo.routeParams.segment)
    const getForecastRequestData = () => {
        if (!type) {
            return {length:0, last:DateTime.now().toISO()}
        }
        const forecastRequest = getForecastRequest(
            routeData, 
            startTimestamp, 
            type, timeZoneId, pace, 
            interval, controlPoints,
            segment)
        return {length:forecastRequest.length, last:forecastRequest[forecastRequest.length-1].time}
    }
    const forecastData = useMemo(getForecastRequestData, [routeData,interval])
    const daysInFuture = Interval.fromDateTimes(DateTime.now(), DateTime.fromISO(forecastData.last)).length('days')

    return (
        <FormGroup label={<span><b>{t('labels.source')}</b></span>} labelFor={'provider'}>
            <DesktopTooltip content={t('tooltips.provider')} placement={"right"}>
                <Select tabIndex="0"
                    items={Object.entries(providerValues).
                        filter(entry => entry[1].maxCallsPerHour === undefined || 
                            entry[1].maxCallsPerHour > forecastData.length).
                        filter(entry => entry[1].max_days >= daysInFuture).
                        map(element => { return { key: element[0], ...element[1] } })}
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

