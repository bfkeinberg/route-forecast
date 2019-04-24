import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup} from 'reactstrap';
import {connect} from 'react-redux';
import {setDisplayedFinishTime} from "../actions/actions";
import '../../static/controlsStyles.css';

/*
           <input className={'finish-time'} disabled={true}
                tabIndex='-1' type="text" id="finishTime"
                         onMouseEnter={() => {

/*
            <Input disabled style={{width:'14em',height:'28px', margin: '0px 0px 0px 5px', flex: 1.75}}
                size="8" bsSize='sm' tabIndex='-1' type="text" id="finishTime"
                         onMouseEnter={() => {

 */
const FinishTime = ({finishTime,actualFinishTime,displayedFinishTime,setDisplayedFinishTime}) => {
    return (
        <div className="controls-item-contents">
            <span id={'finish-time-label'} className="controls-textinput-label">Finish time</span>
            <span className="finish-time-value"
                  onMouseEnter={() => {
                      if (actualFinishTime !== undefined) {
                          setDisplayedFinishTime(actualFinishTime);
                      }}}
                  onMouseLeave={() => setDisplayedFinishTime(finishTime)}
            >{displayedFinishTime}</span>
        </div>
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