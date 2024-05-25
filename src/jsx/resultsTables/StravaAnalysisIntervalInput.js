import {Button, FormGroup, MenuItem, Tooltip} from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import {useTranslation} from 'react-i18next'
import { analysisIntervalSet } from '../../redux/reducer';

const renderInterval = (interval, { handleClick, modifiers }) => {
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

const StravaAnalysisIntervalInput = ({ interval, setInterval }) => {
    const { t } = useTranslation()
    const analysisIntervals = [
        {number: "0.5", text: "Half hour"},
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
        <FormGroup size='sm' style={{ flex: '1' }}>
            <div style={{fontSize: "14px", fontWeight: "bold"}}>Analysis Interval</div>
            <Tooltip placement="bottom" content={interval_tooltip_text}>
            <Select
                items={analysisIntervals}
                itemsEqual={"number"}
                itemRenderer={renderInterval}
                filterable={false}
                fill={true}
                activeItem={{ number: interval.toString(), text:analysisIntervals.find(elem => elem.number == interval).text }}
                onItemSelect={(selected) => { setInterval(selected.number) }}
            >
            <Button text={analysisIntervals.find(elem => elem.number == interval).text} rightIcon="symbol-triangle-down" />
            </Select>
            </Tooltip>
        </FormGroup>
    );
};

StravaAnalysisIntervalInput.propTypes = {
    interval:PropTypes.number.isRequired,
    setInterval:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        interval: state.strava.analysisInterval
    });

const mapDispatchToProps = {
    setInterval:analysisIntervalSet
};

export default connect(mapStateToProps,mapDispatchToProps)(StravaAnalysisIntervalInput);