import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup, UncontrolledTooltip} from 'reactstrap';
import {connect} from 'react-redux';
import {setPace, saveCookie} from "../actions/actions";

export const paceToSpeed = {'Q':3, 'R':4, 'S':5, 'T':6, 'A-':9, 'A':10, 'A+':11, 'B':12, 'B+':13, 'C':14, 'C+':15, 'D':16, 'D+':17, 'E':18, 'E+':19};
export const inputPaceToSpeed = {'Q':3, 'R':4, 'S':5, 'T':6, 'A-':9, 'A':10, 'A+':11, 'B':12, 'B+':13, 'C-':13, 'C':14, 'C+':15, 'D-':15, 'D':16, 'D+':17, 'E':18, 'E+':19};
export const metricPaceToSpeed = {'A-':15, 'A':16, 'B-':18, 'B':19, 'C-':21, 'C':22, 'C+':24, 'D-':24, 'D':26, 'D+':27, 'E-':27, 'E':29};

const paceValues = {
    imperialLikeAPenguin: {
        values: [
            {name: "Q", number: 3}, 
            {name: "R", number: 4},
            {name: "S", number: 5},
            {name: "T", number: 6},
            {name: "A", number: 10},
            {name: "A+", number: 11},
            {name: "B", number: 12},
            {name: "B+", number: 13},
            {name: "C", number: 14},
            {name: "C+", number: 15},
            {name: "D", number: 16},
            {name: "D+", number: 17},
            {name: "E", number: 18},
        ],
        label: "mph"
    },
    metric: {
        values: [
            {name: "Q", number: 5}, 
            {name: "R", number: 6},
            {name: "S", number: 8},
            {name: "T", number: 10},
            {name: "A", number: 16},
            {name: "A+", number: 18},
            {name: "B", number: 19},
            {name: "B+", number: 21},
            {name: "C", number: 22},
            {name: "C+", number: 24},
            {name: "D", number: 26},
            {name: "D+", number: 27},
            {name: "E", number: 29},
        ],
        label: "kph"
    }
}

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
    
    const dropdownValues = metric ? paceValues.metric : paceValues.imperialLikeAPenguin

    return (
        <FormGroup>
            <Label size='sm' tag='b' for='paceInput'>Pace on flat</Label>
            <UncontrolledTooltip innerClassName={pace_tooltip_class} target='paceInput' placement="bottom">{pace_text}</UncontrolledTooltip>
            <Input tabIndex='3' type="select" value={pace} name="pace"
                id='paceInput' onChange={event => {saveCookie("pace",event.target.value);setPace(event.target.value)}}>
                {dropdownValues.values.map(({name, number}) =>
                    <option key={name} value={name}>{number} {dropdownValues.label}</option>
                )}
            </Input>
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
