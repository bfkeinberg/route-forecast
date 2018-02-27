import {Spinner} from '@blueprintjs/core';
import {Alert, Form, Card, CardBody, CardTitle} from 'reactstrap';
import React, {Component} from 'react';
import ShortUrl from './ui/shortUrl';
import MediaQuery from 'react-responsive';
import PropTypes from 'prop-types';
import {loadFromRideWithGps, setErrorDetails} from './actions/actions';
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
import ForecastButton from './ui/forecastButton';
import Strava from 'Images/api_logo_pwrdBy_strava_stack_light.png';

class RouteInfoForm extends Component {
    static propTypes = {
        rwgpsRoute:PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.oneOf([''])
        ]),
        rwgpsRouteIsTrip: PropTypes.bool.isRequired,
        controlPoints:PropTypes.arrayOf(PropTypes.object).isRequired,
        formatControlsForUrl:PropTypes.func.isRequired,
        fetchingRoute:PropTypes.bool,
        errorDetails:PropTypes.string,
        routeInfo:PropTypes.shape({name:PropTypes.string}),
        loadFromRideWithGps:PropTypes.func.isRequired
    };

    static contextTypes = {
        store: PropTypes.object
    };

    constructor(props) {
        super(props);
        this.state = {};
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

    static decideValidationStateFor(type, methodUsed, loadingSuccess) {
        if (type === methodUsed) {
            if (loadingSuccess) {
                return 'valid';
            } else {
                return 'invalid';
            }
        } else {
            return null;
        }
    }

    render() {
        const header = (<div style={{textAlign:"center",'fontSize':'99%'}}>Forecast and time estimate</div>);
        return (
            <div style={{display:'flex',flexFlow:'row wrap',justifyContent:'space-between',alignItems:'center',alignContent:'space-between',margin:'10px'}}>
                <Card style={{marginBottom:'0'}}>
                    <CardBody>
                        <CardTitle>{header}</CardTitle>
                    <Form inline id="forecast_form">
                        <DateSelect/>
                        <Recalculate/>
                        <ForecastInterval/>
                        <RidingPace/>
                        <PaceExplanation/>
                        <FileInput/>
                        <RideWithGpsId/>
                        <RwGpsTypeSelector visible={false}/>
                        <ForecastButton/>
                        {RouteInfoForm.showErrorDetails(this.props.errorDetails)}
                        {RouteInfoForm.showProgressSpinner(this.props.fetchingRoute)}
                    </Form>
                    <MediaQuery maxDeviceWidth={800}>
                        <ShortUrl/>
                    </MediaQuery>
                    </CardBody>
                </Card>
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
        rwgpsRouteIsTrip: state.uiInfo.routeParams.rwgpsRouteIsTrip,
        fetchingRoute: state.uiInfo.dialogParams.fetchingRoute,
        errorDetails:state.uiInfo.dialogParams.errorDetails,
        routeInfo:state.routeInfo,
        controlPoints:state.controls.userControlPoints
    });

const mapDispatchToProps = {
    loadFromRideWithGps, setErrorDetails
};

export const decideValidationStateFor = RouteInfoForm.decideValidationStateFor;
export default connect(mapStateToProps, mapDispatchToProps, null, {pure:true})(RouteInfoForm);