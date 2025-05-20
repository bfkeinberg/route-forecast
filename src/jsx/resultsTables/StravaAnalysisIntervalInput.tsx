import {Button, FormGroup, MenuItem, Tooltip} from "@blueprintjs/core";
import { Select, ItemRenderer } from "@blueprintjs/select";
import { connect, ConnectedProps } from 'react-redux';
import {useTranslation} from 'react-i18next'
import { analysisIntervalSet } from "../../redux/stravaSlice";
import type { RootState } from "../../redux/store";

interface AnalysisInterval {
    number: string
    text: string
}
const renderInterval : ItemRenderer<AnalysisInterval>= (interval, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
        return null;
    }
    return (
        <MenuItem
            active={modifiers.active}
            key={interval.number}
            onClick={handleClick}
            text={interval.text}
        />
    );
};

const findInterval = (intervals: Array<AnalysisInterval>, interval: number) : AnalysisInterval => {
    const found = intervals.find(elem => elem.number == interval.toString())
    return found || intervals[1]
}

type PropsFromRedux = ConnectedProps<typeof connector>
const StravaAnalysisIntervalInput = ({ interval, setInterval } : PropsFromRedux) => {
    const { t } = useTranslation()
    const analysisIntervals = [
        {number: "0.5", text: t('analysis.halfHourInterval')},
        {number: "1", text: `1 ${t('analysis.interval')}`},
        {number:"2", text:`2 ${t('analysis.interval')}s`},
        {number:"4", text:`4 ${t('analysis.interval')}s`},
        {number:"6", text:`6 ${t('analysis.interval')}s`},
        {number:"8", text:`8 ${t('analysis.interval')}s`},
        {number:"12", text:`12 ${t('analysis.interval')}s`},
        {number:"24", text:`24 ${t('analysis.interval')}s`}
    ]
        
    const interval_tooltip_text = t('tooltips.analysisInterval');
    return (
        <FormGroup style={{ flex: '1' }}>
            <div style={{fontSize: "14px", fontWeight: "bold"}}>Analysis Interval</div>
            <Tooltip placement="bottom" content={interval_tooltip_text}>
            <Select
                items={analysisIntervals}
                itemsEqual={"number"}
                itemRenderer={renderInterval}
                filterable={false}
                fill={true}
                activeItem={{ number: interval.toString(), text:findInterval(analysisIntervals, interval).text }}
                onItemSelect={(selected) => { setInterval(selected.number) }}
            >
            <Button text={findInterval(analysisIntervals, interval).text} rightIcon="symbol-triangle-down" />
            </Select>
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