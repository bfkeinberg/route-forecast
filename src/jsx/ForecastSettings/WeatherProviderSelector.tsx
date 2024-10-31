import {Button, FormGroup, MenuItem} from "@blueprintjs/core";
import { Select, ItemRenderer } from "@blueprintjs/select";
import {connect, ConnectedProps} from 'react-redux';
import {setWeatherProvider} from "../../redux/actions";
import { providerValues } from "../../redux/providerValues";
import { DesktopTooltip } from '../shared/DesktopTooltip';
import {useTranslation} from 'react-i18next'
import {useForecastRequestData} from "../../utils/hooks"
import { RootState } from "../app/topLevel";
import ReactGA from "react-ga4";

type PropsFromRedux = ConnectedProps<typeof connector>

interface Provider {
    enabled: boolean
    key: string
    name: string
}

const renderProvider : ItemRenderer<Provider> = (provider, { handleClick, handleFocus, modifiers }) => {
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

const WeatherProviderSelector = ({weatherProvider,setWeatherProvider} : PropsFromRedux) => {
    const { t } = useTranslation()
    const forecastData = useForecastRequestData()

    return (
        <FormGroup label={<span><b>{t('labels.source')}</b></span>} labelFor={'provider'}>
            <DesktopTooltip content={t('tooltips.provider')} placement={"right"}>
                <Select
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
                    onItemSelect={(selected) => { 
                        ReactGA.event('unlock_achievement', {achievement_id: selected.key}); setWeatherProvider(selected.key) }}
                >
                    <Button id={'provider'} text={providerValues[weatherProvider].name} rightIcon="symbol-triangle-down" />
                </Select>
            </DesktopTooltip>
        </FormGroup>
    );
};

const mapStateToProps = (state : RootState) =>
    ({
        weatherProvider: state.forecast.weatherProvider
    });

const mapDispatchToProps = {
    setWeatherProvider
};

const connector = connect(mapStateToProps,mapDispatchToProps)
export default connector(WeatherProviderSelector);