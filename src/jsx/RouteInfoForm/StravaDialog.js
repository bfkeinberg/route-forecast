import { Button, PopoverHeader, PopoverBody, Alert } from 'reactstrap';
import React, { Component } from 'react';
import ErrorBoundary from '../errorBoundary';
import { Spinner } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import StravaRouteIdInput from './StravaRouteIdInput';
import StravaAnalysisIntervalInput from './StravaAnalysisIntervalInput';
import { toggleStravaAnalysis } from '../actions/actions';
import { connect } from 'react-redux';

class StravaDialog extends Component {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
        this.state = {
            stravaAlertVisible: false,
            mounted: false
        };
    }

    static propTypes = {
        strava_error: PropTypes.string,
        fetchingFromStrava:PropTypes.bool,
        stravaAnalysis: PropTypes.bool.isRequired,
        toggleStravaAnalysis: PropTypes.func.isRequired
    };

    static showProgressSpinner(running) {
        if (running) {
            return (
                <Spinner/>
            );
        }
    }

    componentDidMount() {
        this.setState({mounted:true});
    }

    static getDerivedStateFromProps(newProps, prevState) {
        if (newProps.strava_error !== null && newProps.strava_error !== '') {
            return {...prevState, stravaAlertVisible:true};
        }
        return null;
    }

    toggle() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    }

    render() {
        return (
            <ErrorBoundary>
                <PopoverHeader className={'stravaDialogTitle'}>Analyze with Strava</PopoverHeader>
                <PopoverBody>
                    <StravaRouteIdInput/>
                    <StravaAnalysisIntervalInput visible={true}/>
                    <Alert isOpen={this.state.stravaAlertVisible}  color='warning'>{this.props.strava_error}</Alert>
                    {StravaDialog.showProgressSpinner(this.props.fetchingFromStrava)}
                </PopoverBody>
            </ErrorBoundary>
        );
    }
}

const mapStateToProps = (state) =>
    ({
        strava_error: state.strava.errorDetails,
        stravaAnalysis: state.controls.stravaAnalysis,
        fetchingFromStrava: state.strava.fetching
    });

const mapDispatchToProps = {
    toggleStravaAnalysis
};

export default connect(mapStateToProps, mapDispatchToProps)(StravaDialog);

