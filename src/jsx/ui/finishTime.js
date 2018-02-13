import React from 'react';
import PropTypes from 'prop-types';
import {ControlLabel, FormControl, FormGroup} from 'react-bootstrap';
import {connect} from 'react-redux';
import {setDisplayedFinishTime} from "../actions/actions";

const FinishTime = ({finishTime,actualFinishTime,displayedFinishTime,setDisplayedFinishTime}) => {
    return (
        <FormGroup controlId="finishTime" style={{display:'inline-flex'}}>
            <ControlLabel style={{width:'7em',display:'inline-flex',marginTop:'7px',paddingLeft:'8px'}}>Finish time</ControlLabel>
            <FormControl tabIndex='-1' type="text"
                         onMouseEnter={() => {
                if (actualFinishTime !== undefined) {
                    setDisplayedFinishTime(actualFinishTime);
                }}}
                         onMouseLeave={() => setDisplayedFinishTime(finishTime)}
                         style={{paddingLeft:'2px',paddingTop:'2px',height:'28px'}}
                         value={displayedFinishTime}/>
        </FormGroup>
        );
};

FinishTime.propTypes = {
    finishTime:PropTypes.string,
    actualFinishTime:PropTypes.string,
    displayedFinishTime:PropTypes.string,
    setDisplayedFinishTime:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        finishTime: state.routeInfo.finishTime,
        actualFinishTime: state.strava.actualFinishTime,
        displayedFinishTime: state.controls.displayedFinishTime
    });

const mapDispatchToProps = {
    setDisplayedFinishTime
};

export default connect(mapStateToProps,mapDispatchToProps)(FinishTime);