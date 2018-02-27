import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup} from 'reactstrap';
import {connect} from 'react-redux';
import {setDisplayedFinishTime} from "../actions/actions";

const FinishTime = ({finishTime,actualFinishTime,displayedFinishTime,setDisplayedFinishTime}) => {
    return (
        <FormGroup size='sm' style={{display:'inline-flex'}}>
            <Label size='sm'
                   style={{width:'7em',display:'inline-flex',marginTop:'7px',paddingLeft:'8px',paddingTop:'2px',height:'28px'}}>
                <Input tabIndex='-1' type="text"
                             onMouseEnter={() => {
                    if (actualFinishTime !== undefined) {
                        setDisplayedFinishTime(actualFinishTime);
                    }}}
                             onMouseLeave={() => setDisplayedFinishTime(finishTime)}
                             value={displayedFinishTime}/>
                Finish time
            </Label>
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