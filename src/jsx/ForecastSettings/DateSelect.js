import "@blueprintjs/datetime2/lib/css/blueprint-datetime2.css";
import "@blueprintjs/datetime2/node_modules/@blueprintjs/datetime/lib/css/blueprint-datetime.css";

import {Icon} from '@blueprintjs/core';
import { DateInput3, TimePrecision } from "@blueprintjs/datetime2";
import { DateTime } from 'luxon';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import {setStart, setTimeFromIso} from "../../redux/actions";
import { initialStartTimeSet } from '../../redux/reducer';
import { DesktopTooltip } from '../shared/DesktopTooltip';
import {useTranslation} from 'react-i18next'

export const setDateOnly = (start, setInitialStart) => {
    let now = DateTime.now();
    let newStart = start.set({day: now.day, month:now.month, year:now.year});
    setInitialStart({start:newStart.toISO(), zone:newStart.zone.name});
};

//"EEE MMM dd yyyy HH:mm:ss 'GMT'ZZZ"
const DateSelect = ({ start, zone, setStart, initialStartTimeSet, maxDaysInFuture, canForecastPast, setTimeFromIso }) => {
    const { t } = useTranslation()
    const setDateWithZone = (zone) => {
        setTimeFromIso(start.toISO({includeOffset:false}), zone)
    }

    const setDateFromPicker = (dateIsoString) => {
        setStart(DateTime.fromISO(dateIsoString).toMillis());
    }

    // allow us to continue to show the start time if the route was forecast for a time before the present
    const now = new Date();
    let later = new Date();
    const daysToAdd = maxDaysInFuture;
    later.setDate(now.getDate() + daysToAdd);
    let otherAttributes = {}
    if (!canForecastPast) {
        otherAttributes.minDate = now
    }
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span id={"startingTime"} style={{ fontSize: ".875rem", fontWeight: "bolder", padding: "0px 5px", flex: 1 }}>
                <Icon icon="calendar" onClick={() => setDateOnly(start, initialStartTimeSet)} style={{ cursor: "pointer", marginRight: "3px" }} />
                {t('labels.startingTime')}
            </span>
            <div style={{ flex: 2.5 } }>
                <DesktopTooltip content={t('tooltips.startingTime')} placement={'bottom'}>
                    <DateInput3
                        onChange={setDateFromPicker}
                        onTimezoneChange={setDateWithZone}
                        {...otherAttributes}
                        placeholder="M/D/YYYY"
                        value={start.toISO()}
                        showTimezoneSelect
                        maxDate={later}
                        timePrecision={TimePrecision.MINUTE}
                        timePickerProps={{useAmPm:true, showArrowButtons:true}}
                        dateFnsFormat='MMMM d, yyyy h:mmaaa'
                        timezone={zone}
                    />
                </DesktopTooltip>
            </div>
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
