import { DateTimePicker } from '@blueprintjs/datetime';
import { Position, Popover, Spinner } from '@blueprintjs/core';
import { Panel,FormControl,FormGroup,Form,Glyphicon,Alert,ControlLabel,Button,HelpBlock,Tooltip,OverlayTrigger,Well,InputGroup} from 'react-bootstrap';
import { Checkbox } from 'react-bootstrap';
import moment from 'moment';
import React, { Component } from 'react';
import Flatpickr from 'react-flatpickr'
import AnalyzeRoute from './gpxParser';

require('!style!css!flatpickr/dist/themes/confetti.css');

const paceToSpeed = {'A':10, 'B':12, 'C':14, 'C+':15, 'D-':15, 'D':16, 'D+':17, 'E-':17, 'E':18};

const time_tooltip = (
    <Tooltip id="time_tooltip">When you plan to begin riding</Tooltip>
);

const interval_tooltip = (
    <Tooltip id="interval_tooltip">How often to generate weather forecast</Tooltip>
);

const rwgps_enabled_tooltip = (
    <Tooltip id="rwgps_tooltip">The number for a route on ridewithgps</Tooltip>
);

const rwgps_trip_tooltip = (
    <Tooltip id="trip_tooltip">Ride with GPS has both 'trips' and 'routes'.
        Routes are created with the planner, trips are recorded rides.</Tooltip>
);

const startHour = 7;

class RouteInfoForm extends React.Component {

    constructor(props) {
        super(props);
        this.forecastCb = this.forecastCb.bind(this);
        this.requestForecast = this.requestForecast.bind(this);
        this.disableSubmit = this.disableSubmit.bind(this);
        this.handleDateChange = this.handleDateChange.bind(this);
        this.updateRouteFile = this.updateRouteFile.bind(this);
        this.intervalChanged = this.intervalChanged.bind(this);
        this.handleRwgpsRoute = this.handleRwgpsRoute.bind(this);
        this.handlePaceChange = this.handlePaceChange.bind(this);
        this.setErrorState = this.setErrorState.bind(this);
        this.decideValidationStateFor = this.decideValidationStateFor.bind(this);
        this.setRwgpsRoute = this.setRwgpsRoute.bind(this);
        this.setDateAndTime = this.setDateAndTime.bind(this);
        this.calculateTimeAndDistance = this.calculateTimeAndDistance.bind(this);
        this.controlPoints = [];
        this.forecastRequest = null;
        this.state = {start:RouteInfoForm.findNextStartTime(), pace:'D', interval:1,
            xmlhttp : null, routeFileSet:false,rwgpsRoute:'', errorDetails:null,
            pending:false, parser:new AnalyzeRoute(this.setErrorState),
            paramsChanged:false, rwgpsRouteIsTrip:false, errorSource:null,succeeded:null,routeUpdating:false};
    }

    static findNextStartTime() {
        let now = new Date();
        if (now.getHours() > startHour) {
            now.setDate(now.getDate() + 1);
            now.setHours(startHour);
            now.setMinutes(0);
            now.setSeconds(0);
        }
        return now;
    }

    copyControls(controlPoints) {
        return controlPoints.map(point => {return {distance:point['distance'],duration:point['duration']}});
    }

    compareControls(lastControlPoints,newControlPoints) {
        if (lastControlPoints.length != newControlPoints.length) {
            return false;
        }
        for (let index = 0; index < lastControlPoints.length; ++index) {
            if (lastControlPoints[index]['distance'] != newControlPoints[index]['distance']) {
                return false;
            }
            if (lastControlPoints[index]['duration'] != newControlPoints[index]['duration']) {
                return false;
            }
        }
        return true;
    }

    componentWillReceiveProps(nextProps) {
        let controlsEqual = this.compareControls(this.controlPoints,nextProps.controlPoints);
        if (!controlsEqual && this.state.parser.routeIsLoaded()) {
            this.calculateTimeAndDistance(null);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.paramsChanged) {
            this.setState({paramsChanged:false});
            if (this.state.parser.routeIsLoaded()) {
                this.calculateTimeAndDistance(null);
            }
        }
    }

    updateRouteFile(event) {
        this.setState({routeFileSet : event.target.value != '',routeUpdating:true});
        let fileControl = event.target;
        let gpxFiles = fileControl.files;
        if (gpxFiles.length > 0) {
            this.state.parser.parseRoute(gpxFiles[0]);
            this.setState({rwgpsRoute:''});
        }
    }

    calculateTimeAndDistance() {
        this.controlPoints = this.copyControls(this.props.controlPoints);
        let routeInfo = this.state.parser.walkRoute(moment(this.state.start),-new Date().getTimezoneOffset(),
            this.state.pace, parseFloat(this.state.interval),this.props.controlPoints);
        this.props.updateRouteInfo({bounds:routeInfo['bounds'],points:routeInfo['points'],
            name:routeInfo['name'],finishTime:routeInfo['finishTime']}, routeInfo['controls']);
        this.forecastRequest = routeInfo['forecast'];
    }

    requestForecast(event) {
        if (this.forecastRequest == null) {
            this.calculateTimeAndDistance();
        }
        this.state.xmlhttp = new XMLHttpRequest();
        this.state.xmlhttp.onreadystatechange = this.forecastCb;
        this.state.xmlhttp.responseType = 'json';
        let formdata = new FormData();
        this.state.xmlhttp.open("POST", this.props.action);
        formdata.append('locations',JSON.stringify(this.forecastRequest));
        formdata.append('timezone',-new Date().getTimezoneOffset());
        this.state.xmlhttp.send(formdata);
        this.setState({pending:true});
    }

    forecastCb(event) {
        if (this.state.xmlhttp.readyState == 4) {
            this.setState({pending:false});
            if (event.target.status==200) {
                this.setState({errorDetails:null,succeeded:true});
                if (event.target.response == null) {
                    console.log('missing response');
                    return;
                }
                this.props.updateForecast(event.target.response);
            }
            else {
                if (event.target.response != null) {
                    this.setState({errorDetails:event.target.response['status'],
                        errorCause:this.state.routeFileSet?'gpx':'rwgps', succeeded: false });
                }
                else if (event.target.statusText != null) {
                    this.setState({errorDetails:event.target.statusText,
                        errorCause:this.state.routeFileSet?'gpx':'rwgps',succeeded:false});
                }
            }
        }
    }

    setErrorState(errorDetails,errorSource) {
        if (errorDetails != null) {
            this.setState({errorDetails:errorDetails,errorSource:errorSource,routeUpdating:false});
            if (errorSource=='rwgps') {
                this.setState({rwgpsRoute:'',succeeded:false});
            } else {
                this.setState({routeFileSet:false,succeeded:false})
            }
        } else {
            this.setState({errorDetails:errorDetails,errorSource:null,routeUpdating:false,succeeded:true});
        }
    }

    disableSubmit() {
        return !this.state.parser.routeIsLoaded();
        // return this.state.rwgpsRoute=='' && !this.state.routeFileSet;
    }

    intervalChanged(event) {
        if (event.target.value != '') {
            this.setState({interval:event.target.value,paramsChanged:true});
        }
    }

    handleDateChange(time) {
        this.setState({start:time,paramsChanged:true});
    }

    static showErrorDetails(errorState) {
        if (errorState != null) {
            return (
                <Alert style={{padding:'10px'}} bsStyle="danger">{errorState}</Alert>
            );
        }
    }

    static showProgressSpinner(running) {
        if (running) {
            return (
                <Spinner/>
            );
        }
    }

    handleRwgpsRoute(event) {
        if (event.target.value!='') {
            this.state.parser.loadRwgpsRoute(event.target.value,this.state.rwgpsRouteIsTrip);
            // clear file input to avoid confusion
            document.getElementById('route').value = null;
            this.setState({'routeFileSet':false,'routeUpdating':true});
        } else if (this.state.errorSource=='rwgps') {
            this.setState({'errorSource':null});
        }
    }

    setRwgpsRoute(event) {
        this.setState({rwgpsRoute : event.target.value});
    }

    isNumberKey(evt) {
        var charCode = (evt.which) ? evt.which : event.keyCode;
        if ((charCode < 48 || charCode > 57))
            return false;

        return charCode;
    }

    handlePaceChange(event) {
        this.setState({pace:event.target.value,paramsChanged:true});
    }

    decideValidationStateFor(type) {
        if (type==this.state.errorSource) {
            return 'error';
        }
        else {
            if (this.state.succeeded) {
                if (this.state.routeFileSet && type=='gpx') {
                    return 'success';
                }
                if (this.state.rwgpsRoute && type=='rwgps') {
                    return 'success';
                }
            }
            return null;
        }
    }

    setDateAndTime(dates, datestr, instance) {
        this.setState({start:new Date(dates[0]),paramsChanged:true});
    }

    render() {
        let pace_mph = paceToSpeed[this.state.pace];
        let pace_text = "Represents climb-adjusted pace - current is ".concat(pace_mph);
        let pace_tooltip = ( <Tooltip id="pace_tooltip">{pace_text}</Tooltip> );
        let forecast_tooltip = this.disableSubmit() ? (
            <Tooltip id="forecast_tooltip">Must either upload a gpx file or provide an rwgps route id</Tooltip> ):
            (<Tooltip id="'forecast_tooltip">Request a ride forecast</Tooltip>);
        const now = new Date();
        let later = new Date();
        const daysToAdd = 14;
        later.setDate(now.getDate() + daysToAdd);
        let buttonStyle = this.disableSubmit() ? {pointerEvents : 'none',padding:'14px'} : {padding:'14px'};

        const header = (<div style={{textAlign:"center",'fontSize':'99%'}}>Forecast and time estimate</div>);
        return (
            <Panel header={header}>
                <Form inline id="forecast_form">
                    <FormGroup controlId="starting_time">
                        <OverlayTrigger placement='bottom' overlay={time_tooltip}>
                            <ControlLabel style={{padding:'10px'}}>Starting time</ControlLabel>
                        </OverlayTrigger>
                        <span className="pt-icon-standard pt-icon-calendar"></span>
                        <Flatpickr onChange={this.setDateAndTime} options={{enableTime: true,
                                                altInput: true, altFormat: 'F j, Y h:i K',
                                                altInputClass: 'dateDisplay',
                                                minDate: now,
                                                maxDate: later,
                                                defaultDate: this.state.start,
                                                dateFormat: 'Y-m-d\TH:i'
                                }}/>
                    </FormGroup>
                    <FormGroup bsSize='small' controlId="interval">
                        <ControlLabel style={{padding:'10px'}}>Interval in hours</ControlLabel>
                        <OverlayTrigger placement='bottom' overlay={interval_tooltip}>
                            <FormControl type="number" min={0.5} max={2} step={0.5} name="interval" style={{'width':'5em'}}
                                         value={this.state.interval} onChange={this.intervalChanged}/>
                        </OverlayTrigger>
                     </FormGroup>
                    <FormGroup controlId="pace">
                        <ControlLabel style={{padding:'10px'}}>Pace</ControlLabel>
                        <OverlayTrigger placement="bottom" overlay={pace_tooltip}>
                            <FormControl componentClass="select" value={this.state.pace} name="pace"
                                         style={{'width':'5em','height':'2.8em',paddingRight:'8px'}}
                                         onChange={this.handlePaceChange}>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="C+">C+</option>
                                <option value="D-">D-</option>
                                <option value="D">D</option>
                                <option value="D+">D+</option>
                                <option value="E-">E-</option>
                                <option value="E">E</option>
                            </FormControl>
                        </OverlayTrigger>
                    </FormGroup>
                    <a style={{padding:'10px'}} href="https://westernwheelersbicycleclub.wildapricot.org/page-1374754" target="_blank">Pace explanation</a>
                    <HelpBlock bsClass='help-block hidden-xs hidden-sm'>Upload a .gpx file describing your route</HelpBlock>
                    <FormGroup bsSize='small'
                               bsClass='formGroup hidden-xs hidden-sm'
                               validationState={this.decideValidationStateFor('gpx',this.state.errorSource,this.state.succeeded)}
                               controlId="route">
                        <ControlLabel>Route file</ControlLabel>
                        <FormControl type="file" name='route' accept=".gpx" id='route' onChange={this.updateRouteFile}/>
                    </FormGroup>
                    <FormGroup
                               validationState={this.decideValidationStateFor('rwgps',this.state.errorSource,this.state.succeeded)}
                               controlId="ridewithgps">
                        <ControlLabel style={{padding:'10px'}}>RideWithGps route number</ControlLabel>
                        <OverlayTrigger placement="bottom" overlay={rwgps_enabled_tooltip}>
                            <FormControl type="text"
                                         onBlur={this.handleRwgpsRoute}
                                         onKeyPress={this.isNumberKey}
                                         onChange={this.setRwgpsRoute}
                                         pattern="[0-9]*"
                                         value={this.state.rwgpsRoute}
                                         style={{'width':'8em',height:'3em', padding:'12px'}}/>
                        </OverlayTrigger>
                    </FormGroup>
{/* if we want to allow selecting rwgps trips also

                    <FormGroup controlId="rwgpsType">
                        <ControlLabel style={{padding:'10px'}}>RideWithGps trip</ControlLabel>
                        <OverlayTrigger overlay={rwgps_trip_tooltip}>
                            <Checkbox onClick={event => this.setState({rwgpsRouteIsTrip:!this.state.rwgpsRouteIsTrip})}
                                      checked={this.state.rwgpsRouteIsTrip}>Rwgps number is a trip</Checkbox>
                        </OverlayTrigger>
                    </FormGroup>
*/}
                    <OverlayTrigger placement='bottom' overlay={forecast_tooltip}>
                        <div style={{'display':'inline-block',padding:'0px 14px'}} cursor='not-allowed'>
                            <Button bsStyle="primary" onClick={this.requestForecast}
                                    style={buttonStyle}
                                    disabled={this.disableSubmit() || this.state.pending} bsSize="large">
                                {this.state.pending?'Updating...':'Find forecast'}</Button>
                        </div>
                    </OverlayTrigger>
                    {RouteInfoForm.showErrorDetails(this.state.errorDetails)}
                    {RouteInfoForm.showProgressSpinner(this.state.routeUpdating)}
                </Form>
            </Panel>
        );
    }
}

module.exports=RouteInfoForm;
export default RouteInfoForm;