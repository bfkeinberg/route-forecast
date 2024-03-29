import React from 'react';
import PropTypes from 'prop-types';
import {FormGroup, Button, MenuItem, Tooltip} from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";
import { connect } from 'react-redux';
import { analysisIntervalSet } from '../../redux/reducer';

const analysisIntervals = [
    {number: "0.5", text: "Half hour"},
    {number: "1", text: "1 hour"},
    {number:"2", text:"2 hours"},
    {number:"4", text:"4 hours"},
    {number:"6", text:"6 hours"},
    {number:"8", text:"8 hours"},
    {number:"12", text:"12 hours"},
    {number:"24", text:"24 hours"}
];

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
    const interval_tooltip_text = 'Interval in hours at which to calculate effective pace';
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