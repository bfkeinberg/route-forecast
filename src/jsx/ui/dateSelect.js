import React from 'react';
import PropTypes from 'prop-types';
import Flatpickr from 'react-flatpickr'
import {Icon} from '@blueprintjs/core';
import {ControlLabel, FormGroup, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {connect} from 'react-redux';
import {setStart} from "../actions/actions";

const time_tooltip = (
    <Tooltip id="time_tooltip">When you plan to begin riding</Tooltip>
);

/*const setDateAndTime = function(dates, datestr, instance) {
    if (datestr === '') {
        instance.setDate(this.props.start);
        return;
    }
    this.props.setStart(new Date(dates[0]));
};*/

const DateSelect = ({start,setStart}) => {
    // allow us to continue to show the start time if the route was forecast for a time before the present
    const now = new Date();
    let firstDate = now > start ? start : now;
    let later = new Date();
    const daysToAdd = 14;
    later.setDate(now.getDate() + daysToAdd);

    return (
        <FormGroup tabIndex="1"
                   style={{flex:'1',display:'inline-flex',alignItems:'center'}} controlId="starting_time">
            <OverlayTrigger placement='bottom' overlay={time_tooltip}>
                <ControlLabel>Starting time</ControlLabel>
            </OverlayTrigger>
            <Icon iconName="calendar"/>
            <Flatpickr onChange={(dates) => {
                setStart(new Date(dates[0]));
            }}
                       options={{enableTime: true,
                           altInput: true, altFormat: 'F j, Y h:i K',
                           altInputClass: 'dateDisplay',
                           minDate: firstDate,
                           maxDate: later,
                           defaultDate: start,
                           dateFormat: 'Y-m-d H:i'
                       }}/>
        </FormGroup>
    );
};

DateSelect.propTypes = {
    start:PropTypes.instanceOf(Date).isRequired,
    setStart:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        start: state.uiInfo.routeParams.start
    });

const mapDispatchToProps = {
    setStart
};

export default connect(mapStateToProps,mapDispatchToProps)(DateSelect);