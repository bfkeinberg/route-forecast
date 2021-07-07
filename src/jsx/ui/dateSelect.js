import React from 'react';
import PropTypes from 'prop-types';
import Flatpickr from 'react-flatpickr'
import {Icon} from '@blueprintjs/core';
import {Label, UncontrolledTooltip, Row, Col} from 'reactstrap';
import {connect} from 'react-redux';
import {setStart, setInitialStart} from "../actions/actions";
import 'flatpickr/dist/themes/confetti.css';

/*const setDateAndTime = function(dates, datestr, instance) {
    if (datestr === '') {
        instance.setDate(this.props.start);
        return;
    }
    this.props.setStart(new Date(dates[0]));
};*/

const setDateOnly = (start, setInitialStart) => {
    let now = new Date();
    start.setDate(now.getDate());
    start.setMonth(now.getMonth());
    start.setFullYear(now.getFullYear());
    setInitialStart(start);
};

const DateSelect = ({start,setStart, setInitialStart}) => {
    // allow us to continue to show the start time if the route was forecast for a time before the present
    const now = new Date();
    let later = new Date();
    const daysToAdd = 14;
    later.setDate(now.getDate() + daysToAdd);

    return (
        <Row tabIndex="1">
            <UncontrolledTooltip placement='bottom' target="startingTime">When you plan to begin riding</UncontrolledTooltip>
            <Col>
                <Icon icon="calendar" onClick={() => setDateOnly(start, setInitialStart)}/>
                <Label for='calendar' size='sm' tag='b' id='startingTime'>Starting time</Label>
                <Flatpickr key={start.getTime()} id='calendar'
                       options={{enableTime: true,
                           altInput: true, altFormat: 'F j, Y h:i K',
                           altInputClass: 'dateDisplay',
                           maxDate: later,
                           defaultDate: start,
                           dateFormat: 'Y-m-d H:i',
                           onParseConfig:(dates,datestr,instance) => instance.config.onClose.push((dates) => {setStart(new Date(dates[0]))})
                       }}/>
            </Col>
        </Row>
    );
};

DateSelect.propTypes = {
    start:PropTypes.instanceOf(Date).isRequired,
    setStart:PropTypes.func.isRequired,
    setInitialStart:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        start: state.uiInfo.routeParams.initialStart
    });

const mapDispatchToProps = {
    setStart, setInitialStart
};

export default connect(mapStateToProps,mapDispatchToProps)(DateSelect);
