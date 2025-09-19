import {FormGroup} from "@blueprintjs/core";
import {connect, ConnectedProps} from 'react-redux';
import {setWeatherProvider} from "../../redux/actions";
import { providerValues } from "../../redux/providerValues";
import { DesktopTooltip } from '../shared/DesktopTooltip';
import {useTranslation} from 'react-i18next'
import {useForecastRequestData} from "../../utils/hooks"
import type { RootState } from "../../redux/store";
import ReactGA from "react-ga4";
import { Combobox, useCombobox, InputBase } from '@mantine/core'

type PropsFromRedux = ConnectedProps<typeof connector>

const WeatherProviderSelector = ({ weatherProvider, setWeatherProvider }: PropsFromRedux) => {
    const combobox = useCombobox()
    const { t } = useTranslation()
    const forecastData = useForecastRequestData()

    const items = Object.entries(providerValues).
        filter((entry) => entry[1].maxCallsPerHour === undefined ||
            entry[1].maxCallsPerHour > forecastData.length).
        filter((entry) => entry[1].max_days >= forecastData.daysInFuture).
        map((element) => (
            <Combobox.Option value={element[0]} key={element[0]} disabled={!element[1].enabled}>
                {element[1].name}
            </Combobox.Option>
        )
        )

    return (
        <FormGroup label={<span><b>{t('labels.source')}</b></span>} labelFor={'provider'}>
            <DesktopTooltip content={t('tooltips.provider')} placement={"right"}>
                <Combobox
                    store={combobox}
                    onOptionSubmit={(selected: string) => {
                        ReactGA.event('unlock_achievement', { achievement_id: selected });
                        setWeatherProvider(selected);
                        combobox.closeDropdown();
                    }
                    }
                >
                    <Combobox.Target>
                        <InputBase
                            component="button"
                            type="button"
                            pointer
                            onClick={() => combobox.toggleDropdown()}
                            rightSection={<Combobox.Chevron />}
                            rightSectionPointerEvents="none"
                            id={'provider'}
                        >
                            {providerValues[weatherProvider].name}
                        </InputBase>
                    </Combobox.Target>

                    <Combobox.Dropdown className="dropdown">
                        <Combobox.Options>
                            {items}
                        </Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>

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