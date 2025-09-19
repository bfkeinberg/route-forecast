import {FormGroup, Tooltip} from "@blueprintjs/core";
import { connect, ConnectedProps } from 'react-redux';
import {useTranslation} from 'react-i18next'
import { analysisIntervalSet } from "../../redux/stravaSlice";
import type { RootState } from "../../redux/store";
import { Combobox, useCombobox, InputBase } from '@mantine/core'

type PropsFromRedux = ConnectedProps<typeof connector>
const StravaAnalysisIntervalInput = ({ interval, setInterval }: PropsFromRedux) => {
    const combobox = useCombobox()
    const { t } = useTranslation()
    const analysisIntervals = [
        { number: "0.5", text: t('analysis.halfHourInterval') },
        { number: "1", text: `1 ${t('analysis.interval')}` },
        { number: "2", text: `2 ${t('analysis.interval')}s` },
        { number: "4", text: `4 ${t('analysis.interval')}s` },
        { number: "6", text: `6 ${t('analysis.interval')}s` },
        { number: "8", text: `8 ${t('analysis.interval')}s` },
        { number: "12", text: `12 ${t('analysis.interval')}s` },
        { number: "24", text: `24 ${t('analysis.interval')}s` }
    ]
    const options = analysisIntervals.map((item) => (
        <Combobox.Option value={item.number.toString()} key={item.number}>
            {item.text}
        </Combobox.Option>
    ))

    const interval_tooltip_text = t('tooltips.analysisInterval');
    return (
        <FormGroup style={{ flex: '1' }}>
            <div style={{ fontSize: "14px", fontWeight: "bold" }}>Analysis Interval</div>
            <Tooltip placement="bottom" content={interval_tooltip_text}>
                <Combobox
                    store={combobox}
                    onOptionSubmit={(selected: string) => {
                        setInterval(selected)
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
                        >
                            {interval}
                        </InputBase>
                    </Combobox.Target>

                    <Combobox.Dropdown className="dropdown">
                        <Combobox.Options>
                            {options}
                        </Combobox.Options>
                    </Combobox.Dropdown>
                </Combobox>

            </Tooltip>
        </FormGroup>
    );
};

const mapStateToProps = (state : RootState) =>
    ({
        interval: state.strava.analysisInterval
    });

const mapDispatchToProps = {
    setInterval:analysisIntervalSet
};

const connector = connect(mapStateToProps,mapDispatchToProps)
export default connector(StravaAnalysisIntervalInput);