import React, {useRef} from 'react';
import PropTypes from 'prop-types';
import Flatpickr from 'react-flatpickr'
import {Icon} from '@blueprintjs/core';
import {Label, UncontrolledTooltip, Row, Col} from 'reactstrap';
import {connect} from 'react-redux';
import {setStart, setInitialStart} from "../../redux/actions";
import 'flatpickr/dist/themes/confetti.css';
import { DateTime } from 'luxon';

/*const setDateAndTime = function(dates, datestr, instance) {
    if (datestr === '') {
        instance.setDate(this.props.start);
        return;
    }
    this.props.setStart(new Date(dates[0]));
};*/

export const setDateOnly = (start, setInitialStart) => {
    let now = DateTime.now();
    let newStart = start.set({day: now.day, month:now.month, year:now.year});
    setInitialStart(newStart, newStart.zone.name);
};

//"EEE MMM dd yyyy HH:mm:ss 'GMT'ZZZ"
const DateSelect = ({start, setStart, setInitialStart}) => {
    // allow us to continue to show the start time if the route was forecast for a time before the present
    const now = new Date();
    let later = new Date();
    const daysToAdd = 14;
    later.setDate(now.getDate() + daysToAdd);

    return (
        <div style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
            <UncontrolledTooltip placement='bottom' target="startingTime">When you plan to begin riding</UncontrolledTooltip>
            <span id={"startingTime"} style={{fontSize: ".875rem", fontWeight: "bolder", padding: "0px 5px", flex: 1}}>
                <Icon icon="calendar" onClick={() => setDateOnly(start, setInitialStart)} style={{cursor: "pointer", marginRight: "3px"}}/>
                Starting time
            </span>
            <div style={{flex: 2.5}}>
                <Flatpickr key={start.seconds} id='calendar'
                    value={start.toJSDate()}
                    options={{enableTime: true,
                        altInput: true, altFormat: 'F j, Y h:i K',
                        altInputClass: 'dateDisplay',
                        maxDate: later,
                        defaultDate: start.toJSDate(),
                        dateFormat: 'Z',
                        onParseConfig:(dates,datestr,instance) =>
                            instance.config.onClose.push((dates) =>
                                {setStart(DateTime.fromJSDate(dates[0]))})
                    }}
                />
            </div>
        </div>
    );
};

DateSelect.propTypes = {
    start:PropTypes.instanceOf(DateTime).isRequired,
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
