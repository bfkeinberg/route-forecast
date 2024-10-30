import "@blueprintjs/datetime2/lib/css/blueprint-datetime2.css";

import {Icon} from '@blueprintjs/core';
import {TimePrecision} from "@blueprintjs/datetime"
import { DateInput3 } from "@blueprintjs/datetime2";
import { DateTime } from 'luxon';
import {connect, ConnectedProps} from 'react-redux';

import {setStart} from "../../redux/actions";
import { setTimeFromIso } from "../../redux/actions";
import { initialStartTimeSet } from "../../redux/routeParamsSlice";
import {useMediaQuery} from 'react-responsive'
import { Tooltip } from "@blueprintjs/core";
import {useTranslation} from 'react-i18next'
import { RootState } from "../app/topLevel";
import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
type PropsFromRedux = ConnectedProps<typeof connector>

export const setDateOnly = (start : DateTime, setInitialStart : ActionCreatorWithPayload<{
    start: string;
    zone: string;
}, "routeParams/initialStartTimeSet">) => {
    let now = DateTime.now();
    let newStart = start.set({day: now.day, month:now.month, year:now.year});
    setInitialStart({start: newStart.toISO()!, zone:newStart.zone.name});
};

//"EEE MMM dd yyyy HH:mm:ss 'GMT'ZZZ"
const DateSelect = ({ start, zone, setStart, initialStartTimeSet, maxDaysInFuture, canForecastPast, setTimeFromIso } : PropsFromRedux) => {
    const { t, i18n } = useTranslation()
    const setDateWithZone = (zone : string) => {
        setTimeFromIso(start.toISO({includeOffset:false})!, zone)
    }

    const setDateFromPicker = (dateIsoString : string|null) => {
        if (dateIsoString) {
            setStart(DateTime.fromISO(dateIsoString).toMillis());
        }
    }

    // allow us to continue to show the start time if the route was forecast for a time before the present
    const now = new Date();
    let later = new Date();
    const daysToAdd = maxDaysInFuture;
    later.setDate(now.getDate() + daysToAdd);
    const hideTooltip = useMediaQuery({query:'(maxWidth={500}'})
    interface OtherAttributes {
        minDate? : Date
    }
    let otherAttributes : OtherAttributes = {}
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
                <Tooltip disabled={hideTooltip} targetTagName={'div'} content={t('tooltips.startingTime')} placement={'top'}>
                    <DateInput3
                        onChange={setDateFromPicker}
                        fill={false}
                        closeOnSelection={false}
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
                        locale={i18n.language}
                    />
                    </Tooltip>
            </div>
        </div>
    );
};

const mapStateToProps = (state : RootState) =>
    ({
        start: DateTime.fromMillis(state.uiInfo.routeParams.startTimestamp, {zone:state.uiInfo.routeParams.zone}),
        zone: state.uiInfo.routeParams.zone,
        maxDaysInFuture:state.uiInfo.routeParams.maxDaysInFuture,
        canForecastPast:state.uiInfo.routeParams.canForecastPast
    });

const mapDispatchToProps = {
    setStart, initialStartTimeSet, setTimeFromIso
};

const connector = connect(mapStateToProps,mapDispatchToProps)
export default connector(DateSelect);
