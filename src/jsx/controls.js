import {Alert, Button, Row, Col,
    Container, Input, Label, Card, CardBody,
    Form, CardTitle} from 'reactstrap';
import {Icon} from '@blueprintjs/core';
import React, {Component} from 'react';
import MediaQuery from 'react-responsive';
import ControlTable from './controlTable';
import {Spinner} from '@blueprintjs/core';
import ErrorBoundary from './errorBoundary';
import PropTypes from 'prop-types';
import {addControl, toggleDisplayBanked, toggleMetric, toggleStravaAnalysis} from './actions/actions';
import {connect} from 'react-redux';
import FinishTime from './ui/finishTime';
import StravaRoute from './ui/stravaRoute';
import AnalysisInterval from './ui/analysisInterval';

class ControlPoints extends Component {

    static propTypes = {
        metric: PropTypes.bool.isRequired,
        strava_error: PropTypes.string,
        hasStravaData:PropTypes.bool.isRequired,
        forecastValid:PropTypes.bool.isRequired,
        name:PropTypes.string,
        addControl:PropTypes.func.isRequired,
        toggleStravaAnalysis:PropTypes.func.isRequired,
        toggleMetric:PropTypes.func.isRequired,
        displayBanked:PropTypes.bool.isRequired,
        fetchingFromStrava:PropTypes.bool,
        toggleDisplayBanked:PropTypes.func.isRequired,
        stravaAnalysis: PropTypes.bool.isRequired
    };

    constructor(props) {
        super(props);
        this.addControl = this.addControl.bind(this);
        this.hideStravaErrorAlert = this.hideStravaErrorAlert.bind(this);
        this.state = {
            stravaAlertVisible: false, stravaError: this.props.strava_error
        };
    }

    static showProgressSpinner(running) {
        if (running) {
            return (
                <Spinner/>
            );
        }
    }

    hideStravaErrorAlert() {
        this.setState({stravaError:null, stravaAlertVisible:false});
    }

    componentWillReceiveProps(newProps) {
        if (newProps.strava_error !== undefined) {
            this.setState({stravaError:newProps.strava_error,stravaAlertVisible:true});
        }
    }

    addControl( ) {
        this.props.addControl();
    }

    render () {
        const title = this.props.name === '' ?
            (<div style={{textAlign:"center"}}>Control point list</div>) :
            (<div style={{textAlign:"center"}}>Control point list for <i>{this.props.name}</i></div>);
        const showAnalysisInterval = this.props.hasStravaData && this.props.stravaAnalysis;
        return (
            <div className="controlPoints">
                <Container fluid={true}>
                    <Row>
                        <Col sm={{size:'auto'}}>
                            <Button size='sm' tabIndex='10' onClick={this.addControl} id='addButton'><Icon iconName="add"/>Add control point</Button>
                        </Col>
                        <Col sm="3">
                            <FinishTime/>
                        </Col>
                        <Col sm={{size:"auto"}}>
                            <Label size='sm' for='metric'>metric</Label>
                        </Col>
                        <Col>
                            <Input id='metric' type='checkbox' tabIndex='12' checked={this.props.metric} onClick={this.props.toggleMetric}/>
                        </Col>
                        <Col sm={{size:"auto"}}>
                            <Label for='banked' size="sm">Display banked time</Label>
                        </Col>
                        <Col>
                            <Input id='banked' type='checkbox' tabIndex='11' checked={this.props.displayBanked}
                                      onClick={this.props.toggleDisplayBanked}/>
                        </Col>
                        <Col sm={{size:"auto"}}>
                            <Label for='analysis' size='sm'>Compare</Label>
                        </Col>
                        <Col>
                            <Input id='analysis' type='checkbox' tabIndex="13" checked={this.props.stravaAnalysis} disabled={!this.props.forecastValid}
                                   onClick={this.props.toggleStravaAnalysis} />
                            <ErrorBoundary>
                                <StravaRoute/>
                                <AnalysisInterval visible={showAnalysisInterval}/>
                                {this.state.stravaAlertVisible?<Alert onDismiss={this.hideStravaErrorAlert} bsStyle='warning'>{this.state.stravaError}</Alert>:null}
                                {ControlPoints.showProgressSpinner(this.props.fetchingFromStrava)}
                            </ErrorBoundary>
                        </Col>
                    </Row>
                </Container>
                <ErrorBoundary>
                    <MediaQuery minDeviceWidth={1000}>
                        <Card style={{margin:'10px'}}>
                            <CardBody>
                                <CardTitle className="cpListTitle" tag='h6'>{title}</CardTitle>
                                <ErrorBoundary>
                                    <ControlTable/>
                                </ErrorBoundary>
                            </CardBody>
                        </Card>
                    </MediaQuery>
                    <MediaQuery maxDeviceWidth={800}>
                                <ControlTable/>
                    </MediaQuery>
                </ErrorBoundary>
                <div tabIndex="98" onFocus={() => {document.getElementById('addButton').focus()}}/>
            </div>
        );
    }
}

const mapStateToProps = (state) =>
    ({
        metric: state.controls.metric,
        calculatedValues: state.controls.calculatedValues,
        name: state.routeInfo.name,
        strava_error: state.strava.error,
        displayBanked: state.controls.displayBanked,
        stravaAnalysis: state.controls.stravaAnalysis,
        fetchingFromStrava: state.strava.fetching,
        forecastValid: state.forecast.valid,
        hasStravaData: state.strava.activityData !== null
    });

const mapDispatchToProps = {
    toggleMetric, toggleDisplayBanked, toggleStravaAnalysis, addControl
};

export default connect(mapStateToProps, mapDispatchToProps)(ControlPoints);
