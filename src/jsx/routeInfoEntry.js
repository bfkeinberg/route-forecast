import {Spinner} from '@blueprintjs/core';
import {Alert, Button, Form, OverlayTrigger, Panel, Tooltip} from 'react-bootstrap';
import React, {Component} from 'react';
import ShortUrl from './ui/shortUrl';
import MediaQuery from 'react-responsive';
import PropTypes from 'prop-types';
import {loadFromRideWithGps, recalcRoute, requestForecast, setErrorDetails} from './actions/actions';
import {connect} from 'react-redux';
import PaceExplanation from './paceExplanation';
import ForecastInterval from './ui/forecastInterval';
import cookie from 'react-cookies';
import RidingPace from './ui/ridingPace';
import Recalculate from './recalculate';
import FileInput from './ui/fileInput';
import DateSelect from './ui/dateSelect';
import RideWithGpsId from './ui/rideWithGpsId';
import RwGpsTypeSelector from './ui/rwGpsTypeSelector';

class RouteInfoForm extends Component {
    static propTypes = {
        rwgpsRoute:PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.oneOf([''])
        ]),
        controlPoints:PropTypes.arrayOf(PropTypes.object).isRequired,
        formatControlsForUrl:PropTypes.func.isRequired,
        fetchingRoute:PropTypes.bool,
        errorDetails:PropTypes.string,
        fetchingForecast:PropTypes.bool,
        routeInfo:PropTypes.object,
        loadFromRideWithGps:PropTypes.func.isRequired,
        recalcRoute:PropTypes.func.isRequired,
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
        this.state = {};
        // for when we are loaded with a url that contains a route
        this.fetchAfterLoad = props.rwgpsRoute !== undefined;
    }

    routeIsLoaded() {
        return this.props.routeInfo.forecastRequest !== null;
    }

    componentDidMount() {
        if (this.props.rwgpsRoute !== '') {
            this.props.loadFromRideWithGps(this.props.rwgpsRoute,this.props.rwgpsRouteIsTrip);
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.routeInfo.name !== '') {
            cookie.save(nextProps.routeInfo.name,this.props.formatControlsForUrl(nextProps.controlPoints));
        }
    }

    componentDidUpdate() {
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
                    <RideWithGpsId/>
                    <RwGpsTypeSelector visible={false}/>
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
        fetchingRoute: state.uiInfo.dialogParams.fetchingRoute,
        errorDetails:state.uiInfo.dialogParams.errorDetails,
        routeInfo:state.routeInfo,
        controlPoints:state.controls.userControlPoints,
        fetchingForecast: state.uiInfo.dialogParams.fetchingForecast,
        rwgpsRouteIsTrip:state.uiInfo.routeParams.rwgpsRouteIsTrip,
    });

const mapDispatchToProps = {
    loadFromRideWithGps, requestForecast, recalcRoute, setErrorDetails
};

export const decideValidationStateFor = RouteInfoForm.decideValidationStateFor;
export default connect(mapStateToProps, mapDispatchToProps, null, {pure:true})(RouteInfoForm);