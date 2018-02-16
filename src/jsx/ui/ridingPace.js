import React from 'react';
import PropTypes from 'prop-types';
import {ControlLabel, FormControl, FormGroup, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {connect} from 'react-redux';
import {setPace} from "../actions/actions";

export const paceToSpeed = {'A':10, 'B':12, 'C':14, 'C+':15, 'D-':15, 'D':16, 'D+':17, 'E-':17, 'E':18};

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

const RidingPace = ({pace,actualPace,setPace}) => {
    let pace_mph = paceToSpeed[pace];
    let pace_text;
    let pace_tooltip_id = 'pace_tooltip';
    if (actualPace === undefined) {
        pace_text = `Represents climb-adjusted pace - current is ${pace_mph}`;
    } else {
        pace_tooltip_id = getPaceTooltipId(actualPace,pace_mph);
        pace_text = `Actual riding pace was ${getAlphaPace(actualPace)}`;
    }
    let pace_tooltip = ( <Tooltip id={pace_tooltip_id}>{pace_text}</Tooltip> );
    return (
        <FormGroup style={{flex:'1',display:'inline-flex',marginTop:'5px',marginBottom:'5px'}} controlId="pace">
            <ControlLabel>Pace</ControlLabel>
            <OverlayTrigger placement="bottom" overlay={pace_tooltip}>
                <FormControl tabIndex='3' componentClass="select" value={pace} name="pace"
                             style={{'width':'5em','height':'2.8em',paddingRight:'8px'}}
                             onChange={event => {setPace(event.target.value)}}>
                    <option value="A">A/10</option>
                    <option value="B">B/12</option>
                    <option value="C">C/14</option>
                    <option value="C+">C+/15</option>
                    <option value="D-">D-/15-</option>
                    <option value="D">D/16</option>
                    <option value="D+">D+/17</option>
                    <option value="E-">E-/17-</option>
                    <option value="E">E/18</option>
                </FormControl>
            </OverlayTrigger>
        </FormGroup>
    );
};

RidingPace.propTypes = {
    pace:PropTypes.string.isRequired,
    setPace:PropTypes.func.isRequired,
    actualPace:PropTypes.number
};

const mapStateToProps = (state) =>
    ({
        pace: state.uiInfo.routeParams.pace,
        actualPace: state.strava.actualPace
    });

const mapDispatchToProps = {
    setPace
};

export default connect(mapStateToProps,mapDispatchToProps)(RidingPace);