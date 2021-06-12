import React, {Component} from 'react';
import {Table, UncontrolledTooltip} from 'reactstrap';
import ErrorBoundary from "./errorBoundary";
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import 'animate.css/animate.min.css';
import {setSubrange,toggleMapRange} from './actions/actions';

class PaceTable extends Component {
    static propTypes = {
        calculatedPaces:PropTypes.arrayOf(PropTypes.shape({
            distance:PropTypes.number.isRequired,
            time:PropTypes.string.isRequired,
            pace:PropTypes.number,
            alphaPace:PropTypes.string.isRequired,
            climb:PropTypes.number,
            stoppedTime:PropTypes.number
        })).isRequired,
        setSubrange:PropTypes.func.isRequired,
        toggleMapRange:PropTypes.func.isRequired,
        actualPace:PropTypes.number.isRequired
    };

    constructor(props) {
        super(props);
        this.expandTable = this.expandTable.bind(this);
        this.state = {};
    }

    updateSubrange = (event) => {
        this.props.setSubrange(event.currentTarget.getAttribute('start'),event.currentTarget.getAttribute('end'));
    };

    toggleRange = (event) => {
        const start = parseInt(event.currentTarget.getAttribute('start'));
        this.props.toggleMapRange(start, parseInt(event.currentTarget.getAttribute('end')));
        if (this.state.selectedRow === start) {
            this.setState({selectedRow: null});
        } else {
            this.setState({selectedRow:start});
        }
    };

    expandTable(paces) {
        return (
            <tbody>
            {paces.map((pace) =>
                <tr key={pace.distance+Math.random().toString(10)} start={pace.start} end={pace.end}
                    onClick={this.toggleRange} onMouseEnter={this.updateSubrange}>
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

    render() {
        return (
                <div className="animated slideInRight">
                    <ErrorBoundary>
                        <div id="paceSpan">Overall climb-adjusted pace was {this.props.actualPace.toFixed(1)}</div>
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
                            {this.expandTable(this.props.calculatedPaces)}
                        </Table>
                    </ErrorBoundary>
                    <UncontrolledTooltip placement={'top'} target={'pace'}>Pace is average speed adjusted for climb</UncontrolledTooltip>
                </div>
        );
    }
}

const mapStateToProps = (state) =>
    ({
        calculatedPaces: state.strava.calculatedPaces,
        actualPace: state.strava.actualPace
    });

const mapDispatchToProps = {
    setSubrange, toggleMapRange
};

export default connect(mapStateToProps,mapDispatchToProps)(PaceTable);
