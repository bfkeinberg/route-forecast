import React, { useState } from 'react';
import { Table, UncontrolledTooltip } from 'reactstrap';
import ErrorBoundary from "../shared/ErrorBoundary";
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import 'animate.css/animate.min.css';
import { setSubrange, toggleMapRange } from '../../redux/actions';
import stravaRouteParser from '../../utils/stravaRouteParser';
import StravaAnalysisIntervalInput from './StravaAnalysisIntervalInput';
import { useActualPace, useFormatSpeed } from '../../utils/hooks';

const PaceTable = ({activityData, activityStream, analysisInterval, setSubrange, toggleMapRange}) =>  {

    const [
selectedRow,
setSelectedRow
] = useState(null)

    const updateSubrange = (event) => {
        // TODO
        // for inexplicable reasons, broken if a forecast is also loaded. so disabling this entirely for now
        // setSubrange(
        //     parseInt(event.currentTarget.getAttribute('start'), 10),
        //     parseInt(event.currentTarget.getAttribute('end'), 10)
        // );
    };

    const toggleRange = (event) => {
        const start = parseInt(event.currentTarget.getAttribute('start'));
        toggleMapRange(start, parseInt(event.currentTarget.getAttribute('end')));
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

    return (
            <div className="animated slideInRight">
                <ErrorBoundary>
                    <div style={{padding: "16px", display: "flex", flexFlow: "column", alignItems: "center"}}>
                        <StravaAnalysisIntervalInput />
                        <div id="paceSpan" style={{fontSize: "14px", marginTop: "10px"}}>Overall climb-adjusted pace was <span style={{fontWeight: "bold"}}>{formatSpeed(actualPace)}</span>.</div>
                    </div>
                    <Table striped responsive hover bordered>
                        <thead>
                        <tr>
                            <th style={{'fontSize':'80%'}}>Time</th>
                            <th id={'pace'} style={{'fontSize':'80%'}}>Pace</th>
                            <th style={{'fontSize':'80%'}}>WW Pace</th>
                            <th style={{'fontSize':'80%'}}>Distance</th>
                            <th style={{'fontSize':'80%'}}>Climb</th>
                            <th style={{'fontSize':'80%'}}>Time Stopped</th>
                        </tr>
                        </thead>
                        {expandTable(paceOverTime)}
                    </Table>
                </ErrorBoundary>
                <UncontrolledTooltip placement={'top'} target={'pace'}>Pace is average speed adjusted for climb</UncontrolledTooltip>
            </div>
    );
}

PaceTable.propTypes = {
    setSubrange:PropTypes.func.isRequired,
    toggleMapRange:PropTypes.func.isRequired,
    activityData:PropTypes.object,
    activityStream:PropTypes.object,
    analysisInterval:PropTypes.number
};

const mapStateToProps = (state) =>
    ({
        activityData: state.strava.activityData,
        activityStream: state.strava.activityStream,
        analysisInterval: state.strava.analysisInterval
    });

const mapDispatchToProps = {
    setSubrange, toggleMapRange
};

export default connect(mapStateToProps,mapDispatchToProps)(PaceTable);
