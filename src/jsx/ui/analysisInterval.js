import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup, UncontrolledTooltip} from 'reactstrap';
import {connect} from 'react-redux';
import {getPaceOverTime, setAnalysisInterval} from "../actions/actions";

const AnalysisInterval = ({interval,setInterval,getPaceOverTime,visible}) => {
    const interval_tooltip_text = 'Interval at which to calculate effective pace';
    const isVisible = visible ? 'inline-flex' : 'none';
    return (
        <FormGroup size='sm' style={{flex:'1',display:isVisible}}>
            <UncontrolledTooltip placement="bottom" target='analysisInterval'>{interval_tooltip_text}</UncontrolledTooltip>
            <Label>Analysis Interval
                <Input id='analysisInterval' type="select" value={interval} name="analysisInterval"
                             onChange={event => {setInterval(event.target.value);getPaceOverTime()}}>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="4">4</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                </Input>
            </Label>
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