import {Spinner, Button} from '@blueprintjs/core';
//import { Tooltip2 } from "@blueprintjs/popover2";
import {Alert, Form, Card, CardBody, CardTitle, Col, Row, Container} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, {Component, Suspense} from 'react';
import ShortUrl from './ui/shortUrl';
import MediaQuery from 'react-responsive';
import PropTypes from 'prop-types';
import {loadFromRideWithGps, saveCookie} from './actions/actions';
import {connect} from 'react-redux';
import PaceExplanation from './paceExplanation';
import Donation from './ui/donationRequest';
import ForecastInterval from './ui/forecastInterval';
import RidingPace from './ui/ridingPace';
import Recalculate from './recalculate';
import RideWithGpsId from './ui/rideWithGpsId';
import RwGpsTypeSelector from './ui/rwGpsTypeSelector';
import ForecastButton from './ui/forecastButton';
import AnalysisButton from './ui/analysisButton';
import StravaDialog from './stravaDialog';
import BugReportButton from './ui/bugReportButton';
import WeatherProvider from './ui/providerSelector';
import PinnedRouteLoader from './ui/pinnedRouteLoader.jsx';
import ErrorBoundary from "./errorBoundary";
import {lazy} from '@loadable/component';
import {componentLoader} from "./actions/actions.js";

const LoadableDatePicker = lazy(() => componentLoader(import(/* webpackChunkName: "DateSelect" */ /* webpackPrefetch: true */ './ui/dateSelect'), 5));

const DatePickerLoader = (props) => {
     return <Suspense fallback={<div>Loading date-time picker...</div>}>
        <LoadableDatePicker {...props}/>
     </Suspense>
};

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
        loadFromRideWithGps:PropTypes.func.isRequired,
        firstUse:PropTypes.bool.isRequired,
        routeSelected:PropTypes.bool.isRequired,
        needToViewTable: PropTypes.bool.isRequired,
        showProvider: PropTypes.bool.isRequired,
        routeProps:PropTypes.object,
        loadingPinnedRoutes:PropTypes.bool.isRequired,
        rwgpsToken:PropTypes.string
    };

    constructor(props) {
        super(props);
        this.state = {showPinnedRoutes:props.rwgpsToken !== null};
    }

    componentDidMount() {
        if (this.props.rwgpsRoute !== '') {
            this.props.loadFromRideWithGps(this.props.rwgpsRoute,this.props.rwgpsRouteIsTrip);
        }
    }

    componentDidUpdate() {
        if (this.props.rwgpsRoute !== '' && !this.props.routeSelected) {
            this.props.loadFromRideWithGps(this.props.rwgpsRoute,this.props.rwgpsRouteIsTrip);
        }
        if (this.props.routeProps != null && this.props.routeProps.history != null && this.props.needToViewTable) {
            this.props.routeProps.history.replace('/table/')
        }
    }

    static getDerivedStateFromProps(nextProps) {
        if (nextProps.routeInfo.name !== '') {
            document.title = `Forecast for ${nextProps.routeInfo.name}`;
            if (!nextProps.firstUse && nextProps.controlPoints !== '' && nextProps.controlPoints.length !== 0) {
                saveCookie(nextProps.routeInfo.name, nextProps.formatControlsForUrl(nextProps.controlPoints));
            }
        }
        return null;
    }

    static showErrorDetails(errorState) {
        if (errorState !== null) {
            return (
                <Alert style={{padding:'10px'}} color="danger">{errorState}</Alert>
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
        if (value !== '' && value !== null) {
            // is this just a number or a full url?
            let route = parseInt(value);
            if (isNaN(route)) {
                route = value.split('/').map(part => parseInt(part)).find(val => !isNaN(val));
            }
            return route;
        }
        return value;
    }

    static decideValidationStateFor(type, methodUsed, loadingSuccess) {
        if (type === methodUsed) {
            if (loadingSuccess) {
                return {'valid':null};
            } else {
                return {'invalid':null};
            }
        } else {
            return null;
        }
    }

    render() {
        const header = (<div style={{textAlign:"center",'fontSize':'90%'}}>Forecast and time estimate</div>);
        const providerButton = this.props.showProvider?<Col sm={{size:"auto"}}><WeatherProvider/></Col>:null;

        return (
            <div>
                <Card>
                    <CardBody>
                        <CardTitle className='dlgTitle' tag='h6'>{header}</CardTitle>
                    <Form inline id="forecast_form">
                        <Row>
                            <Col>
                                <DatePickerLoader/>
                                <Recalculate/>
                            </Col>
                        </Row>
                        <Row>
                            <Col sm="5">
                                <ForecastInterval/>
                            </Col>
                            <Col sm="4">
                                <RidingPace/>
                            </Col>
                            <MediaQuery minDeviceWidth={501}>
                                <Col sm="1">
                                    <PaceExplanation/>
                                </Col>
                            </MediaQuery>
                        </Row>
                        <Row noGutters>
                            <Col sm={{size:"auto"}}>
                                {this.state.showPinnedRoutes?null:<RideWithGpsId/>}
                            </Col>
                            <Col sm={{size:"auto"}}>
                                <ErrorBoundary>
                                    <Button intent="primary"
                                            small={true}
                                            outlined={this.state.showPinnedRoutes}
                                            active={this.state.showPinnedRoutes}
                                            icon="star"
                                            loading={this.props.loadingPinnedRoutes}
                                            text={this.state.showPinnedRoutes?"Don't use pinned routes":"Use pinned routes"}
                                            onClick={()=>this.setState({showPinnedRoutes:!this.state.showPinnedRoutes})}/>
                                <PinnedRouteLoader showPinnedRoutes={this.state.showPinnedRoutes}/>
                                </ErrorBoundary>
                            </Col>
                            {providerButton}
                            <Col size={{size:"auto"}}>
                                <RwGpsTypeSelector visible={false}/>
                            </Col>
                            <Col size={{size:"auto"}}>
                                <ForecastButton/>
                            </Col>
                        </Row>
                        {RouteInfoForm.showErrorDetails(this.props.errorDetails)}
                        {RouteInfoForm.showProgressSpinner(this.props.fetchingRoute)}
                    </Form>
                    <MediaQuery maxDeviceWidth={500}>
                        <ShortUrl/>
                    </MediaQuery>
                    </CardBody>
                </Card>
            <MediaQuery minDeviceWidth={501}>
                <Container fluid={true}>
                    <Row className="justify-content-sm-between">
                        <Col sm={{size:"auto"}}>
                            <ShortUrl/>
                        </Col>
                        <Col>
                            <AnalysisButton/>
                            <StravaDialog/>
                        </Col>
                        <Col>
                            <Donation/>
                        </Col>
                        <Col>
                            <BugReportButton/>
                        </Col>
                    </Row>
                </Container>
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
        controlPoints:state.controls.userControlPoints,
        firstUse: state.params.newUserMode,
        routeSelected: state.uiInfo.dialogParams.loadingSource !== null,
        needToViewTable:state.forecast.valid && !state.forecast.tableViewed,
        showProvider:state.controls.showWeatherProvider,
        loadingPinnedRoutes:state.rideWithGpsInfo.loadingRoutes,
        rwgpsToken:state.rideWithGpsInfo.token
    });

const mapDispatchToProps = {
    loadFromRideWithGps
};

export const decideValidationStateFor = RouteInfoForm.decideValidationStateFor;
export const getRouteNumberFromValue = RouteInfoForm.getRouteNumberFromValue;
export default connect(mapStateToProps, mapDispatchToProps, null, {pure:true})(RouteInfoForm);
