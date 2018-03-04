import React, {Component} from 'react';
import {Table} from 'reactstrap';
import ErrorBoundary from "./errorBoundary";
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import 'animate.css/animate.min.css';

class PaceTable extends Component {
    static propTypes = {
        calculatedPaces:PropTypes.arrayOf(PropTypes.shape({
            distance:PropTypes.number.isRequired,
            time:PropTypes.string.isRequired,
            pace:PropTypes.string,
            alphaPace:PropTypes.string.isRequired,
            climb:PropTypes.number
        })).isRequired
    };

    constructor(props) {
        super(props);
        this.state = {};
    }

    static expandTable(paces) {
        return (
            <tbody>
            {paces.map((pace) =>
                <tr key={pace.distance+Math.random().toString(10)}>
                    <td>{pace.time}</td>
                    <td>{pace.pace.toFixed(1)}</td>
                    <td>{pace.alphaPace}</td>
                    <td>{pace.distance.toFixed(0)}</td>
                    <td>{pace.climb.toFixed(0)}</td>
                </tr>
            )}
            </tbody>
        );
    }

    render() {
        return (
                <div className="animated slideInRight">
                    <ErrorBoundary>
                    <Table striped condensed hover bordered>
                        <thead>
                        <tr>
                            <th style={{'fontSize':'80%'}}>Time</th>
                            <th style={{'fontSize':'80%'}}>Pace</th>
                            <th style={{'fontSize':'80%'}}>WW Pace</th>
                            <th style={{'fontSize':'80%'}}>Distance</th>
                            <th style={{'fontSize':'80%'}}>Climb</th>
                        </tr>
                        </thead>
                        {PaceTable.expandTable(this.props.calculatedPaces)}
                    </Table>
                    </ErrorBoundary>
                </div>
        );
    }
}

const mapStateToProps = (state) =>
    ({
        calculatedPaces: state.strava.calculatedPaces
    });

export default connect(mapStateToProps)(PaceTable);