import React, {Component} from 'react';
import MediaQuery from 'react-responsive';
import '@blueprintjs/core/lib/css/blueprint.css';
import 'Images/style.css';
import 'Images/controlsStyles.css';
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
    setStravaRefreshToken,
    setWeatherProvider,
    showWeatherProvider,
    setRwgpsCredentials,
    setStartTimestamp,
    setZoomToRange
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
        setStartTimestamp: PropTypes.func.isRequired,
        setWeatherProvider: PropTypes.func.isRequired,
        setPace: PropTypes.func.isRequired,
        setInterval: PropTypes.func.isRequired,
        setMetric: PropTypes.func.isRequired,
        setStravaActivity: PropTypes.func.isRequired,
        setStravaError: PropTypes.func.isRequired,
        search: PropTypes.string.isRequired,
        action: PropTypes.string.isRequired,
        maps_api_key: PropTypes.string.isRequired,
        timezone_api_key: PropTypes.string.isRequired,
        bitly_token: PropTypes.string.isRequired,
        setRwgpsCredentials:PropTypes.func.isRequired,
        setZoomToRange:PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);

        const newUserMode = RouteWeatherUI.isNewUserMode(props.search);
        this.props.newUserMode(newUserMode);
        let queryParams = queryString.parse(props.search);
        RouteWeatherUI.updateFromQueryParams(this.props, queryParams);
        props.setActionUrl(props.action);
        props.setApiKeys(props.maps_api_key,props.timezone_api_key, props.bitly_token);
        RouteWeatherUI.setupRideWithGps(props);
        this.props.updateControls(queryParams.controlPoints==undefined?[]:this.parseControls(queryParams.controlPoints));
        if (newUserMode) {
            RouteWeatherUI.loadCannedData(this.props);
        }
        const zoomToRange = loadCookie('zoomToRange');
        if (zoomToRange !== undefined) {
            this.props.setZoomToRange(zoomToRange);
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

    static async setupRideWithGps(props) {
        let credentials = null;
        if ("PasswordCredential" in window && "PublicKeyCredential" in window) {
            try {
                credentials = await navigator.credentials.get({password:true,mediation:"silent"});
                if (credentials === null) {
                    const user = loadCookie("rwgpsUsername");
                    const password = loadCookie("rwgpsPassword");
                    console.info('credentials retrieved from cookie');
                    if (user !== undefined && password !== undefined) {
                        props.setRwgpsCredentials(user,password);
                    }
                } else {
                    console.info('credentials retrieved from credential manager');
                    props.setRwgpsCredentials(credentials.name, credentials.password);
                }
            } catch (err) {
                console.info(`failed to load credentials with ${err}`);
                const user = loadCookie("rwgpsUsername");
                const password = loadCookie("rwgpsPassword");
                if (user !== undefined && password !== undefined) {
                    props.setRwgpsCredentials(user,password);
                }
            }
        } else {
            const user = loadCookie("rwgpsUsername");
            const password = loadCookie("rwgpsPassword");
            console.info('credentials manager not supported, retrieved from cookie');
            if (user !== undefined && password !== undefined) {
                props.setRwgpsCredentials(user,password);
            }
        }
    }

    static getStravaToken(queryParams, props) {
        if (queryParams.strava_access_token !== undefined) {
            saveCookie('strava_access_token', queryParams.strava_access_token);
            saveCookie('strava_refresh_token', queryParams.strava_refresh_token);
            saveCookie('strava_token_expires_at', queryParams.strava_token_expires_at);
            props.setStravaToken(queryParams.strava_access_token, queryParams.strava_token_expires_at);
            props.setStravaRefreshToken(queryParams.strava_refresh_token);
            return queryParams.strava_access_token;
        } else {
            const stravaToken = loadCookie('strava_access_token');
            props.setStravaToken(stravaToken, loadCookie('strava_token_expires_at'));
            props.setStravaRefreshToken(loadCookie('strava_refresh_token'));
            return stravaToken;
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
        controlPointList.filter(item => item.length > 0).
        filter(point => {const values = point.split(","); return !isNaN(values[1]) && !isNaN(values[2])}).
        map((point,index) => {
            let controlPointValues = point.split(",");
            return ({name:controlPointValues[0],distance:Number(controlPointValues[1]),duration:Number(controlPointValues[2]), id:index});
            });
        // delete dummy first element
        // controlPoints.splice(0,1);
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
        if (queryParams.startTimestamp !== undefined) {
            if (queryParams.zone !== undefined) {
                props.setStartTimestamp(queryParams.startTimestamp, queryParams.zone);
            } else {
                props.setStartTimestamp(queryParams.startTimestamp);
            }
        }
        else if (queryParams.start !== undefined) {
            if (queryParams.zone !== undefined) {
                props.setInitialStart(queryParams.start, queryParams.zone);
            } else {
                props.setInitialStart(queryParams.start);
            }
        }
        if (queryParams.pace !== undefined) {
            props.setPace(queryParams.pace.trim());
        } else {
            let lastPace = loadCookie("pace");
            if (lastPace !== undefined) {
                props.setPace(lastPace);
            }
        }
        props.setInterval(queryParams.interval);
        props.setMetric(queryParams.metric==="true");
        props.setStravaActivity(queryParams.strava_activity);
        props.setStravaError(queryParams.strava_error);
        if (queryParams.strava_analysis !== undefined) {
            props.toggleStravaAnalysis();
        }
        if (queryParams.provider !== undefined) {
            props.setWeatherProvider(queryParams.provider);
        }
        if (queryParams.showProvider !== undefined) {
            props.showWeatherProvider(queryParams.showProvider==="true");
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
    loadFromRideWithGps, reset, newUserMode, setWeatherProvider, showWeatherProvider, setRwgpsCredentials, setStartTimestamp,
    setZoomToRange
};

const mapStateToProps = (state) =>
    ({
        showPacePerTme:state.controls.stravaAnalysis && state.strava.calculatedPaces !== null,
        rwgpsRouteIsTrip: state.uiInfo.routeParams.rwgpsRouteIsTrip,
        firstUse: state.params.newUserMode
    });

export default connect(mapStateToProps, mapDispatchToProps)(RouteWeatherUI);
