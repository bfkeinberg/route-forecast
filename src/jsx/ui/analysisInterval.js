import React from 'react';
import PropTypes from 'prop-types';
import {ControlLabel, FormControl, FormGroup, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {connect} from 'react-redux';
import {setAnalysisInterval} from "../actions/actions";

const AnalysisInterval = ({interval,setInterval}) => {
    const interval_tooltip_id = 'interval_tooltip';
    const interval_tooltip_text = 'Interval at which to calculate effective pace';
    let interval_tooltip = ( <Tooltip id={interval_tooltip_id}>{interval_tooltip_text}</Tooltip> );
    return (
        <FormGroup style={{flex:'1',display:'inline-flex'}} controlId="analysisInterval">
            <ControlLabel>Analysis Interval</ControlLabel>
            <OverlayTrigger placement="bottom" overlay={interval_tooltip}>
                <FormControl componentClass="select" value={interval} name="analysisInterval"
                             onChange={event => {setInterval(event.target.value)}}>
                    <option value="4">4</option>
                    <option value="8">8</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                </FormControl>
            </OverlayTrigger>
        </FormGroup>
    );
};

AnalysisInterval.propTypes = {
    interval:PropTypes.string.isRequired,
    setInterval:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        interval: state.strava.analysisInterval
    });

const mapDispatchToProps = {
    setAnalysisInterval
};

export default connect(mapStateToProps,mapDispatchToProps)(AnalysisInterval);