import React, {Component} from 'react';
import {Table} from 'reactstrap';
import ErrorBoundary from "./errorBoundary";
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import 'animate.css/animate.min.css';
import {setSubrange} from './actions/actions';

class PaceTable extends Component {
    static propTypes = {
        calculatedPaces:PropTypes.arrayOf(PropTypes.shape({
            distance:PropTypes.number.isRequired,
            time:PropTypes.string.isRequired,
            pace:PropTypes.number,
            alphaPace:PropTypes.string.isRequired,
            climb:PropTypes.number
        })).isRequired,
        setSubrange:PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.expandTable = this.expandTable.bind(this);
        this.updateSubrange = this.updateSubrange.bind(this);
        this.state = {};
    }

    updateSubrange(event) {
        this.props.setSubrange(event.currentTarget.getAttribute('start'),event.currentTarget.getAttribute('end'));
    }

    expandTable(paces) {
        return (
            <tbody>
            {paces.map((pace) =>
                <tr key={pace.distance+Math.random().toString(10)} start={pace.start} end={pace.end} onClick={this.updateSubrange}>
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
                    <Table striped responsive hover bordered>
                        <thead>
                        <tr>
                            <th style={{'fontSize':'80%'}}>Time</th>
                            <th style={{'fontSize':'80%'}}>Pace</th>
                            <th style={{'fontSize':'80%'}}>WW Pace</th>
                            <th style={{'fontSize':'80%'}}>Distance</th>
                            <th style={{'fontSize':'80%'}}>Climb</th>
                        </tr>
                        </thead>
                        {this.expandTable(this.props.calculatedPaces)}
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

const mapDispatchToProps = {
    setSubrange
};

export default connect(mapStateToProps,mapDispatchToProps)(PaceTable);