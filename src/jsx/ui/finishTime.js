import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup} from 'reactstrap';
import {connect} from 'react-redux';
import {setDisplayedFinishTime} from "../actions/actions";
import '../../static/controlsStyles.css';

const FinishTime = ({finishTime,actualFinishTime,displayedFinishTime,setDisplayedFinishTime}) => {
    return (
        <div className="controls-item-contents">
            <span className="controls-textinput-label">Finish time</span>
            <Input disabled style={{width:'14em',height:'28px', margin: '0px 0px 0px 5px', flex: 1.75}}
                size="8" bsSize='sm' tabIndex='-1' type="text" id="finishTime"
                         onMouseEnter={() => {
                if (actualFinishTime !== undefined) {
                    setDisplayedFinishTime(actualFinishTime);
                }}}
                         onMouseLeave={() => setDisplayedFinishTime(finishTime)}
                         value={displayedFinishTime}/>
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