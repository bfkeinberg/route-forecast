import React from 'react';
import PropTypes from 'prop-types';
import Flatpickr from 'react-flatpickr'
import {Icon} from '@blueprintjs/core';
import { DesktopTooltip } from '../shared/DesktopTooltip';
import {connect} from 'react-redux';
import {setStart, setTimeFromIso} from "../../redux/actions";
import 'flatpickr/dist/themes/confetti.css';
import { DateTime } from 'luxon';
import { initialStartTimeSet } from '../../redux/reducer';
import TimeZoneSelect from 'react-timezone-select'

export const setDateOnly = (start, setInitialStart) => {
    let now = DateTime.now();
    let newStart = start.set({day: now.day, month:now.month, year:now.year});
    setInitialStart({start:newStart.toISO(), zone:newStart.zone.name});
};

//"EEE MMM dd yyyy HH:mm:ss 'GMT'ZZZ"
const DateSelect = ({ start, zone, setStart, initialStartTimeSet, maxDaysInFuture, canForecastPast, setTimeFromIso }) => {
    // eslint-disable-next-line array-element-newline
    const setDateWithZone = (zone) => {
        setTimeFromIso(start.toISO({includeOffset:false}), zone.value)
    }

        // allow us to continue to show the start time if the route was forecast for a time before the present
    const now = new Date();
    let later = new Date();
    const daysToAdd = maxDaysInFuture;
    later.setDate(now.getDate() + daysToAdd);

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span id={"startingTime"} style={{ fontSize: ".875rem", fontWeight: "bolder", padding: "0px 5px", flex: 1 }}>
                <Icon icon="calendar" onClick={() => setDateOnly(start, initialStartTimeSet)} style={{ cursor: "pointer", marginRight: "3px" }} />
                Starting time
            </span>
            <div style={{ flex: 2.5 }}>
                <DesktopTooltip content={'When you plan to begin riding'} placement={'bottom'}>
                    <Flatpickr key={start.seconds} id='calendar'
                        value={start.toJSDate()}
                        options={{
                            enableTime: true,
                            altInput: true, altFormat: 'F j, Y h:i K',
                            altInputClass: 'dateDisplay',
                            minDate: canForecastPast ? null : now,
                            maxDate: later,
                            defaultDate: start.toJSDate(),
                            dateFormat: 'Z',
                            onParseConfig: (dates, datestr, instance) =>
                                instance.config.onClose.push((dates) => { setStart(DateTime.fromJSDate(dates[0]).toMillis(), { zone: zone }) })
                        }}
                    />
                </DesktopTooltip>
            </div>
            <TimeZoneSelect
                        onChange={setDateWithZone} value={zone} labelStyle={'original'}
                        styles={{dropdownIndicator: (baseStyles) => ({
                                ...baseStyles, width:'90%'}),
                                container:(baseStyles) => ({
                                    ...baseStyles, maxWidth: '16em'}),
                                        singleValue:(baseStyles) => ({
                                            ...baseStyles, fontSize:'0.8rem', fontWeight:'bold'}),
                        }}
                    />
        </div>
    );
};

DateSelect.propTypes = {
    start:PropTypes.instanceOf(DateTime).isRequired,
    zone:PropTypes.string,
    setStart:PropTypes.func.isRequired,
    initialStartTimeSet:PropTypes.func.isRequired,
    maxDaysInFuture:PropTypes.number.isRequired,
    canForecastPast:PropTypes.bool.isRequired,
    setTimeFromIso:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        start: DateTime.fromMillis(state.uiInfo.routeParams.startTimestamp, {zone:state.uiInfo.routeParams.zone}),
        zone: state.uiInfo.routeParams.zone,
        maxDaysInFuture:state.uiInfo.routeParams.maxDaysInFuture,
        canForecastPast:state.uiInfo.routeParams.canForecastPast
    });

const mapDispatchToProps = {
    setStart, initialStartTimeSet, setTimeFromIso
};

export default connect(mapStateToProps,mapDispatchToProps)(DateSelect);
