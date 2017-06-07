import { DateTimePicker } from '@blueprintjs/datetime';
import { Position, Popover, Spinner } from '@blueprintjs/core';
import { Panel,FormControl,FormGroup,Form,Glyphicon,Alert,ControlLabel,Button,HelpBlock,Tooltip,OverlayTrigger,Well,InputGroup} from 'react-bootstrap';
import { Checkbox } from 'react-bootstrap';
import moment from 'moment';
import React, { Component } from 'react';
import Flatpickr from 'react-flatpickr'
import AnalyzeRoute from './gpxParser';
const queryString = require('query-string');

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
const defaultPace = 'D';
const defaultIntervalInHours = 1;

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
        this.makeFullQueryString = this.makeFullQueryString.bind(this);
        this.urlShortenCallback = this.urlShortenCallback.bind(this);
        this.shortenUrl = this.shortenUrl.bind(this);
        this.controlPoints = [];
        this.forecastRequest = null;
        this.timeZone = null;
        this.state = {start:RouteInfoForm.findNextStartTime(props.start),
            pace:props.pace==null?defaultPace:props.pace, interval:props.interval==null?defaultIntervalInHours:props.interval,
            xmlhttp : null, routeFileSet:false,
            rwgpsRoute:props.rwgpsRoute==null?'':props.rwgpsRoute, errorDetails:null,
            pending:false, parser:new AnalyzeRoute(this.setErrorState,this.props.maps_api_key),
            paramsChanged:false, rwgpsRouteIsTrip:false, errorSource:null, succeeded:null, routeUpdating:false,
            fetchAfterLoad : false, shortUrl:''};
    }

    static findNextStartTime(start) {
        if (start != null) {
            return new Date(start);
        }
        let now = new Date();
        if (now.getHours() > startHour) {
            now.setDate(now.getDate() + 1);
            now.setHours(startHour);
            now.setMinutes(0);
            now.setSeconds(0);
        }
        return now;
    }

    componentDidMount() {
        if (this.state.rwgpsRoute != '') {
            this.state.parser.loadRwgpsRoute(this.state.rwgpsRoute,this.state.rwgpsRouteIsTrip);
            this.setState({routeUpdating:true});
            this.setState({fetchAfterLoad:true});
        }
    }

    copyControls(controlPoints) {
        return controlPoints.map(point => {return {distance:point['distance'],duration:point['duration']}});
    }

    compareControls(lastControlPoints,newControlPoints) {
        if (lastControlPoints.length != newControlPoints.length &&
                // prevent updating list before distance has been entered for a new control point
            (newControlPoints.length==0 || newControlPoints[newControlPoints.length-1]['distance']!=0)) {
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
            this.calculateTimeAndDistance(nextProps);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.paramsChanged) {
            this.setState({paramsChanged:false});
            if (this.state.parser.routeIsLoaded()) {
                this.calculateTimeAndDistance(this.props);
            }
        }
    }

    urlShortenCallback(event) {
        this.setState({shortUrl:event.currentTarget.response['id']});
    }

    shortenUrl(url) {
        let xmlhttp = new XMLHttpRequest();
        xmlhttp.responseType = 'json';
        xmlhttp.addEventListener('load',this.urlShortenCallback);
        xmlhttp.open('POST','https://www.googleapis.com/urlshortener/v1/url?key='+this.props.maps_api_key,true);
        xmlhttp.setRequestHeader('Content-Type','application/json; charset=utf-8"');
        xmlhttp.send(JSON.stringify({'longUrl':url}));
    }

    updateRouteFile(event) {
        let fileControl = event.target;
        let gpxFiles = fileControl.files;
        this.setState({routeFileSet : event.target.value != '', fetchAfterLoad:false});
        if (gpxFiles.length > 0) {
            this.state.parser.parseRoute(gpxFiles[0]);
            this.setState({rwgpsRoute:'',routeUpdating:true});
            history.pushState(null, 'nothing', location.origin);
        }
    }

    calculateTimeAndDistance(props) {
        this.controlPoints = this.copyControls(this.props.controlPoints);
        let routeInfo = this.state.parser.walkRoute(moment(this.state.start),
            this.state.pace, parseFloat(this.state.interval),props.controlPoints);
        this.timeZone = routeInfo['timeZone'];
        this.props.updateRouteInfo({bounds:routeInfo['bounds'],points:routeInfo['points'],
            name:routeInfo['name'],finishTime:routeInfo['finishTime']}, routeInfo['controls']);
        this.forecastRequest = routeInfo['forecast'];
    }

    requestForecast(event) {
        if (!this.state.parser.routeIsLoaded()) {
            this.setState({fetchAfterLoad:true});
            return;
        }
        if (this.forecastRequest == null) {
            this.calculateTimeAndDistance(this.props);
        }
        this.state.xmlhttp = new XMLHttpRequest();
        this.state.xmlhttp.onreadystatechange = this.forecastCb;
        this.state.xmlhttp.responseType = 'json';
        let formdata = new FormData();
        this.state.xmlhttp.open("POST", this.props.action);
        formdata.append('locations',JSON.stringify(this.forecastRequest));
        formdata.append('timezone',this.timeZone);
        this.state.xmlhttp.send(formdata);
        this.setState({pending:true,showForm:false});
    }

    makeFullQueryString(event) {
        let query = {start:this.state.start,pace:this.state.pace,interval:this.state.interval,rwgpsRoute:this.state.rwgpsRoute,controlPoints:JSON.stringify(this.props.controlPoints)};
        this.shortenUrl(location.origin + '?' + queryString.stringify(query));
    }

    // this function exists to let us preserve the user's specified start time and share the url for this route
    // with someone in another time zone
    dateToShortDate(date) {
        return moment(date).format("ddd MMM D YYYY HH:mm:ss");
    }

    setQueryString(state,controlPoints) {
        if (state.rwgpsRoute != '') {
            let query = {start:this.dateToShortDate(state.start),pace:state.pace,interval:state.interval,rwgpsRoute:state.rwgpsRoute,controlPoints:JSON.stringify(controlPoints)};
            history.pushState(null, 'nothing', location.origin + '?' + queryString.stringify(query));
            this.shortenUrl(location.origin + '?' + queryString.stringify(query));
        }
        else {
            history.pushState(null, 'nothing', location.origin);
            this.setState({shortUrl:''});
        }
    }

    forecastCb(event) {
        if (this.state.xmlhttp.readyState == 4) {
            this.setState({pending:false});
            this.forecastRequest = null;
            if (event.target.status==200) {
                this.setState({errorDetails:null,succeeded:true});
                this.setQueryString(this.state,this.props.controlPoints);
                if (event.target.response == null) {
                    console.log('missing response');
                    return;
                }
                this.props.updateForecast(event.target.response);
                let weatherCorrectionMinutes = this.state.parser.adjustForWind(event.target.response,this.state.pace,this.props.controlPoints,this.state.start);
                this.props.updateFinishTime(weatherCorrectionMinutes);
                // this.props.updateControls(this.props.controlPoints);
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
            if (this.state.fetchAfterLoad) {
                this.requestForecast();
            }
            else {
                this.calculateTimeAndDistance(this.props);
            }
            this.setState({errorDetails:errorDetails,errorSource:null,routeUpdating:false,succeeded:true,fetchAfterLoad:false});

        }
    }

    disableSubmit() {
        return (this.state.rwgpsRoute == '' && !this.state.routeFileSet);
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

    static getRouteNumberFromValue(value) {
        if (value!='') {
            // is this just a number or a full url?
            let route = parseInt(value);
            if (isNaN(route)) {
                let routeParts = value.split('/');
                route = routeParts.pop();
            }
            return route;
        }
        return value;
    }

    handleRwgpsRoute(event) {
        let route = RouteInfoForm.getRouteNumberFromValue(event.target.value);
        if (route!='') {
            this.state.parser.loadRwgpsRoute(route,this.state.rwgpsRouteIsTrip);
            // clear file input to avoid confusion
            document.getElementById('route').value = null;
            this.setState({'routeFileSet':false,'routeUpdating':true});
        } else if (this.state.errorSource=='rwgps') {
            this.setState({'errorSource':null});
        }
    }

    setRwgpsRoute(event) {
        let route = RouteInfoForm.getRouteNumberFromValue(event.target.value);
        this.setState({rwgpsRoute : route});
        this.state.parser.clear();
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
        if (datestr=='') {
            instance.setDate(this.state.start);
            return;
        }
        this.setState({start:new Date(dates[0]),paramsChanged:true});
    }

    render() {
        let pace_mph = paceToSpeed[this.state.pace];
        let pace_text = "Represents climb-adjusted pace - current is ".concat(pace_mph);
        let pace_tooltip = ( <Tooltip id="pace_tooltip">{pace_text}</Tooltip> );
        let file_upload_tooltip = ( <Tooltip id="upload_tooltip">Upload a .gpx file describing your route</Tooltip> );
        let forecast_tooltip = this.disableSubmit() ? (
            <Tooltip id="forecast_tooltip">Must either upload a gpx file or provide an rwgps route id</Tooltip> ):
            (<Tooltip id="'forecast_tooltip">Request a ride forecast</Tooltip>);
        const now = new Date();
        // allow us to continue to show the start time if the route was forecast for a time before the present
        let firstDate = now > this.state.start ? this.state.start : now;
        let later = new Date();
        const daysToAdd = 14;
        later.setDate(now.getDate() + daysToAdd);
        let buttonStyle = this.disableSubmit() ? {pointerEvents : 'none',padding:'14px',display:'inline-flex'} : {padding:'14px'};

        const header = (<div style={{textAlign:"center",'fontSize':'99%'}}>Forecast and time estimate</div>);
        return (
                <div style={{display:'flex',flexFlow:'row wrap',justifyContent:'space-between',alignItems:'center',alignContent:'space-between',margin:'10px'}}>
                <Panel style={{marginBottom:'0'}} header={header}>
                <Form inline id="forecast_form">
                    <FormGroup tabIndex="1"
                        style={{flex:'1',display:'inline-flex',alignItems:'center'}} controlId="starting_time">
                        <OverlayTrigger placement='bottom' overlay={time_tooltip}>
                            <ControlLabel>Starting time</ControlLabel>
                        </OverlayTrigger>
                        <span style={{display:'inline-flex'}} className="pt-icon-standard pt-icon-calendar"></span>
                        <Flatpickr onChange={this.setDateAndTime}
                                   options={{enableTime: true,
                            altInput: true, altFormat: 'F j, Y h:i K',
                            altInputClass: 'dateDisplay',
                            minDate: firstDate,
                            maxDate: later,
                            defaultDate: this.state.start,
                            dateFormat: 'Y-m-d\TH:i'
                        }}/>
                    </FormGroup>
                    <FormGroup bsSize='small' controlId="interval" style={{flex:'1',display:'inline-flex',marginTop:'5px',marginBottom:'5px'}}>
                        <ControlLabel>Interval in hours</ControlLabel>
                        <OverlayTrigger placement='bottom' overlay={interval_tooltip}>
                            <FormControl tabIndex='2' type="number" min={0.5} max={2} step={0.5} name="interval" style={{'width':'5em'}}
                                         value={this.state.interval} onChange={this.intervalChanged}/>
                        </OverlayTrigger>
                    </FormGroup>
                    <FormGroup style={{flex:'1',display:'inline-flex',marginTop:'5px',marginBottom:'5px'}} controlId="pace">
                        <ControlLabel>Pace</ControlLabel>
                        <OverlayTrigger placement="bottom" overlay={pace_tooltip}>
                            <FormControl tabIndex='3' componentClass="select" value={this.state.pace} name="pace"
                                         style={{'width':'5em','height':'2.8em',paddingRight:'8px'}}
                                         onChange={this.handlePaceChange}>
                                <option value="A">A/10</option>
                                <option value="B">B/12</option>
                                <option value="C">C/14</option>
                                <option value="C+">C+/15</option>
                                <option value="D-">D-/15-</option>
                                <option value="D">D/16</option>
                                <option value="D+">D+/17</option>
                                <option value="E-">E-/17-</option>
                                <option value="E">E/18</option>
                            </FormControl>
                        </OverlayTrigger>
                    </FormGroup>
                    <a style={{padding:'8px',display:'inline-flex',marginTop:'5px',marginBottom:'5px'}} href="https://westernwheelersbicycleclub.wildapricot.org/page-1374754" target="_blank">Pace explanation</a>
                    {/*<HelpBlock style={{flex:'1',display:'inline-flex'}} bsClass='help-block hidden-xs hidden-sm'>Upload a .gpx file describing your route</HelpBlock>*/}
                    <FormGroup bsSize='small'
                               bsClass='formGroup hidden-xs hidden-sm'
                               validationState={this.decideValidationStateFor('gpx',this.state.errorSource,this.state.succeeded)}
                               style={{display:'inline-flex',marginTop:'5px',marginBottom:'5px'}}
                               controlId="route">
                        <ControlLabel>Route file</ControlLabel>
                        <OverlayTrigger placement='bottom' overlay={file_upload_tooltip}>
                            <FormControl tabIndex='4' type="file" name='route' accept=".gpx" id='route' onChange={this.updateRouteFile}/>
                        </OverlayTrigger>
                    </FormGroup>
                    <FormGroup
                        validationState={this.decideValidationStateFor('rwgps',this.state.errorSource,this.state.succeeded)}
                        controlId="ridewithgps" style={{flex:'1',display:'inline-flex',marginTop:'5px',marginBottom:'5px'}}>
                        <ControlLabel>RideWithGps route number</ControlLabel>
                        <OverlayTrigger placement="bottom" overlay={rwgps_enabled_tooltip}>
                            <FormControl tabIndex='5' type="text"
                                         onBlur={this.handleRwgpsRoute}
                                         onKeyPress={this.isNumberKey}
                                         onChange={this.setRwgpsRoute}
                                         pattern="[0-9]*"
                                         value={this.state.rwgpsRoute}
                                         style={{'width':'8em',height:'3em', padding:'12px',flex:'1',display:'inline-flex',alignItems:'center'}}/>
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
                        <div style={{'display':'inline-flex',padding:'0px 14px'}} cursor='not-allowed'>
                            <Button tabIndex='6' bsStyle="primary" onClick={this.requestForecast}
                                    style={buttonStyle}
                                    disabled={this.disableSubmit() || this.state.pending} bsSize="large">
                                {this.state.pending?'Updating...':'Find forecast'}</Button>
                        </div>
                    </OverlayTrigger>
                    {RouteInfoForm.showErrorDetails(this.state.errorDetails)}
                    {RouteInfoForm.showProgressSpinner(this.state.routeUpdating)}
                </Form>
            </Panel>
                    <FormGroup bsSize="small">
                        <FormControl readOnly type="text" style={{marginTop:'10px',marginLeft:'135px',width:'15em',display:this.state.shortUrl==''?'none':'inline-flex'}}
                                     value={this.state.shortUrl} onFocus={event => {event.target.select();document.execCommand('copy')}}/>
                    </FormGroup>
            </div>
        );
    }
}

module.exports=RouteInfoForm;
export default RouteInfoForm;