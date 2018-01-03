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

class ControlPoints extends Component {

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

    updateActualValues(controlPoints,finishTime) {
        this.props.updateControls(controlPoints,this.state.metric);
        this.props.setActualFinishTime(finishTime);
    }

    updateProgress(isUpdating) {
        this.setState({isUpdating:isUpdating});
    }

    hideStravaErrorAlert() {
        this.setState({stravaError:null, stravaAlertVisible:false});
    }

    stravaErrorCallback(error) {
        this.setState({stravaError:error,stravaAlertVisible:true,isUpdating:false});
    }

    async getStravaParser() {
        const parser = await import(/* webpackChunkName: "StravaRouteParser" */ './stravaRouteParser');
        return parser.default;
    }

    setStravaActivity(value) {
        let newValue = parseInt(RouteInfoForm.getRouteNumberFromValue(value), 10);
        if (Number.isNaN(newValue)) {
            return;
        }
        this.setState({strava_activity:newValue});
    }

    computeTimesFromStrava(activity, controlPoints) {
        if (this.stravaParser === undefined) {
            this.getStravaParser().then( stravaParser => {
                this.stravaParser = new stravaParser(this.updateActualValues, this.updateProgress);
                this.stravaParser.setToken(this.props.strava_token);
                this.stravaParser.computeActualTimes(activity, controlPoints, this.stravaErrorCallback);
            });
        } else {
            this.stravaParser.setToken(this.props.strava_token);
            this.stravaParser.computeActualTimes(activity, controlPoints, this.stravaErrorCallback);
        }
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

    toggleDisplayBanked(event) {
        this.setState({displayBankedTime:!this.state.displayBankedTime});
    }

    toggleMetric(event) {
        let metric = !this.state.metric;
        this.setState({metric:metric});
        this.props.updateControls(this.props.controlPoints,metric);
    }

    toggleCompare(event) {
        let lookback = !this.state.lookback;
        this.setState({lookback:lookback});
    }

    updateFromTable(controlPoints) {
        this.props.updateControls(controlPoints,this.state.metric);
    }

    doControlsMatch(newControl,oldControl) {
        return newControl.distance===oldControl.distance &&
            newControl.name===oldControl.name &&
            newControl.duration===oldControl.duration &&
            newControl.arrival===oldControl.arrival &&
            newControl.actual===oldControl.actual &&
            newControl.banked===oldControl.banked;
    }

    shouldComponentUpdate(nextProps,newState) {
        let controlPoints = this.props.controlPoints;
        if (newState.displayBankedTime !== this.state.displayBankedTime ||
                newState.lookback !== this.state.lookback ||
                nextProps.controlPoints.length !== controlPoints.length ||
                !nextProps.controlPoints.every((v, i)=> this.doControlsMatch(v,controlPoints[i])) ||
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
    }

    render () {
        const title = this.props.name === '' ?
            ( <h3 style={{textAlign:"center"}}>Control point list</h3> ) :
            ( <h3 style={{textAlign:"center"}}>Control point list for <i>{this.props.name}</i></h3> );
        return (
            <div className="controlPoints">
                <ButtonToolbar style={{display:'inline-flex',flexDirection:'row', paddingTop:'11px',paddingLeft:'4px'}}>
                {/*<ButtonGroup style={{display:'flex',flexFlow:'row wrap'}}>*/}
                    <ButtonGroup>
                        <Button tabIndex='10' onClick={this.addControl} id='addButton'><Glyphicon glyph="plus-sign"></Glyphicon>Add control point</Button>
                        {/*<Button onClick={this.addControl} id='addButton' style={{display:'inline-flex',width:'165px',height:'34px'}}><Glyphicon glyph="plus-sign"></Glyphicon>Add control point</Button>*/}
                        <FormGroup controlId="finishTime" style={{display:'inline-flex'}}>
                            <ControlLabel style={{width:'7em',display:'inline-flex',marginTop:'7px',paddingLeft:'8px'}}>Finish time</ControlLabel>
                            <FormControl tabIndex='-1' type="text" onMouseEnter={this.changeDisplayFinishTime} onMouseLeave={this.changeDisplayFinishTime}
                                         style={{display:'inline-flex',width:'12em',marginTop:'3px',marginBotton:'0px',paddingLeft:'2px',paddingTop:'2px',height:'28px'}}
                                         value={this.state.displayedFinishTime}/>
                        </FormGroup>
                        <Checkbox tabIndex='12' checked={this.state.metric} inline
                                  onClick={this.toggleMetric} onChange={this.toggleMetric}
                                  style={{padding:'0px 0px 0px 26px',display:'inline-flex'}}>metric</Checkbox>
                        <Checkbox tabIndex='11' checked={this.state.displayBankedTime} inline
                                  onChange={this.toggleDisplayBanked} onClick={this.toggleDisplayBanked}
                                  style={{padding:'0px 0px 0px 24px', display:'inline-flex'}}>Display banked time</Checkbox>
                        <Checkbox tabIndex="13" disabled={!this.props.forecastValid} checked={this.state.lookback} inline onChange={this.toggleCompare} onClick={this.toggleCompare} style={{display:'inline-flex'}}>Compare</Checkbox>
                        <ErrorBoundary>
                            <FormGroup controlId="actualRide" style={{visibility:this.state.lookback ? null : 'hidden', display:'inline-flex'}}>
                                <ControlLabel style={{display:'inline-flex'}}>Strava</ControlLabel>
                                <FormControl tabIndex='-1' type="text" style={{display:'inline-flex'}}
                                             onDrop={event => {
                                                 let dt = event.dataTransfer;
                                                 if (dt.items) {
                                                     for (let i=0; i < dt.items.length; i++) {
                                                         if (dt.items[i].kind === 'string') {
                                                             event.preventDefault();
                                                             dt.items[i].getAsString(value => {
                                                                 this.setStravaActivity(value);
                                                                 this.updateExpectedTimes(this.state.strava_activity);
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
                                                     for (let i = 0; i < dt.items.length; i++) {
                                                         dt.items.remove(i);
                                                     }
                                                 }
                                             }}
                                             value={this.state.strava_activity} onChange={event => {this.setStravaActivity(event.target.value)}}
                                             onBlur={event => {this.updateExpectedTimes(this.state.strava_activity)}}/>
                            </FormGroup>
                            {this.state.stravaAlertVisible?<Alert onDismiss={this.hideStravaErrorAlert} bsStyle='warning'>{this.state.stravaError}</Alert>:null}
                            {ControlPoints.showProgressSpinner(this.state.isUpdating)}
                        </ErrorBoundary>
                    </ButtonGroup>
                </ButtonToolbar>

                <ErrorBoundary>
                    <MediaQuery minDeviceWidth={1000}>
                        <Panel header={title} bsStyle="info" style={{margin:'10px'}}>
                            <ErrorBoundary>
                                <ControlTable rows={this.props.controlPoints.length} controls={this.props.controlPoints}
                                              displayBanked={this.state.displayBankedTime} compare={this.state.lookback} update={this.updateFromTable} ref={(table) => {this.table = table;}}/>
                            </ErrorBoundary>
                        </Panel>
                    </MediaQuery>
                    <MediaQuery maxDeviceWidth={800}>
                                <ControlTable rows={this.props.controlPoints.length} controls={this.props.controlPoints}
                                              displayBanked={this.state.displayBankedTime} compare={this.state.lookback} update={this.updateFromTable} ref={(table) => {this.table = table;}}/>
                    </MediaQuery>
                </ErrorBoundary>
                <div tabIndex="98" onFocus={event => {document.getElementById('addButton').focus()}}></div>
            </div>
        );
    }
}

export default ControlPoints;