import {
    Alert,
    Button,
    ButtonGroup,
    ButtonToolbar,
    Checkbox,
    ControlLabel,
    FormControl,
    FormGroup,
    Glyphicon,
    Panel
} from 'react-bootstrap';
import React, {Component} from 'react';
import MediaQuery from 'react-responsive';
import ControlTable from './controlTable';
import {Spinner} from '@blueprintjs/core';
import RouteInfoForm from "./routeInfoEntry";
import ErrorBoundary from './errorBoundary';
import PropTypes from 'prop-types';
import {
    beginStravaFetch,
    setActualFinishTime,
    setStravaActivity,
    setStravaError,
    stravaFetchSuccess,
    toggleDisplayBanked,
    toggleMetric,
    toggleStravaAnalysis,
    updateControls
} from './actions/actions';
import {connect} from 'react-redux';

class ControlPoints extends Component {

    static propTypes = {
        metric: PropTypes.bool.isRequired,
        strava_token: PropTypes.string,
        controlPoints: PropTypes.arrayOf(PropTypes.object).isRequired,
        finishTime: PropTypes.string.isRequired,
        strava_error: PropTypes.string,
        setActualPace:PropTypes.func.isRequired,
        setActualFinishTime:PropTypes.func.isRequired,
        strava_activity:PropTypes.number,
        actualFinishTime:PropTypes.string,
        updateControls:PropTypes.func.isRequired,
        forecastValid:PropTypes.bool.isRequired,
        name:PropTypes.string
    };

    static contextTypes = {
        store: PropTypes.object
    };

    constructor(props) {
        super(props);
        this.addControl = this.addControl.bind(this);
        this.updateFromTable = this.updateFromTable.bind(this);
        this.toggleDisplayBanked = this.toggleDisplayBanked.bind(this);
        this.toggleMetric = this.toggleMetric.bind(this);
        this.toggleCompare = this.toggleCompare.bind(this);
        this.updateExpectedTimes = this.updateExpectedTimes.bind(this);
        this.stravaErrorCallback = this.stravaErrorCallback.bind(this);
        this.hideStravaErrorAlert = this.hideStravaErrorAlert.bind(this);
        this.setStravaActivity = this.setStravaActivity.bind(this);
        this.updateProgress = this.updateProgress.bind(this);
        this.updateActualValues = this.updateActualValues.bind(this);
        this.changeDisplayFinishTime = this.changeDisplayFinishTime.bind(this);
        this.computeTimesFromStrava = this.computeTimesFromStrava.bind(this);
        this.state = {
            displayBankedTime : false, metric:this.props.metric, lookback:this.props.strava_activity!==undefined,
            stravaAlertVisible: false, stravaError: this.props.strava_error, displayedFinishTime:this.props.finishTime,
            strava_activity: this.props.strava_activity===undefined?' ':this.props.strava_activity, isUpdating:false
        };
    }

    static showProgressSpinner(running) {
        if (running) {
            return (
                <Spinner/>
            );
        }
    }

    changeDisplayFinishTime(event) {
        if (event.type === 'mouseenter' && this.props.actualFinishTime !== undefined) {
            this.setState({displayedFinishTime:this.props.actualFinishTime});
        }
        if (event.type === 'mouseleave') {
            this.setState({displayedFinishTime:this.props.finishTime});
        }
    }

    updateActualValues(controlPoints,finishTime,pace) {
        this.props.updateControls(controlPoints);
        this.props.setActualFinishTime(finishTime);
        this.props.setActualPace(pace);
    }

    updateProgress(isUpdating) {
        if (isUpdating) {
            this.props.beginStravaFetch();
        }
        else {
            this.props.stravaFetchSuccess('');
        }
        // this.setState({isUpdating:isUpdating});
    }

    hideStravaErrorAlert() {
        this.setState({stravaError:null, stravaAlertVisible:false});
    }

    stravaErrorCallback(error) {
        this.props.setStravaError(error);
        this.setState({stravaError:error,stravaAlertVisible:true,isUpdating:false});
    }

    static async getStravaParser() {
        const parser = await import(/* webpackChunkName: "StravaRouteParser" */ './stravaRouteParser');
        return parser.default;
    }

    setStravaActivity(value) {
        let newValue = parseInt(RouteInfoForm.getRouteNumberFromValue(value), 10);
        if (Number.isNaN(newValue)) {
            return;
        }
        this.props.setStravaActivity(newValue);
        // this.setState({strava_activity:newValue});
    }

    async computeTimesFromStrava(activity, controlPoints) {
        const StravaParser = await ControlPoints.getStravaParser();
        const stravaParser = new StravaParser(this.updateActualValues, this.updateProgress);
        stravaParser.computeActualTimes(activity, controlPoints, this.props.stravaToken).then( result => console.log(result),
            error => this.stravaErrorCallback(error));
    }

    updateExpectedTimes(value) {
        let newValue = parseInt(value,10);
        if (isNaN(newValue)) {
            return;
        }
        this.computeTimesFromStrava(newValue,this.props.controlPoints);
    }

    componentWillReceiveProps(newProps) {
        if (newProps.strava_activity !== undefined && newProps.strava_activity !== '') {
            this.setState({strava_activity:newProps.strava_activity});
            this.computeTimesFromStrava(newProps.strava_activity, newProps.controlPoints);
        }
        if (newProps.strava_error !== undefined) {
            this.setState({stravaError:newProps.strava_error});
        }
        if (newProps.finishTime !== this.props.finishTime) {
            this.setState({'displayedFinishTime':newProps.finishTime});
        }
    }

    addControl( ) {
        this.table.addRow();
    }

    toggleDisplayBanked() {
        this.props.toggleDisplayBanked();
        // this.setState({displayBankedTime:!this.state.displayBankedTime});
    }

    toggleMetric() {
        this.props.toggleMetric();
/*
        let metric = !this.state.metric;
        this.setState({metric:metric});
        this.props.updateControls(this.props.controlPoints,metric);
*/
    }

    toggleCompare() {
        this.props.toggleStravaAnalysis();
        // let lookback = !this.state.lookback;
        // this.setState({lookback:lookback});
    }

    updateFromTable(controlPoints) {
        this.props.updateControls(controlPoints);
    }

    static doControlsMatch(newControl, oldControl) {
        return newControl.distance===oldControl.distance &&
            newControl.name===oldControl.name &&
            newControl.duration===oldControl.duration &&
            newControl.arrival===oldControl.arrival &&
            newControl.actual===oldControl.actual &&
            newControl.banked===oldControl.banked;
    }

/*    shouldComponentUpdate(nextProps,newState) {
        let controlPoints = this.props.controlPoints;
        if (newState.displayBankedTime !== this.state.displayBankedTime ||
                newState.lookback !== this.state.lookback ||
                nextProps.controlPoints.length !== controlPoints.length ||
                !nextProps.controlPoints.every((v, i)=> ControlPoints.doControlsMatch(v,controlPoints[i])) ||
                newState.metric !== this.state.metric ||
                newState.strava_activity !== this.state.strava_activity ||
                newState.stravaError !== this.state.stravaError ||
                newState.isUpdating !== this.state.isUpdating ||
                newState.displayedFinishTime !== this.state.displayedFinishTime ||
                nextProps.finishTime !== this.props.finishTime ||
                nextProps.forecastValid !== this.props.forecastValid
        ) {
            return true;
        }
        return false;
    }*/

    render () {
        const title = this.props.name === '' ?
            ( <h3 style={{textAlign:"center"}}>Control point list</h3> ) :
            ( <h3 style={{textAlign:"center"}}>Control point list for <i>{this.props.name}</i></h3> );
        return (
            <div className="controlPoints">
                <ButtonToolbar style={{display:'inline-flex',flexDirection:'row', paddingTop:'11px',paddingLeft:'4px'}}>
                {/*<ButtonGroup style={{display:'flex',flexFlow:'row wrap'}}>*/}
                    <ButtonGroup>
                        <Button tabIndex='10' onClick={this.addControl} id='addButton'><Glyphicon glyph="plus-sign"/>Add control point</Button>
                        {/*<Button onClick={this.addControl} id='addButton' style={{display:'inline-flex',width:'165px',height:'34px'}}><Glyphicon glyph="plus-sign"></Glyphicon>Add control point</Button>*/}
                        <FormGroup controlId="finishTime" style={{display:'inline-flex'}}>
                            <ControlLabel style={{width:'7em',display:'inline-flex',marginTop:'7px',paddingLeft:'8px'}}>Finish time</ControlLabel>
                            <FormControl tabIndex='-1' type="text" onMouseEnter={this.changeDisplayFinishTime} onMouseLeave={this.changeDisplayFinishTime}
                                         style={{display:'inline-flex',width:'12em',marginTop:'3px',marginBotton:'0px',paddingLeft:'2px',paddingTop:'2px',height:'28px'}}
                                         value={this.state.displayedFinishTime}/>
                        </FormGroup>
                        <Checkbox tabIndex='12' checked={this.props.metric} inline
                                  onClick={this.toggleMetric} onChange={this.toggleMetric}
                                  style={{padding:'0px 0px 0px 26px',display:'inline-flex'}}>metric</Checkbox>
                        <Checkbox tabIndex='11' checked={this.state.displayBankedTime} inline
                                  onChange={this.toggleDisplayBanked} onClick={this.toggleDisplayBanked}
                                  style={{padding:'0px 0px 0px 24px', display:'inline-flex'}}>Display banked time</Checkbox>
                        <Checkbox tabIndex="13" checked={this.props.stravaAnalysis} disabled={!this.props.forecastValid} inline onChange={this.toggleCompare}
                                  onClick={this.toggleCompare} style={{visibility:this.props.stravaAnalysis ? null : 'hidden', display:'inline-flex'}}>Compare</Checkbox>
                        <ErrorBoundary>
                            <FormGroup controlId="actualRide" style={{display:'inline-flex'}}>
                                <ControlLabel style={{display:'inline-flex'}}>Strava</ControlLabel>
                                <FormControl tabIndex='-1' type="text" style={{display:'inline-flex'}}
                                             onDrop={event => {
                                                 let dt = event.dataTransfer;
                                                 if (dt.items) {
                                                     for (let i=0;i < dt.items.length;i++) {
                                                         if (dt.items[i].kind === 'string') {
                                                             event.preventDefault();
                                                             dt.items[i].getAsString(value => {
                                                                 this.setStravaActivity(value);
                                                                 this.updateExpectedTimes(this.props.strava_activity);
                                                             });
                                                         } else {
                                                             console.log('vetoing drop of',i,dt.items[i].kind);
                                                             return false;
                                                         }
                                                     }
                                                 }
                                             }}
                                             onDragOver={event => {
                                                 event.preventDefault();
                                                 event.dataTransfer.dropEffect = 'move';
                                             }}
                                             onDragEnd={event => {
                                                 let dt = event.dataTransfer;
                                                 if (dt.items) {
                                                     // Use DataTransferItemList interface to remove the drag data
                                                     for (let i = 0;i < dt.items.length;i++) {
                                                         dt.items.remove(i);
                                                     }
                                                 }
                                             }}
                                             value={this.props.strava_activity} onChange={event => {this.setStravaActivity(event.target.value)}}
                                             onBlur={() => {this.updateExpectedTimes(this.props.strava_activity)}}/>
                            </FormGroup>
                            {this.state.stravaAlertVisible?<Alert onDismiss={this.hideStravaErrorAlert} bsStyle='warning'>{this.state.stravaError}</Alert>:null}
                            {ControlPoints.showProgressSpinner(this.props.fetchingFromStrava)}
                        </ErrorBoundary>
                    </ButtonGroup>
                </ButtonToolbar>

                <ErrorBoundary>
                    <MediaQuery minDeviceWidth={1000}>
                        <Panel header={title} bsStyle="info" style={{margin:'10px'}}>

                            <ErrorBoundary>
                                <ControlTable rows={this.props.controlPoints.length} controls={this.props.controlPoints}
                                              displayBanked={this.props.displayBanked} compare={this.props.stravaAnalysis} update={this.updateFromTable} ref={(table) => {this.table = table;}}/>
                            </ErrorBoundary>

                        </Panel>
                    </MediaQuery>
                    <MediaQuery maxDeviceWidth={800}>
                                <ControlTable rows={this.props.controlPoints.length} controls={this.props.controlPoints}
                                              displayBanked={this.props.displayBanked} compare={this.props.stravaAnalysis} update={this.updateFromTable} ref={(table) => {this.table = table;}}/>
                    </MediaQuery>
                </ErrorBoundary>
                <div tabIndex="98" onFocus={() => {document.getElementById('addButton').focus()}}/>
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) =>
    ({
        metric: state.controls.metric,
        controlPoints: state.controls.controlPoints,
        finishTime: state.routeInfo.finishTime,
        name: state.routeInfo.name,
        actualFinishTime: state.strava.actualFinishTime,
        stravaToken: state.strava.token,
        strava_error: state.strava.error,
        strava_activity: state.strava.activity,
        displayBanked: state.controls.displayBanked,
        stravaAnalysis: state.controls.stravaAnalysis,
        fetchingFromStrava: state.strava.fetching
    });

const mapDispatchToProps = {
    updateControls, toggleMetric, setStravaActivity, setActualFinishTime, setStravaError, beginStravaFetch,
    toggleDisplayBanked, stravaFetchSuccess, toggleStravaAnalysis
};

export const doControlsMatch = ControlPoints.doControlsMatch;
export default connect(mapStateToProps, mapDispatchToProps)(ControlPoints);
