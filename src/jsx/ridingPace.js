import React from 'react';
import {ControlLabel, FormControl, FormGroup, OverlayTrigger} from 'react-bootstrap';

const RidingPace = ({pace,setPace}) => {
    return (
        <FormGroup style={{flex:'1',display:'inline-flex',marginTop:'5px',marginBottom:'5px'}} controlId="pace">
            <ControlLabel>Pace</ControlLabel>
            <OverlayTrigger placement="bottom" overlay={pace_tooltip}>
                <FormControl tabIndex='3' componentClass="select" value={this.props.pace} name="pace"
                             style={{'width':'5em','height':'2.8em',paddingRight:'8px'}}
                             onChange={this.setPace}>
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
