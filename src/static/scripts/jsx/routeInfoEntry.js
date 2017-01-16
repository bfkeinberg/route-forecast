import LoginDialog from './loginDialog';
import { DateTimePicker } from '@blueprintjs/datetime';
import { Position, Popover } from '@blueprintjs/core';
import { Panel,FormControl,FormGroup,Form,Glyphicon,Alert,ControlLabel,Button,HelpBlock,Tooltip,OverlayTrigger,Well,InputGroup} from 'react-bootstrap';
import moment from 'moment';
// import momentz from 'moment-timezone';
import React, { Component } from 'react';
import Flatpickr from 'react-flatpickr'

let fpcss = require('!style!css!flatpickr/dist/themes/confetti.css');

const paceToSpeed = {'A':10, 'B':12, 'C':14, 'C+':15, 'D-':15, 'D':16, 'D+':17, 'E-':17, 'E':18};

const time_tooltip = (
    <Tooltip id="time_tooltip">When you plan to begin riding</Tooltip>
);

const interval_tooltip = (
    <Tooltip id="interval_tooltip">How often to generate weather forecast</Tooltip>
);

const rwgps_disabled_tooltip = (
    <Tooltip id="pace_tooltip" placement="bottom">Must log into rideWithGps to enable</Tooltip>
);

const rwgps_enabled_tooltip = (
    <Tooltip id="pace_tooltip">The number for a route on ridewithgps</Tooltip>
);

const startHour = 7;

class RouteInfoForm extends React.Component {

    constructor(props) {
        super(props);
        this.loginResult = this.loginResult.bind(this);
        this.forecastCb = this.forecastCb.bind(this);
        this.requestForecast = this.requestForecast.bind(this);
        this.disableSubmit = this.disableSubmit.bind(this);
        this.handleDateChange = this.handleDateChange.bind(this);
        this.intervalChanged = this.intervalChanged.bind(this);
        this.state = {start:this.findNextStartTime(), pace:'D', interval:1, rwgps_enabled:false,
            xmlhttp : null, routeFileSet:false,rwgpsRoute:false,errorDetails:null,
            pending:false};
    }


    findNextStartTime() {
        let now = new Date();
        if (now.getHours() > startHour) {
            now.setDate(now.getDate() + 1);
            now.setHours(startHour);
            now.setMinutes(0);
        }
        return now;
    }

    loginResult(result) {
        this.setState({rwgps_enabled : true});
    }

    requestForecast(event) {
        this.state.xmlhttp = new XMLHttpRequest();
        this.state.xmlhttp.onreadystatechange = this.forecastCb;
        this.state.xmlhttp.responseType = 'json';
        let requestForm = document.getElementById("forecast_form");
        let formdata = new FormData(requestForm);
        this.state.xmlhttp.open("POST", this.props.action);
        let startMoment = moment(this.state.start);
        formdata.append('starting_time',startMoment.format('X'));
        formdata.append('timezone',new Date().getTimezoneOffset());
        if (this.props.controlPoints.length > 0) {
            let js = JSON.stringify(this.props.controlPoints);
            formdata.set("controls",js);
        }
        this.state.xmlhttp.send(formdata);
        this.setState({pending:true});
    }

    forecastCb(event) {
        if (this.state.xmlhttp.readyState == 4) {
            this.setState({pending:false});
            if (event.target.status==200) {
                this.setState({errorDetails:null});
                this.props.updateForecast(event.target.response);
            }
            else {
                if (event.target.response != null) {
                    this.setState({errorDetails:event.target.response['status']});
                }
                else if (event.target.statusText != null) {
                    this.setState({errorDetails:event.target.statusText});
                }
            }
        }
    }

    disableSubmit() {
        return !this.state.rwgpsRoute && !this.state.routeFileSet;
    }

    intervalChanged(event) {
        if (event.target.value != '') {
            this.setState({interval:event.target.value});
        }
    }

    handleDateChange(time) {
        this.setState({start:time});
    }

    showErrorDetails(errorState) {
        if (errorState != null) {
            return (
                <Alert bsStyle="danger">{errorState}</Alert>
            );
        }
    }

    render() {
        let pace_mph = paceToSpeed[this.state.pace];
        let pace_text = "Represents elevation-adjusted pace - current is ".concat(pace_mph);
        let pace_tooltip = ( <Tooltip id="pace_tooltip">{pace_text}</Tooltip> );
        let forecast_tooltip = this.disableSubmit() ? (
            <Tooltip id="forecast_tooltip">Must either upload a gpx file or provide an rwgps route id</Tooltip> ):
            (<Tooltip id="'forecast_tooltip">Request a ride forecast</Tooltip>);
        const now = new Date();
        let later = new Date();
        const daysToAdd = 14;
        later.setDate(now.getDate() + daysToAdd);
/*
        let timeProps = {showArrowButtons:true};
        let dateProps = {minDate:now,maxDate:later,canClearSelection:false};
*/
        let buttonStyle = this.disableSubmit() ? {pointerEvents : 'none',padding:'14px'} : {padding:'14px'};
/*        let popupCalendar = (
            <FormGroup controlId="starting_time">
                <ControlLabel>Starting time</ControlLabel>
                <DateTimePicker name="starting_time" value={this.state.start}
                                onChange={this.handleDateChange}
                                datePickerProps={dateProps}
                                timePickerProps={timeProps}
                                placeholder="Select Date.."/>

            </FormGroup>
        );*/
        const header = (<div style={{textAlign:"center",'fontSize':'99%'}}>Forecast and time estimate</div>);
        return (
            <Panel header={header}>
                <Form inline id="forecast_form">
{/*
                    <Popover content={popupCalendar} position={Position.BOTTOM} useSmartPositioning={true}
                             popoverClassName="pt-popover-content-sizing">
                        <Button><Glyphicon glyph="calendar"></Glyphicon>Starting time</Button>
                    </Popover>
*/}
{/*
                        <FormGroup controlId="starting_time">
                            <ControlLabel>Starting time</ControlLabel>
                            <DateTimePicker name="starting_time" value={this.state.start}
                                            onChange={this.handleDateChange}
                                            datePickerProps={dateProps}
                                            timePickerProps={timeProps}
                                            placeholder="Select Date.."/>

                        </FormGroup>
*/}
                    <FormGroup controlId="starting_time">
                        <OverlayTrigger placement='bottom' overlay={time_tooltip}>
                            <ControlLabel style={{padding:'10px'}}>Starting time</ControlLabel>
                        </OverlayTrigger>
                        <span className="pt-icon-standard pt-icon-calendar"></span>
                        <Flatpickr options={{enableTime: true,
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
                                         style={{'width':'3em',padding:'10px'}}
                                         onChange={event => this.setState({start:this.state.start,pace:event.target.value})}
                                         required>
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
                    <HelpBlock>Upload a .gpx file describing your route</HelpBlock>
                    <FormGroup bsSize='small' controlId="route">
                        <ControlLabel>Route file</ControlLabel>
                        <FormControl type="file" name='route' accept=".gpx"
                                     onChange={event => this.setState({routeFileSet : event.target.value != ''})}/>
                    </FormGroup>
                    <FormGroup controlId="ridewithgps">
                        <ControlLabel style={{padding:'10px'}}>RideWithGps route number</ControlLabel>
                        <OverlayTrigger placement="bottom" overlay={this.state.rwgps_enabled?rwgps_enabled_tooltip:rwgps_disabled_tooltip}>
                            <FormControl type="number" pattern="[0-9]*"
                                         onChange={event => this.setState({rwgpsRoute : event.target.value!=''})}
                                         style={{'width':'4em',padding:'12px'}}
                                         disabled={!this.state.rwgps_enabled}/>
                        </OverlayTrigger>
                    </FormGroup>
                    <OverlayTrigger placement='bottom' overlay={forecast_tooltip}>
                        <div style={{'display':'inline-block',padding:'0px 14px'}} cursor='not-allowed'>
                            <Button bsStyle="primary" onClick={this.requestForecast}
                                    style={buttonStyle}
                                    disabled={this.disableSubmit() || this.state.pending} bsSize="large">
                                {this.state.pending?'Updating...':'Find forecast'}</Button>
                        </div>
                    </OverlayTrigger>
                    {this.showErrorDetails(this.state.errorDetails)}
                </Form>
                <LoginDialog loginCb={this.loginResult}/>
            </Panel>
        );
    }
}

module.exports=RouteInfoForm;
export default RouteInfoForm;