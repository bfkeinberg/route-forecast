import React, { useState } from 'react';
import { Table, UncontrolledTooltip } from 'reactstrap';
import ErrorBoundary from "../shared/ErrorBoundary";
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import 'animate.css/animate.min.css';
import { setSubrange, toggleMapRange } from '../../redux/actions';
import stravaRouteParser from '../../utils/stravaRouteParser';
import StravaAnalysisIntervalInput from '../ForecastSettings/StravaAnalysisIntervalInput';
import { useActualPace } from '../../utils/hooks';

const PaceTable = ({activityData, activityStream, analysisInterval, setSubrange, toggleMapRange}) =>  {

    const [selectedRow, setSelectedRow] = useState(null)

    const updateSubrange = (event) => {
        setSubrange(event.currentTarget.getAttribute('start'), event.currentTarget.getAttribute('end'));
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

    const expandTable = (paces) => {
        return (
            <tbody>
            {paces.map((pace) =>
                <tr key={pace.distance+Math.random().toString(10)} start={pace.start} end={pace.end}
                    onClick={toggleRange} onMouseEnter={updateSubrange}>
                    <td>{pace.time}</td>
                    <td>{pace.pace.toFixed(1)}</td>
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
                    <StravaAnalysisIntervalInput />
                    <div id="paceSpan">Overall climb-adjusted pace was {actualPace.toFixed(1)}</div>
                    <Table striped responsive hover bordered>
                        <thead>
                        <tr>
                            <th style={{'fontSize':'80%'}}>Time</th>
                            <th id={'pace'} style={{'fontSize':'80%'}}>Pace</th>
                            <th style={{'fontSize':'80%'}}>WW Pace</th>
                            <th style={{'fontSize':'80%'}}>Distance</th>
                            <th style={{'fontSize':'80%'}}>Climb</th>
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
