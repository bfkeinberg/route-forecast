import React, {Component} from 'react';
import MediaQuery from 'react-responsive';
// for react-splitter
import 'normalize.css/normalize.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-fresh.css';
import 'flatpickr/dist/themes/confetti.css';
import 'Images/style.css';
import queryString from 'query-string';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
// import cookie from 'react-cookies';
import LocationContext from './locationContext';
import DesktopUI from './DesktopUI';
import MobileUI from './MobileUI';

import {
    loadCookie,
    loadFromRideWithGps,
    newUserMode,
    reset,
    saveCookie,
    setActionUrl,
    setApiKeys,
    setFetchAfterLoad,
    setInitialStart,
    setInterval,
    setMetric,
    setPace,
    setRwgpsRoute,
    setStravaActivity,
    setStravaError,
    setStravaToken,
    toggleStravaAnalysis,
    updateUserControls,
    setStravaRefreshToken
} from "./actions/actions";
import QueryString from './queryString';

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
        setInitialStart: PropTypes.func.isRequired,
        setPace: PropTypes.func.isRequired,
        setInterval: PropTypes.func.isRequired,
        setMetric: PropTypes.func.isRequired,
        setStravaActivity: PropTypes.func.isRequired,
        setStravaError: PropTypes.func.isRequired,
        search: PropTypes.string.isRequired,
        action: PropTypes.string.isRequired,
        maps_api_key: PropTypes.string.isRequired,
        timezone_api_key: PropTypes.string.isRequired,
        bitly_token: PropTypes.string.isRequired
    };

    constructor(props) {
        super(props);

        const newUserMode = RouteWeatherUI.isNewUserMode(props.search);
        this.props.newUserMode(newUserMode);
        let queryParams = queryString.parse(props.search);
        RouteWeatherUI.updateFromQueryParams(this.props, queryParams);
        props.setActionUrl(props.action);
        props.setApiKeys(props.maps_api_key,props.timezone_api_key, props.bitly_token);
        this.props.updateControls(queryParams.controlPoints==undefined?[]:this.parseControls(queryParams.controlPoints));
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

    static getStravaToken(queryParams, props) {
        if (queryParams.strava_access_token !== undefined) {
            saveCookie('strava_access_token', queryParams.strava_access_token);
            saveCookie('strava_refresh_token', queryParams.strava_refresh_token);
            props.setStravaToken(queryParams.strava_access_token, queryParams.strava_token_expires_at);
            props.setStravaRefreshToken(queryParams.strava_refresh_token);
            return queryParams.strava_access_token;
        } else {
            return loadCookie('strava_access_token');
        }
    }

    static formatOneControl(controlPoint) {
        if (typeof controlPoint === 'string') {
            return controlPoint;
        }
        return controlPoint.name + "," + controlPoint.distance + "," + controlPoint.duration;
    }

    formatControlsForUrl = (controlPoints) => {
        return controlPoints.reduce((queryParam,point) => {return RouteWeatherUI.formatOneControl(queryParam) + ':' + RouteWeatherUI.formatOneControl(point)},'');
    };

    static isNewUserMode(/*search*/) {
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
        if (queryParams === undefined) {
            return;
        }
        props.setRwgpsRoute(queryParams.rwgpsRoute);
        // force forecast fetch when our initial url contains a route number
        if (queryParams.rwgpsRoute !== undefined) {
            props.setFetchAfterLoad(true);
        }
        RouteWeatherUI.getStravaToken(queryParams,props);
        props.setInitialStart(queryParams.start);
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
        return (
        <div>
            <LocationContext.Consumer>
                {value => <QueryString href={value.href} origin={value.origin}/>}
            </LocationContext.Consumer>

            {/*TODO: values is needed for SSR, but messes up real device detection, seemingly*/}
            {/*<MediaQuery minDeviceWidth={1000} values={{deviceWidth:1400}}>*/}
            <MediaQuery minWidth={501}>
                <DesktopUI formatControlsForUrl={this.formatControlsForUrl} showPacePerTme={this.props.showPacePerTme}
                           mapsApiKey={this.props.maps_api_key}/>
            </MediaQuery>
            {/*<MediaQuery maxDeviceWidth={800} values={{deviceWidth:1400}}>*/}
            <MediaQuery maxWidth={500}>
                <MobileUI formatControlsForUrl={this.formatControlsForUrl} mapsApiKey={this.props.maps_api_key}/>
            </MediaQuery>
        </div>
      );
    }
}

const mapDispatchToProps = {
    setStravaToken, setActionUrl, setRwgpsRoute, setApiKeys, setStravaError, setInitialStart, setPace, setInterval, setMetric,
    setStravaActivity, updateControls:updateUserControls, setFetchAfterLoad, toggleStravaAnalysis, setStravaRefreshToken,
    loadFromRideWithGps, reset, newUserMode
};

const mapStateToProps = (state) =>
    ({
        showPacePerTme:state.controls.stravaAnalysis && state.strava.calculatedPaces !== null,
        rwgpsRouteIsTrip: state.uiInfo.routeParams.rwgpsRouteIsTrip,
        firstUse: state.params.newUserMode
    });

export default connect(mapStateToProps, mapDispatchToProps)(RouteWeatherUI);
