import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup} from 'reactstrap';
import {connect} from 'react-redux';
import {setDisplayedFinishTime} from "../actions/actions";

const FinishTime = ({finishTime,actualFinishTime,displayedFinishTime,setDisplayedFinishTime}) => {
    return (
        <FormGroup>
            <Label for="finishTime" size='sm' tag='b'>Finish time</Label>
            <Input style={{width:'7em',height:'28px'}}
                size="12" bsSize='md' tabIndex='-1' type="text" id="finishTime"
                         onMouseEnter={() => {
                if (actualFinishTime !== undefined) {
                    setDisplayedFinishTime(actualFinishTime);
                }}}
                         onMouseLeave={() => setDisplayedFinishTime(finishTime)}
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