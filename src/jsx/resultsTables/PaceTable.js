import 'animate.css/animate.min.css';

import { HTMLTable, Tooltip } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import cookie from 'react-cookies';
import {connect} from 'react-redux';

import { mapRangeToggled,mapSubrangeSet } from '../../redux/reducer';
import { zoomToRangeToggled } from '../../redux/forecastSlice';
import { useActualPace, useFormatSpeed } from '../../utils/hooks';
import stravaRouteParser from '../../utils/stravaRouteParser';
import ErrorBoundary from "../shared/ErrorBoundary";
import { ToggleButton } from '../shared/ToggleButton';
import StravaAnalysisIntervalInput from './StravaAnalysisIntervalInput';
import {useTranslation} from 'react-i18next'

const PaceTable = ({activityData, activityStream, analysisInterval, mapSubrangeSet, mapRangeToggled, zoomToRange, zoomToRangeToggled}) =>  {
    const { t } = useTranslation()
    const [
        selectedRow,
        setSelectedRow
    ] = useState(null)

    const updateSubrange = (event) => {
        // TODO
        // for inexplicable reasons, broken if a forecast is also loaded. so disabling this entirely for now
        mapSubrangeSet({
            start: parseInt(event.currentTarget.getAttribute('start'), 10),
            finish: parseInt(event.currentTarget.getAttribute('end'), 10)
        }
        );
    };

    const toggleZoom = () => {
        zoomToRangeToggled();
        cookie.save('zoomToRange', !zoomToRange, { path: '/' });
    };

    const toggleRange = (event) => {
        const start = parseInt(event.currentTarget.getAttribute('start'));
        mapRangeToggled({start:start, finish:parseInt(event.currentTarget.getAttribute('end'))});
        if (selectedRow === start) {
            setSelectedRow(null)
        } else {
            setSelectedRow(start)
        }
    };

    const formatSpeed = useFormatSpeed()

    const expandTable = (paces) => {
        return (
            <tbody>
            {paces.map((pace) =>
                <tr key={pace.distance+Math.random().toString(10)} start={pace.start} end={pace.end}
                    onClick={toggleRange} onMouseEnter={updateSubrange}>
                    <td>{pace.time}</td>
                    <td>{formatSpeed(pace.pace)}</td>
                    <td>{pace.alphaPace}</td>
                    <td>{pace.distance.toFixed(0)}</td>
                    <td>{pace.climb.toFixed(0)}</td>
                    <td>{((pace.climb*100)/(pace.distance*5280)).toFixed(1)}%</td>
                    <td>{(pace.stoppedTimeSeconds/60).toFixed(1)}min</td>
                </tr>
            )}
            </tbody>
        );
    }

    const actualPace = useActualPace()

    if (activityData === null) {
        return null
    }
    const paceOverTime = stravaRouteParser.findMovingAverages(activityData, activityStream, analysisInterval)

    // TODO: localize table headers
    return (
            <div className="animated slideInRight">
                <ErrorBoundary>
                    <div style={{padding: "16px", display: "flex", flexFlow: "column", alignItems: "center"}}>
                        <StravaAnalysisIntervalInput />
                        <div id="paceSpan" style={{fontSize: "14px", marginTop: "10px"}}>{t('analysis.overallPace')} <span style={{fontWeight: "bold"}}>{formatSpeed(actualPace)}</span>.</div>
                    </div>
                    <div style={{padding: "16px", display: "flex", flexFlow: "column", alignItems: "end"}}>
                        <ToggleButton active={zoomToRange} onClick={toggleZoom}>{t('buttons.zoomToSegment')}</ToggleButton>
                    </div>
                    <HTMLTable bordered interactive striped >
                        <thead>
                        <tr>
                            <th style={{'fontSize':'80%'}}>Time</th>
                            <th id={'pace'} style={{'fontSize':'80%'}}>
                                <Tooltip content={t('tooltips.overallPace')} placement={"top"}>Pace</Tooltip>
                            </th>
                            <th style={{'fontSize':'80%'}}>WW Pace</th>
                            <th style={{'fontSize':'80%'}}>Distance</th>
                            <th style={{'fontSize':'80%'}}>Climb</th>
                            <th style={{'fontSize':'80%'}}>Avg Grade</th>
                            <th style={{'fontSize':'80%'}}>Time Stopped</th>
                        </tr>
                        </thead>
                        {expandTable(paceOverTime)}
                    </HTMLTable>
                </ErrorBoundary>
            </div>
    );
}

PaceTable.propTypes = {
    mapSubrangeSet:PropTypes.func.isRequired,
    mapRangeToggled:PropTypes.func.isRequired,
    activityData:PropTypes.object,
    activityStream:PropTypes.object,
    analysisInterval:PropTypes.number,
    zoomToRange:PropTypes.bool.isRequired,
    zoomToRangeToggled:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        activityData: state.strava.activityData,
        activityStream: state.strava.activityStream,
        analysisInterval: state.strava.analysisInterval,
        zoomToRange: state.forecast.zoomToRange
    });

const mapDispatchToProps = {
    mapSubrangeSet, mapRangeToggled, zoomToRangeToggled
};

export default connect(mapStateToProps,mapDispatchToProps)(PaceTable);
