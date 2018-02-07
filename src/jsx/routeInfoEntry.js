import {Spinner} from '@blueprintjs/core';
import {
    Alert,
    Button,
    ControlLabel,
    Form,
    FormControl,
    FormGroup,
    OverlayTrigger,
    Panel,
    Tooltip
} from 'react-bootstrap';
import moment from 'moment';
import React, {Component} from 'react';
import ShortUrl from './shortUrl';
import MediaQuery from 'react-responsive';
import PropTypes from 'prop-types';
import {
    loadFromRideWithGps,
    loadGpxRoute,
    recalcRoute,
    requestForecast,
    setErrorDetails,
    setPace,
    setRwgpsRoute,
    setShortUrl,
    setStart,
    shortenUrl
} from './actions/actions';
import {connect} from 'react-redux';
import {doControlsMatch} from "./controls";
import PaceExplanation from './paceExplanation';
import ForecastInterval from './forecastInterval';
import cookie from 'react-cookies';
import RidingPace from './ridingPace';
import Recalculate from './recalculate';
import FileInput from './fileInput';
import DateSelect from './dateSelect';

const queryString = require('query-string');

export const paceToSpeed = {'A':10, 'B':12, 'C':14, 'C+':15, 'D-':15, 'D':16, 'D+':17, 'E-':17, 'E':18};

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

class RouteInfoForm extends Component {
    static propTypes = {
        start:PropTypes.instanceOf(Date),
        pace:PropTypes.string,
        interval:PropTypes.number,
        rwgpsRoute:PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.oneOf([''])
        ]),
        timezone_api_key:PropTypes.string.isRequired,
        controlPoints:PropTypes.arrayOf(PropTypes.object).isRequired,
        metric:PropTypes.bool.isRequired,
        formatControlsForUrl:PropTypes.func.isRequired,
        actualPace:PropTypes.number,
        fetchingRoute:PropTypes.bool,
        errorDetails:PropTypes.string,
        fetchingForecast:PropTypes.bool,
        loadingSuccess:PropTypes.bool,
        loadingSource:PropTypes.string,
        setPace:PropTypes.func.isRequired,
        setRwgpsRoute:PropTypes.func.isRequired,
        setStart:PropTypes.func.isRequired,
        setShortUrl:PropTypes.func.isRequired,
        shortenUrl:PropTypes.func.isRequired,
        routeInfo:PropTypes.object,
        loadFromRideWithGps:PropTypes.func.isRequired,
        recalcRoute:PropTypes.func.isRequired,
        loadGpxRoute:PropTypes.func.isRequired,
        requestForecast:PropTypes.func.isRequired,
        rwgpsRouteIsTrip:PropTypes.bool.isRequired
    };

    static contextTypes = {
        store: PropTypes.object
    };

    constructor(props) {
        super(props);
        this.requestForecast = this.requestForecast.bind(this);
        this.disableSubmit = this.disableSubmit.bind(this);
        this.handleRwgpsRoute = this.handleRwgpsRoute.bind(this);
        this.setRwgpsRoute = this.setRwgpsRoute.bind(this);
        this.setDateAndTime = this.setDateAndTime.bind(this);
        this.makeFullQueryString = this.makeFullQueryString.bind(this);
        this.paramsChanged = false;
        this.state = {};
        // for when we are loaded with a url that contains a route
        this.fetchAfterLoad = props.rwgpsRoute !== undefined;
    }

    routeIsLoaded() {
        return this.props.routeInfo.forecastRequest !== null;
    }

    componentDidMount() {
        if (this.props.rwgpsRoute !== '') {
            this.props.loadFromRideWithGps(this.props.rwgpsRoute,this.props.rwgpsRouteIsTrip,this.props.timezone_api_key);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.routeInfo.name !== '') {
            cookie.save(nextProps.routeInfo.name,this.props.formatControlsForUrl(nextProps.controlPoints));
        }
        // recalculate if the user updated the controls, say
        // but there must be a better way to tell than this
        if (nextProps.metric !== this.props.metric ||
            nextProps.controlPoints.length !== this.props.controlPoints.length ||
            !nextProps.controlPoints.every((v, i)=> doControlsMatch(v,this.props.controlPoints[i]))) {
            this.setQueryString(nextProps.controlPoints, nextProps.metric);
        }
    }

    componentDidUpdate() {
        if (this.paramsChanged) {
            this.paramsChanged = false;
            // recalculate if the user changed values in the dialog
            this.setQueryString(this.props.controlPoints, this.props.metric);
            this.props.recalcRoute();
        }
        if (this.fetchAfterLoad && this.props.routeInfo.points !== null && this.props.routeInfo.forecastRequest !== null) {
            this.requestForecast();
            this.fetchAfterLoad = false;
        }
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
        let query = {start:this.props.start,pace:this.props.pace,interval:this.props.interval,
            rwgpsRoute:this.props.rwgpsRoute,controlPoints:this.props.formatControlsForUrl(this.props.controlPoints)};
        this.props.shortenUrl(location.origin + '?' + queryString.stringify(query));
    }

    // this function exists to let us preserve the user's specified start time and share the url for this route
    // with someone in another time zone
    static dateToShortDate(date) {
        return moment(date).format("ddd MMM D YYYY HH:mm:ss");
    }

    setQueryString(controlPoints, metric) {
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

    disableSubmit() {
        // can't request a forecast without a route loaded
        return (this.props.rwgpsRoute === '' && this.props.routeInfo.gpxRouteData === null);
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

    static decideValidationStateFor(type, methodUsed, loadingSuccess) {
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

    render() {
        let forecast_tooltip = this.disableSubmit() ? (
            <Tooltip id="forecast_tooltip">Must either upload a gpx file or provide an rwgps route id</Tooltip> ):
            (<Tooltip id="'forecast_tooltip">Request a ride forecast</Tooltip>);
        let buttonStyle = this.disableSubmit() ? {pointerEvents : 'none', display:'inline-flex'} : null;

        const header = (<div style={{textAlign:"center",'fontSize':'99%'}}>Forecast and time estimate</div>);
        return (
                <div style={{display:'flex',flexFlow:'row wrap',justifyContent:'space-between',alignItems:'center',alignContent:'space-between',margin:'10px'}}>
                <Panel style={{marginBottom:'0'}} header={header}>
                <Form inline id="forecast_form">
                    <DateSelect/>
                    <Recalculate/>
                    <ForecastInterval/>
                    <RidingPace/>
                    <PaceExplanation/>
                    <FileInput/>
                    <FormGroup
                        validationState={RouteInfoForm.decideValidationStateFor('rwgps',this.props.loadingSource,this.props.loadingSuccess)}
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
                                    disabled={this.disableSubmit() || this.props.fetchingForecast} bsSize="large">
                                {this.props.fetchingForecast?'Updating...':'Find forecast'}</Button>
                            </MediaQuery>
                            <MediaQuery maxDeviceWidth={800}>
                                <Button tabIndex='6' bsStyle="primary" onClick={this.requestForecast}
                                        style={buttonStyle}
                                        disabled={this.disableSubmit() || this.props.fetchingForecast} bsSize="xsmall">
                                    {this.props.fetchingForecast?'Updating...':'Find forecast'}</Button>
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

const mapStateToProps = (state) =>
    ({
        rwgpsRoute: state.uiInfo.routeParams.rwgpsRoute,
        loadingSource: state.uiInfo.dialogParams.loadingSource,
        loadingSuccess: state.uiInfo.dialogParams.succeeded,
        start: state.uiInfo.routeParams.start,
        pace: state.uiInfo.routeParams.pace,
        actualPace: state.strava.actualPace,
        interval: state.uiInfo.routeParams.interval,
        fetchingRoute: state.uiInfo.dialogParams.fetchingRoute,
        errorDetails:state.uiInfo.dialogParams.errorDetails,
        routeInfo:state.routeInfo,
        controlPoints:state.controls.controlPoints,
        timezone_api_key: state.params.timezone_api_key,
        metric: state.controls.metric,
        fetchingForecast: state.uiInfo.dialogParams.fetchingForecast,
        rwgpsRouteIsTrip:state.uiInfo.routeParams.rwgpsRouteIsTrip
    });

const mapDispatchToProps = {
    loadFromRideWithGps, loadGpxRoute, setRwgpsRoute, setPace, setStart, requestForecast,
    recalcRoute, setErrorDetails, setShortUrl, shortenUrl
};

export const decideValidationStateFor = RouteInfoForm.decideValidationStateFor;
export default connect(mapStateToProps, mapDispatchToProps, null, {pure:true})(RouteInfoForm);