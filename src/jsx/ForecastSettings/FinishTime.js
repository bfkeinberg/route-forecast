import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {setDisplayedFinishTime} from "../actions/actions";
import '../../static/controlsStyles.css';

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