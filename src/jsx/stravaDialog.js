import {Button, Popover, PopoverHeader, PopoverBody, Alert} from 'reactstrap';
import React, {Component} from 'react';
import ErrorBoundary from './errorBoundary';
import {Spinner} from '@blueprintjs/core';
import PropTypes from 'prop-types';
import StravaRoute from './ui/stravaRoute';
import AnalysisInterval from './ui/analysisInterval';
import {toggleStravaAnalysis,getPaceOverTime} from './actions/actions';
import {connect} from 'react-redux';

class StravaDialog extends Component {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
        this.state = {
            stravaAlertVisible: false
        };
    }

    static propTypes = {
        strava_error: PropTypes.string,
        showAnalysisInterval:PropTypes.bool.isRequired,
        fetchingFromStrava:PropTypes.bool,
        stravaAnalysis: PropTypes.bool.isRequired,
        toggleStravaAnalysis: PropTypes.func.isRequired,
        getPaceOverTime: PropTypes.func.isRequired,
        disableAnalysis:PropTypes.bool.isRequired
    };

    static showProgressSpinner(running) {
        if (running) {
            return (
                <Spinner/>
            );
        }
    }

    componentWillReceiveProps(newProps) {
        if (newProps.strava_error !== null) {
            this.setState({stravaAlertVisible:true});
        }
    }

    toggle() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    }

    render() {
        return (
            <ErrorBoundary>
                <Popover id='analysisControls' target='enableAnalysis' /*onClick={this.props.toggleStravaAnalysis}*/
                         size="sm" isOpen={this.props.stravaAnalysis} placement='auto-end' hideArrow={true}
                         delay={{show:0,hide:2}}>
                    <PopoverHeader className={'stravaDialogTitle'}>Analyze with Strava</PopoverHeader>
                    <PopoverBody>
                        <StravaRoute/>
                        <AnalysisInterval visible={true}/>
                        <Button disabled={this.props.disableAnalysis} outline onClick={this.props.getPaceOverTime}>Perform analysis</Button>
                        <Alert isOpen={this.state.stravaAlertVisible}  color='warning'>{this.props.strava_error}</Alert>
                        {StravaDialog.showProgressSpinner(this.props.fetchingFromStrava)}
                    </PopoverBody>
                </Popover>
            </ErrorBoundary>
        );
    }
}

const mapStateToProps = (state) =>
    ({
        strava_error: state.strava.errorDetails,
        stravaAnalysis: state.controls.stravaAnalysis,
        fetchingFromStrava: state.strava.fetching,
        disableAnalysis: state.strava.activityData === null
    });

const mapDispatchToProps = {
    toggleStravaAnalysis, getPaceOverTime
};

export default connect(mapStateToProps, mapDispatchToProps)(StravaDialog);

