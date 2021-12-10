import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup, UncontrolledTooltip} from 'reactstrap';
import {connect} from 'react-redux';
import {setPace, saveCookie} from "../actions/actions";

export const paceToSpeed = {'Q':3, 'R':4, 'S':5, 'T':6, 'A-':9, 'A':10, 'A+':11, 'B':12, 'B+':13, 'C':14, 'C+':15, 'D':16, 'D+':17, 'E':18, 'E+':19};
export const inputPaceToSpeed = {'Q':3, 'R':4, 'S':5, 'T':6, 'A-':9, 'A':10, 'A+':11, 'B':12, 'B+':13, 'C-':13, 'C':14, 'C+':15, 'D-':15, 'D':16, 'D+':17, 'E':18, 'E+':19};
export const metricPaceToSpeed = {'A-':15, 'A':16, 'B-':18, 'B':19, 'C-':21, 'C':22, 'C+':24, 'D-':24, 'D':26, 'D+':27, 'E-':27, 'E':29};

const getAlphaPace = function(pace) {
    let alpha = 'A';     // default
    alpha = Object.keys(paceToSpeed).reverse().find(value => {
        return (pace >= paceToSpeed[value])});
    return alpha;
};

const getPaceTooltipId = function(realPace, predictedPace) {
    if (realPace < predictedPace) {
        return 'red-tooltip';
    } else {
        return 'green-tooltip';
    }
};

const correctPaceValue = (paceAlpha, setPace) => {
    let paceNumeric = paceToSpeed[paceAlpha];
    if (paceNumeric === undefined) {
        paceNumeric = inputPaceToSpeed[paceAlpha];
        let pace = getAlphaPace(paceNumeric);
        setPace(pace);
        return pace;
    } else {
        return paceAlpha;
    }
}

const RidingPace = ({pace,actualPace,setPace,metric}) => {
    pace = correctPaceValue(pace, setPace);
    let pace_mph = paceToSpeed[pace];
    let pace_text;
    let pace_tooltip_class = 'pace_tooltip';
    if (actualPace === undefined || actualPace === 0) {
        pace_text = `Speed on flat ground, which will be reduced by climbing`;
    } else {
        pace_tooltip_class = getPaceTooltipId(actualPace,pace_mph);
        pace_text = `Actual riding pace was ${getAlphaPace(Math.round(actualPace))} (${actualPace.toFixed(1)})`;
    }
    return (
        <FormGroup>
            <Label size='sm' tag='b' for='paceInput'>Pace on flat</Label>
            <UncontrolledTooltip innerClassName={pace_tooltip_class} target='paceInput' placement="bottom">{pace_text}</UncontrolledTooltip>
            {metric ?
                <Input tabIndex='3' type="select" value={pace} name="pace"
                             id='paceInput' onChange={event => {saveCookie("pace",event.target.value);setPace(event.target.value)}}>
                    <option value="Q">5 kph</option>
                    <option value="R">6 kph</option>
                    <option value="S">8 kph</option>
                    <option value="T">10 kph</option>
                    <option value="A">16 kph</option>
                    <option value="A+">18 kph</option>
                    <option value="B">19 kph</option>
                    <option value="B+">21 kph</option>
                    <option value="C">22 kph</option>
                    <option value="C+">24 kph</option>
                    <option value="D">26 kph</option>
                    <option value="D+">27 kph</option>
                    <option value="E">29 kph</option>
                </Input> :
                <Input tabIndex='3' type="select" value={pace} name="pace"
                       id='paceInput' onChange={event => {saveCookie("pace",event.target.value);setPace(event.target.value)}}>
                    <option value="Q">3 mph</option>
                    <option value="R">4 mph</option>
                    <option value="S">5 mph</option>
                    <option value="T">6 mph</option>
                    <option value="A">10 mph</option>
                    <option value="A+">11 mph</option>
                    <option value="B">12 mph</option>
                    <option value="B+">13 mph</option>
                    <option value="C">14 mph</option>
                    <option value="C+">15 mph</option>
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
