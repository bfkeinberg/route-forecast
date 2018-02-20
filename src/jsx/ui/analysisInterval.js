import React from 'react';
import PropTypes from 'prop-types';
import {ControlLabel, FormControl, FormGroup, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {connect} from 'react-redux';
import {getPaceOverTime, setAnalysisInterval} from "../actions/actions";

const AnalysisInterval = ({interval,setInterval,getPaceOverTime,visible}) => {
    const interval_tooltip_id = 'interval_tooltip';
    const interval_tooltip_text = 'Interval at which to calculate effective pace';
    let interval_tooltip = ( <Tooltip id={interval_tooltip_id}>{interval_tooltip_text}</Tooltip> );
    const isVisible = visible ? 'inline-flex' : 'none';
    return (
        <FormGroup style={{flex:'1',display:isVisible}} controlId="analysisInterval">
            <ControlLabel>Analysis Interval</ControlLabel>
            <OverlayTrigger placement="bottom" overlay={interval_tooltip}>
                <FormControl componentClass="select" value={interval} name="analysisInterval"
                             onChange={event => {setInterval(event.target.value);getPaceOverTime(event.target.value)}}>
                    <option value="4">4</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                </FormControl>
            </OverlayTrigger>
        </FormGroup>
    );
};

AnalysisInterval.propTypes = {
    interval:PropTypes.number.isRequired,
    setInterval:PropTypes.func.isRequired,
    visible:PropTypes.bool.isRequired,
    getPaceOverTime:PropTypes.func
};

const mapStateToProps = (state) =>
    ({
        interval: state.strava.analysisInterval
    });

const mapDispatchToProps = {
    setInterval:setAnalysisInterval,getPaceOverTime
};

export default connect(mapStateToProps,mapDispatchToProps)(AnalysisInterval);