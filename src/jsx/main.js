import React, {Component} from 'react';
import ControlPoints from './controls';
import RouteInfoForm from './routeInfoEntry';
import RouteForecastMap from './map';
import ForecastTable from './forecastTable';
import SplitPane from 'react-split-pane';
import MediaQuery from 'react-responsive';
// for react-splitter
import 'normalize.css/normalize.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';
import 'flatpickr/dist/themes/confetti.css';
import 'Images/style.css';
import {Button} from 'reactstrap';
import queryString from 'query-string';
import ErrorBoundary from './errorBoundary';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
// import cookie from 'react-cookies';
import LocationContext from './locationContext';

import {
    setActionUrl,
    setApiKeys,
    setFetchAfterLoad,
    setInterval,
    setMetric,
    setPace,
    setRwgpsRoute,
    setStart,
    setStravaActivity,
    setStravaError,
    setStravaToken,
    showForm,
    updateUserControls,
    loadCookie,
    saveCookie,
    toggleStravaAnalysis,
    loadFromRideWithGps,
    reset,
    newUserMode
} from "./actions/actions";
import QueryString from './queryString';
import PaceTable from './paceTable';

const demoRoute = 1797453;
const demoControls = [
    {
        "name": "Petaluma",
        "distance": 43.7,
        "duration": 20,
        "id": 0
    },
    {
        "name": "Valley Ford",
        "distance": 62.2,
        "duration": 20,
        "id": 1
    },
    {
        "name": "Point Reyes Station",
        "distance": 87.8,
        "duration": 20,
        "id": 2
    }
];

export class RouteWeatherUI extends Component {
    static propTypes = {
        setActionUrl:PropTypes.func.isRequired,
        setApiKeys:PropTypes.func.isRequired,
        updateControls:PropTypes.func.isRequired,
        formVisible:PropTypes.bool.isRequired,
        showForm:PropTypes.func.isRequired,
        showPacePerTme:PropTypes.bool.isRequired,
        setFetchAfterLoad:PropTypes.func.isRequired,
        toggleStravaAnalysis: PropTypes.func.isRequired,
        loadFromRideWithGps: PropTypes.func.isRequired,
        rwgpsRouteIsTrip: PropTypes.bool.isRequired,
        reset: PropTypes.func.isRequired,
        firstUse: PropTypes.bool.isRequired,
        newUserMode: PropTypes.func.isRequired,
        setRwgpsRoute: PropTypes.func.isRequired,
        setStravaToken: PropTypes.func.isRequired,
        setStart: PropTypes.func.isRequired,
        setPace: PropTypes.func.isRequired,
        setInterval: PropTypes.func.isRequired,
        setMetric: PropTypes.func.isRequired,
        setStravaActivity: PropTypes.func.isRequired,
        setStravaError: PropTypes.func.isRequired,
        prefixer: PropTypes.object,
        search: PropTypes.string.isRequired,
        action: PropTypes.string.isRequired,
        maps_api_key: PropTypes.string.isRequired,
        timezone_api_key: PropTypes.string.isRequired
    };

    constructor(props) {
        super(props);
        this.formatControlsForUrl = this.formatControlsForUrl.bind(this);

        const newUserMode = RouteWeatherUI.isNewUserMode(props.search);
        this.props.newUserMode(newUserMode);
        let queryParams = queryString.parse(props.search);
        RouteWeatherUI.updateFromQueryParams(this.props, queryParams);
        props.setActionUrl(props.action);
        props.setApiKeys(props.maps_api_key,props.timezone_api_key);
        this.props.updateControls(queryParams.controlPoints===undefined?[]:this.parseControls(queryParams.controlPoints));
        if (newUserMode) {
            RouteWeatherUI.loadCannedData(this.props);
        }
        this.state = {};
        if (typeof window !== 'undefined') {
            window.onpopstate = (event) => {
                if (event.state === null) {
                    this.props.reset();
                } else {
                    RouteWeatherUI.updateFromQueryParams(this.props, event.state);
                    if (event.state.rwgpsRoute !== undefined) {
                        this.props.loadFromRideWithGps(event.state.rwgpsRoute,this.props.rwgpsRouteIsTrip);
                    }
                }
            }
        }
    }

    static getStravaToken(queryParams) {
        if (queryParams.strava_token !== undefined) {
            saveCookie('strava_token', queryParams.strava_token);
            return queryParams.strava_token;
        } else {
            return loadCookie('strava_token');
        }
    }

    static formatOneControl(controlPoint) {
        if (typeof controlPoint === 'string') {
            return controlPoint;
        }
        return controlPoint.name + "," + controlPoint.distance + "," + controlPoint.duration;
    }

    formatControlsForUrl(controlPoints) {
        return controlPoints.reduce((queryParam,point) => {return RouteWeatherUI.formatOneControl(queryParam) + ':' + RouteWeatherUI.formatOneControl(point)},'');
    }

    static isNewUserMode(search) {
        return false;
        // return (search === '' && cookie.load('initialized') === undefined);
    }

    static loadCannedData(props) {
        props.setRwgpsRoute(demoRoute);
        props.setFetchAfterLoad(true);
        props.updateControls(demoControls);
    }

    parseControls(controlPointString) {
        let controlPointList = controlPointString.split(":");
        let controlPoints =
        controlPointList.map((point,index) => {
            let controlPointValues = point.split(",");
            return ({name:controlPointValues[0],distance:Number(controlPointValues[1]),duration:Number(controlPointValues[2]), id:index});
            });
        // delete dummy first element
        controlPoints.splice(0,1);
        return controlPoints;
    }

    static updateFromQueryParams(props, queryParams) {
        props.setRwgpsRoute(queryParams.rwgpsRoute);
        // force forecast fetch when our initial url contains a route number
        if (queryParams.rwgpsRoute !== undefined) {
            props.setFetchAfterLoad(true);
        }
        props.setStravaToken(RouteWeatherUI.getStravaToken(queryParams));
        props.setStart(queryParams.start);
        props.setPace(queryParams.pace);
        props.setInterval(queryParams.interval);
        props.setMetric(queryParams.metric==="true");
        props.setStravaActivity(queryParams.strava_activity);
        props.setStravaError(queryParams.strava_error);
        if (queryParams.strava_analysis !== undefined) {
            props.toggleStravaAnalysis();
        }
    }

    render() {
        const inputForm = (
            <ErrorBoundary>
                <RouteInfoForm formatControlsForUrl={this.formatControlsForUrl}/>
            </ErrorBoundary>
        );
        const formButton = (
            <Button color="primary" onClick={this.props.showForm}>Modify...</Button>
        );
        return (
        <div>
            <LocationContext.Consumer>
                {value => <QueryString href={value.href} origin={value.origin}/>}
            </LocationContext.Consumer>
                <SplitPane prefixer={this.props.prefixer} defaultSize={300} minSize={150} maxSize={530} split="horizontal">
                    <SplitPane prefixer={this.props.prefixer} defaultSize={550} minSize={150} split='vertical' pane2Style={{'overflow':'scroll'}}>
                        {inputForm}
                        <ErrorBoundary>
                            <ControlPoints/>
                        </ErrorBoundary>
                    </SplitPane>
                        <SplitPane prefixer={this.props.prefixer} defaultSize={545} minSize={150} split="vertical" paneStyle={{'overflow':'scroll'}}>
                            {this.props.showPacePerTme?<PaceTable/>:<ForecastTable/>}
                            <RouteForecastMap/>
                        </SplitPane>
                </SplitPane>
        </div>
      );
    }
}

const mapDispatchToProps = {
    setStravaToken, setActionUrl, setRwgpsRoute, setApiKeys, setStravaError, setStart, setPace, setInterval, setMetric,
    setStravaActivity, updateControls:updateUserControls, showForm, setFetchAfterLoad, toggleStravaAnalysis,
    loadFromRideWithGps, reset, newUserMode
};

const mapStateToProps = (state) =>
    ({
        formVisible: state.uiInfo.dialogParams.formVisible,
        showPacePerTme:state.controls.stravaAnalysis && state.strava.calculatedPaces !== null,
        rwgpsRouteIsTrip: state.uiInfo.routeParams.rwgpsRouteIsTrip,
        firstUse: state.params.newUserMode
    });

export default connect(mapStateToProps, mapDispatchToProps)(RouteWeatherUI);
