import React from 'react';
import PropTypes from 'prop-types';
import { Input, FormGroup, UncontrolledTooltip } from 'reactstrap';
import { connect } from 'react-redux';
import { setAnalysisInterval } from "../../redux/actions";

const StravaAnalysisIntervalInput = ({ interval, setInterval }) => {
    const interval_tooltip_text = 'Interval in hours at which to calculate effective pace';
    return (
        <FormGroup size='sm' style={{ flex: '1' }}>
            <UncontrolledTooltip placement="bottom" target='analysisInterval'>{interval_tooltip_text}</UncontrolledTooltip>
            <div style={{fontSize: "14px", fontWeight: "bold"}}>Analysis Interval</div>
            <Input
                id='analysisInterval'
                type="select"
                value={interval}
                name="analysisInterval"
                onChange={event => { setInterval(event.target.value); }}
                style={{cursor: "pointer"}}
            >
                <option value="0.5">Half hour</option>
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="4">4 hours</option>
                <option value="6">6 hours</option>
                <option value="8">8 hours</option>
                <option value="12">12 hours</option>
                <option value="24">24 hours</option>
            </Input>
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
    setInterval:setAnalysisInterval
};

export default connect(mapStateToProps,mapDispatchToProps)(StravaAnalysisIntervalInput);