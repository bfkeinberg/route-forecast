import {Icon, Spinner} from '@blueprintjs/core';
import {
    Alert,
    Button,
    ControlLabel,
    Form,
    FormControl,
    FormGroup,
    OverlayTrigger,
    Panel,
    Popover,
    Tooltip
} from 'react-bootstrap';
import moment from 'moment';
import React, {Component} from 'react';
import Flatpickr from 'react-flatpickr'
import ShortUrl from './shortUrl';
import MediaQuery from 'react-responsive';
import rideRatingText from './rideRating.htm';
import PropTypes from 'prop-types';
import {
    loadFromRideWithGps,
    loadGpxRoute,
    recalcRoute,
    requestForecast,
    setErrorDetails,
    setInterval,
    setPace,
    setRwgpsRoute,
    setShortUrl,
    shortenUrl
} from './actions/actions';
import {connect} from 'react-redux';
import {doControlsMatch} from "./controls";

const queryString = require('query-string');

export const paceToSpeed = {'A':10, 'B':12, 'C':14, 'C+':15, 'D-':15, 'D':16, 'D+':17, 'E-':17, 'E':18};

const time_tooltip = (
    <Tooltip id="time_tooltip">When you plan to begin riding</Tooltip>
);

const interval_tooltip = (
    <Tooltip id="interval_tooltip">How often to generate weather forecast</Tooltip>
);

const tooltip_rwgps_enabled = (
    <Tooltip id="rwgps_tooltip">The number for a route on ridewithgps</Tooltip>
);

// import { Checkbox } from 'react-bootstrap';
/*
const rwgps_trip_tooltip = (
    <Tooltip id="trip_tooltip">Ride with GPS has both 'trips' and 'routes'.
        Routes are created with the planner, trips are recorded rides.</Tooltip>
);
*/

const rideRatingDisplay = (
    <Popover style={{width:450, maxWidth:500}} id="ride-rating-popup" title="Ride rating system">
        <div dangerouslySetInnerHTML={{__html: rideRatingText}}/>
    </Popover>
);

class RouteInfoForm extends Component {
    static propTypes = {
        start:PropTypes.instanceOf(Date),
        pace:PropTypes.string,
        interval:PropTypes.number,
        rwgpsRoute:PropTypes.oneOfType([PropTypes.number,PropTypes.oneOf([''])]),
        timezone_api_key:PropTypes.string.isRequired,
        controlPoints:PropTypes.arrayOf(PropTypes.object).isRequired,
        metric:PropTypes.bool.isRequired,
        updateRouteInfo:PropTypes.func.isRequired,
        formatControlsForUrl:PropTypes.func.isRequired,
        actualPace:PropTypes.number
    };

    static contextTypes = {
        store: PropTypes.object
    };

    constructor(props) {
        super(props);
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
        this.makeFullQueryString = this.makeFullQueryString.bind(this);
        this.paramsChanged = false;
        this.state = {};
        // for when we are loaded with a url that contains a route
        this.fetchAfterLoad = props.rwgpsRoute !== undefined;
    }

    routeIsLoaded() {
        return this.props.routeInfo.rwgpsRouteData !== null || this.props.routeInfo.gpxRouteData !== null;
    }

    componentDidMount() {
        if (this.props.rwgpsRoute !== '') {
            this.props.loadFromRideWithGps(this.props.rwgpsRoute,this.props.rwgpsRouteIsTrip,this.props.timezone_api_key);
        }
    }

    componentWillReceiveProps(nextProps) {
        // recalculate if the user updated the controls, say
        this.setQueryString(this.state, this.props.controlPoints, this.props.metric);
        if (nextProps.controlPoints.length !== this.props.controlPoints.length ||
            !nextProps.controlPoints.every((v, i)=> doControlsMatch(v,this.props.controlPoints[i]))) {
            this.props.recalcRoute();
        }
        if (this.fetchAfterLoad && this.props.routeInfo.points !== null) {
            this.requestForecast();
            this.fetchAfterLoad = false;
        }
    }

    componentDidUpdate() {
        if (this.paramsChanged) {
            this.paramsChanged = false;
            // recalculate if the user changed values in the dialog
            this.setQueryString(this.state, this.props.controlPoints, this.props.metric);
            this.props.recalcRoute();
        }
    }

    updateRouteFile(event) {
        this.props.loadGpxRoute(event,this.props.timezone_api_key);
        history.pushState(null, 'nothing', location.origin);
    }

    requestForecast() {
        // this weirdness is to handle the case where the user clicked this button
        // while the route was loading asynchronously. Putting this state in keeps them from having to wait
        // until the route is done loading to click.
        if (!this.routeIsLoaded()) {
            this.fetchAfterLoad = true;
            return;
        }
        this.props.requestForecast(this.props.routeInfo);
    }

    makeFullQueryString() {
        let query = {start:this.state.start,pace:this.props.pace,interval:this.props.interval,
            rwgpsRoute:this.props.rwgpsRoute,controlPoints:this.props.formatControlsForUrl(this.props.controlPoints)};
        this.props.shortenUrl(location.origin + '?' + queryString.stringify(query));
    }

    // this function exists to let us preserve the user's specified start time and share the url for this route
    // with someone in another time zone
    static dateToShortDate(date) {
        return moment(date).format("ddd MMM D YYYY HH:mm:ss");
    }

    setQueryString(state,controlPoints,metric) {
        if (this.props.rwgpsRoute !== '') {
            let query = {start:RouteInfoForm.dateToShortDate(this.props.start),pace:this.props.pace,interval:this.props.interval,metric:metric,
                rwgpsRoute:this.props.rwgpsRoute,controlPoints:this.props.formatControlsForUrl(controlPoints)};
            history.pushState(null, 'nothing', location.origin + '?' + queryString.stringify(query));
            this.props.shortenUrl(location.origin + '?' + queryString.stringify(query));
        }
        else {
            history.pushState(null, 'nothing', location.origin);
            this.props.setShortUrl('');
        }
    }

    setErrorState(errorDetails, errorSource) {
        if (errorDetails !== null) {
            this.setState({errorDetails:errorDetails, errorSource:errorSource, routeUpdating:false});
            if (errorSource === 'rwgps') {
                this.setState({rwgpsRoute:'',succeeded:false});
            } else {
                this.routeFileSet = false;
                this.setState({succeeded:false})
            }
        } else {
            this.setState({errorDetails:errorDetails,errorSource:null,routeUpdating:false,succeeded:true});
        }
    }

    disableSubmit() {
        return (this.props.rwgpsRoute === '' && this.props.routeInfo.gpxRouteData === null);
     }

    intervalChanged(event) {
        if (event.target.value !== '') {
            this.paramsChanged = true;
            this.props.setInterval(parseFloat(event.target.value));
        }
    }

    handleDateChange(time) {
        this.paramsChanged = true;
        this.props.setStart(time);
    }

    static showErrorDetails(errorState) {
        if (errorState !== null) {
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
        if (value !== '') {
            // is this just a number or a full url?
            let route = parseInt(value);
            if (isNaN(route)) {
                let routeParts = value.split('/');
                route = parseInt(routeParts.pop());
            }
            return route;
        }
        return value;
    }

    handleRwgpsRoute(value) {
        let route = RouteInfoForm.getRouteNumberFromValue(value);
        if (route !== '') {
            if (isNaN(route)) {
                return;
            }
            this.props.loadFromRideWithGps(route,this.props.rwgpsRouteIsTrip,this.props.timezone_api_key);
            // clear file input to avoid confusion
            document.getElementById('route').value = null;
        }
    }

    setRwgpsRoute(value) {
        let route = RouteInfoForm.getRouteNumberFromValue(value);
        if (isNaN(route)) {
            return;
        }
        this.props.setRwgpsRoute(route);
    }

    static isNumberKey(event) {
        const charCode = (event.which) ? event.which : event.keyCode;
        if ((charCode < 48 || charCode > 57))
            return false;

        return charCode;
    }

    handlePaceChange(event) {
        this.paramsChanged = true;
        this.props.setPace(event.target.value);
    }

    decideValidationStateFor(type,methodUsed,loadingSuccess) {
        if (type === methodUsed) {
            if (loadingSuccess) {
                return 'success';
            } else {
                return 'error';
            }
        } else {
            return null;
        }
    }

    setDateAndTime(dates, datestr, instance) {
        if (datestr === '') {
            instance.setDate(this.props.start);
            return;
        }
        this.paramsChanged = true;
        this.props.setStart(new Date(dates[0]));
    }

/*
    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.pace!==this.props.pace ||
            nextProps.interval!==this.props.interval ||
            nextProps.rwgpsRoute!==this.props.rwgpsRoute ||
            nextProps['errorDetails'] !== this.props.errorDetails ||
            nextState['pending'] !== this.state.pending ||
            nextState.rwgpsRouteIsTrip !== this.state.rwgpsRouteIsTrip ||
            nextProps.errorSource !== this.props.errorSource ||
            nextState['succeeded'] !== this.state.succeeded ||
            nextState['routeUpdating'] !== this.state.routeUpdating ||
            nextState['shortUrl'] !== this.state.shortUrl ||
            nextProps['metric'] !== this.props.metric ||
            nextState['shortUrl']!== this.state.shortUrl ||
            nextProps['actualPace']!== this.props.actualPace ||
            nextProps['start']!== this.props.start;
    }
*/

    getAlphaPace(pace) {
        let alpha = 'A';     // default
        alpha = Object.keys(paceToSpeed).reverse().find(value => {
            return (pace > paceToSpeed[value])});
        return alpha;
    }

    static getPaceTooltipId(realPace, predictedPace) {
        if (realPace < predictedPace) {
            return 'red-tooltip';
        } else {
            return 'green-tooltip';
        }
    }

    render() {
        let pace_mph = paceToSpeed[this.state.pace];
        let pace_text;
        let pace_tooltip_id = 'pace_tooltip';
        if (this.props.actualPace === undefined) {
            pace_text = `Represents climb-adjusted pace - current is ${pace_mph}`;
        } else {
            pace_tooltip_id = RouteInfoForm.getPaceTooltipId(this.props.actualPace,pace_mph);
            pace_text = `Actual riding pace was ${this.getAlphaPace(this.props.actualPace)}`;
        }
        let pace_tooltip = ( <Tooltip id={pace_tooltip_id}>{pace_text}</Tooltip> );
        let file_upload_tooltip = ( <Tooltip id="upload_tooltip">Upload a .gpx file describing your route</Tooltip> );
        let forecast_tooltip = this.disableSubmit() ? (
            <Tooltip id="forecast_tooltip">Must either upload a gpx file or provide an rwgps route id</Tooltip> ):
            (<Tooltip id="'forecast_tooltip">Request a ride forecast</Tooltip>);
        const now = new Date();
        // allow us to continue to show the start time if the route was forecast for a time before the present
        let firstDate = now > this.props.start ? this.props.start : now;
        let later = new Date();
        const daysToAdd = 14;
        later.setDate(now.getDate() + daysToAdd);
        let buttonStyle = this.disableSubmit() ? {pointerEvents : 'none', display:'inline-flex'} : null;

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
                        <Icon iconName="calendar"/>
                        <Flatpickr onChange={this.setDateAndTime}
                                   options={{enableTime: true,
                            altInput: true, altFormat: 'F j, Y h:i K',
                            altInputClass: 'dateDisplay',
                            minDate: firstDate,
                            maxDate: later,
                            defaultDate: this.state.start,
                            dateFormat: 'Y-m-d H:i'
                        }}/>
                    </FormGroup>
                    <FormGroup bsSize='small' controlId="interval" style={{flex:'1',display:'inline-flex',marginTop:'5px',marginBottom:'5px'}}>
                        <ControlLabel>Interval in hours</ControlLabel>
                        <OverlayTrigger placement='bottom' overlay={interval_tooltip}>
                            <FormControl tabIndex='2' type="number" min={0.5} max={2} step={0.5} name="interval" style={{'width':'5em'}}
                                         value={this.props.interval} onChange={this.intervalChanged}/>
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

                    <OverlayTrigger trigger="click" placement="right" rootClose overlay={rideRatingDisplay}>
                        <Button style={{marginLeft:'7px'}} bsSize="xsmall">Pace explanation</Button>
                    </OverlayTrigger>

                    {/*<a style={{padding:'8px',display:'inline-flex',marginTop:'5px',marginBottom:'5px'}} href="https://westernwheelersbicycleclub.wildapricot.org/page-1374754" target="_blank">Pace explanation</a>*/}
                    <FormGroup bsSize='small'
                               bsClass='formGroup hidden-xs hidden-sm'
                               validationState={this.decideValidationStateFor('gpx',this.props.loadingSource,this.props.loadingSuccess)}
                               style={{display:'inline-flex',marginTop:'5px',marginBottom:'5px'}}
                               controlId="route">
                        <ControlLabel>Route file</ControlLabel>
                        <OverlayTrigger placement='bottom' overlay={file_upload_tooltip}>
                            <FormControl tabIndex='4' type="file" name='route' accept=".gpx" id='route' onChange={this.updateRouteFile}/>
                        </OverlayTrigger>
                    </FormGroup>

                    <FormGroup
                        validationState={this.decideValidationStateFor('rwgps',this.props.loadingSource,this.props.loadingSuccess)}
                        controlId="ridewithgps" style={{flex:'1',display:'inline-flex',marginTop:'5px',marginBottom:'5px'}}>
                        <ControlLabel>RideWithGps route</ControlLabel>
                        <OverlayTrigger placement="bottom" overlay={tooltip_rwgps_enabled}>
                            <FormControl tabIndex='5' type="text"
                                         onBlur={event => {this.handleRwgpsRoute(event.target.value)}}
                                         onKeyPress={RouteInfoForm.isNumberKey}
                                         onChange={event => {this.setRwgpsRoute(event.target.value)}}
                                         onDrop={event => {
                                             let dt = event.dataTransfer;
                                             if (dt.items) {
                                                 for (let i=0;i < dt.items.length;i++) {
                                                     if (dt.items[i].kind === 'string') {
                                                         event.preventDefault();
                                                         dt.items[i].getAsString(value => {
                                                             this.setRwgpsRoute(value);
                                                             this.handleRwgpsRoute(value);
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
                                         pattern="[0-9]*"
                                         value={this.props.rwgpsRoute}
                                         style={{flex:'1',display:'inline-flex',alignItems:'center'}}/>
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
                            <MediaQuery minDeviceWidth={1000}>
                            <Button tabIndex='6' bsStyle="primary" onClick={this.requestForecast}
                                    style={buttonStyle}
                                    disabled={this.disableSubmit() || this.state.pending} bsSize="large">
                                {this.state.pending?'Updating...':'Find forecast'}</Button>
                            </MediaQuery>
                            <MediaQuery maxDeviceWidth={800}>
                                <Button tabIndex='6' bsStyle="primary" onClick={this.requestForecast}
                                        style={buttonStyle}
                                        disabled={this.disableSubmit() || this.state.pending} bsSize="xsmall">
                                    {this.state.pending?'Updating...':'Find forecast'}</Button>
                            </MediaQuery>
                        </div>
                    </OverlayTrigger>
                    {RouteInfoForm.showErrorDetails(this.props.errorDetails)}
                    {RouteInfoForm.showProgressSpinner(this.props.fetchingRoute)}
                </Form>
                    <MediaQuery maxDeviceWidth={800}>
                        <ShortUrl/>
                    </MediaQuery>
                </Panel>
            <MediaQuery minDeviceWidth={1000}>
                <ShortUrl/>
            </MediaQuery>
            </div>
        );
    }
}

const mapStateToProps = (state, ownProps) =>
    ({
        rwgpsRoute: state.uiInfo.rwgpsRoute,
        loadingSource: state.uiInfo.loadingSource,
        loadingSuccess: state.uiInfo.succeeded,
        start: state.uiInfo.start,
        pace: state.uiInfo.pace,
        interval: state.uiInfo.interval,
        fetchingRoute: state.uiInfo.fetchingRoute,
        rwgpsRouteIsTrip:state.uiInfo.rwgpsRouteIsTrip,
        errorDetails:state.uiInfo.errorDetails,
        routeInfo:state.routeInfo,
        controlPoints:state.controls.controlPoints,
        timezone_api_key: state.params.timezone_api_key,
        metric: state.controls.metric
    });

const mapDispatchToProps = {
    loadFromRideWithGps, loadGpxRoute, setRwgpsRoute, setInterval, setPace, requestForecast,
    recalcRoute, setErrorDetails, setShortUrl, shortenUrl
};

export default connect(mapStateToProps, mapDispatchToProps, null, {pure:true})(RouteInfoForm);