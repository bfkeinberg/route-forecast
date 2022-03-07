import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup, UncontrolledTooltip} from 'reactstrap';
import {connect} from 'react-redux';
import {saveCookie, setPace} from "../../redux/actions";
import { useActualPace, useFormatSpeed } from '../../utils/hooks';
import { inputPaceToSpeed, paceToSpeed } from '../../utils/util';
import "./RidingPace.css"

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

const RidingPace = ({ pace, setPace, metric }) => {

    const actualPace = useActualPace()

    const formatSpeed = useFormatSpeed()

    pace = correctPaceValue(pace, setPace);
    let pace_mph = paceToSpeed[pace];
    let pace_text;
    let pace_tooltip_class = 'pace_tooltip';
    if (actualPace === null || actualPace === 0) {
        pace_text = `Speed on flat ground, which will be reduced by climbing`;
    } else {
        pace_tooltip_class = getPaceTooltipId(actualPace,pace_mph);
        pace_text = `Actual riding pace was ${getAlphaPace(Math.round(actualPace))} (${formatSpeed(actualPace)})`;
    }

    const dropdownValues = metric ? paceValues.metric : paceValues.imperialLikeAPenguin

    return (
        <FormGroup style={{flex: 3}}>
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
    metric:PropTypes.bool.isRequired
};

const mapStateToProps = (state) =>
    ({
        pace: state.uiInfo.routeParams.pace,
        metric: state.controls.metric
    });

const mapDispatchToProps = {
    setPace
};

export default connect(mapStateToProps,mapDispatchToProps)(RidingPace);
