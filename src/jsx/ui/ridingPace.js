import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup, UncontrolledTooltip} from 'reactstrap';
import {connect} from 'react-redux';
import {setPace} from "../actions/actions";

export const paceToSpeed = {'A-':9, 'A':10, 'B-':11, 'B':12, 'C-':13, 'C':14, 'C+':15, 'D-':15, 'D':16, 'D+':17, 'E-':17, 'E':18};
export const metricPaceToSpeed = {'A-':15, 'A':16, 'B-':18, 'B':19, 'C-':21, 'C':22, 'C+':24, 'D-':24, 'D':26, 'D+':27, 'E-':27, 'E':29};

const getAlphaPace = function(pace) {
    let alpha = 'A';     // default
    alpha = Object.keys(paceToSpeed).reverse().find(value => {
        return (pace > paceToSpeed[value])});
    return alpha;
};

const getPaceTooltipId = function(realPace, predictedPace) {
    if (realPace < predictedPace) {
        return 'red-tooltip';
    } else {
        return 'green-tooltip';
    }
};

const RidingPace = ({pace,actualPace,setPace,metric}) => {
    let pace_mph = paceToSpeed[pace];
    let pace_text;
    let pace_tooltip_class = 'pace_tooltip';
    if (actualPace === undefined) {
        pace_text = `Speed on flat ground, which will be adjusted for climbing`;
    } else {
        pace_tooltip_class = getPaceTooltipId(actualPace,pace_mph);
        pace_text = `Actual riding pace was ${getAlphaPace(actualPace)}`;
    }
    return (
        <FormGroup>
            <Label size='sm' tag='b' for='paceInput'>Pace</Label>
            <UncontrolledTooltip innerClassName={pace_tooltip_class} target='paceInput' placement="bottom">{pace_text}</UncontrolledTooltip>
            {metric ?
                <Input tabIndex='3' type="select" value={pace} name="pace"
                             id='paceInput' onChange={event => {setPace(event.target.value)}}>
                    <option value="A">16 kph</option>
                    <option value="B-">18 kph</option>
                    <option value="B">19 kph</option>
                    <option value="C-">21 kph</option>
                    <option value="C">22 kph</option>
                    <option value="D-">24 kph</option>
                    <option value="D">26 kph</option>
                    <option value="D+">27 kph</option>
                    <option value="E">29 kph</option>
                </Input>
                :
                <Input tabIndex='3' type="select" value={pace} name="pace"
                       id='paceInput' onChange={event => {setPace(event.target.value)}}>
                    <option value="A">10 mph</option>
                    <option value="B-">11 mph</option>
                    <option value="B">12 mph</option>
                    <option value="C-">13 mph</option>
                    <option value="C">14 mph</option>
                    <option value="D-">15 mph</option>
                    <option value="D">16 mph</option>
                    <option value="D+">17 mph</option>
                    <option value="E">18 mph</option>
                </Input>
            }
        </FormGroup>
    );
};

RidingPace.propTypes = {
    pace:PropTypes.string.isRequired,
    setPace:PropTypes.func.isRequired,
    actualPace:PropTypes.number,
    metric:PropTypes.bool.isRequired
};

const mapStateToProps = (state) =>
    ({
        pace: state.uiInfo.routeParams.pace,
        actualPace: state.strava.actualPace,
        metric: state.controls.metric
    });

const mapDispatchToProps = {
    setPace
};

export default connect(mapStateToProps,mapDispatchToProps)(RidingPace);