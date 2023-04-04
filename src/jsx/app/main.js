import React, {Component, useEffect} from 'react';
import MediaQuery from 'react-responsive';
import '@blueprintjs/core/lib/css/blueprint.css';
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css"
import 'Images/style.css';
import queryString from 'query-string';
import PropTypes from 'prop-types';
import { connect, useDispatch, useSelector } from 'react-redux';
import cookie from 'react-cookies';
import LocationContext from '../locationContext';
import DesktopUI from '../DesktopUI';
import MobileUI from '../MobileUI';
import * as Sentry from "@sentry/react";
import {providerValues} from "../../redux/reducer";
import {Info} from "luxon";

import {
    loadCookie,
    loadFromRideWithGps,
    reset,
    saveCookie,
    setActionUrl,
    setApiKeys,
    setInitialStart,
    setInterval,
    setMetric,
    setPace,
    setRwgpsRoute,
    setStravaActivity,
    setStravaError,
    setStravaToken,
    setRouteLoadingMode,
    updateUserControls,
    setStravaRefreshToken,
    setWeatherProvider,
    showWeatherProvider,
    setStartTimestamp,
    setZoomToRange,
    loadRouteFromURL,
    setDisplayControlTableUI,
    setRwgpsToken,
    setUsePinnedRoutes,
    setStopAfterLoad,
    setFetchAqi
} from "../../redux/actions";
import QueryString from './QueryString';
import { routeLoadingModes } from '../../data/enums';
import { /*formatControlsForUrl, */parseControls, inputPaceToSpeed } from '../../utils/util';

export const saveRwgpsCredentials = (token) => {
    if ("credentials" in navigator && "PasswordCredential" in window) {

        // eslint-disable-next-line no-undef
        let credential = new PasswordCredential({
            id: 'ridewithgps',
            name:'ridewithgps',
            password:token
        });

        navigator.credentials.store(credential).then(() => {
        console.info("Credential stored in the user agent's credential manager.");
        }, (err) => {
            console.error("Error while storing the credential: ", err);
        });
    } else {
        cookie.save('rwgpsToken', token, { path: '/' });
        console.info('credentials stored in cookie');
    }
};


export class RouteWeatherUI extends Component {
    static propTypes = {
        setActionUrl:PropTypes.func.isRequired,
        setApiKeys:PropTypes.func.isRequired,
        updateControls:PropTypes.func.isRequired,
        setRouteLoadingMode: PropTypes.func.isRequired,
        loadFromRideWithGps: PropTypes.func.isRequired,
        rwgpsRouteIsTrip: PropTypes.bool.isRequired,
        reset: PropTypes.func.isRequired,
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
        setRwgpsToken:PropTypes.func.isRequired,
        setZoomToRange:PropTypes.func.isRequired,
        setUsePinnedRoutes:PropTypes.func.isRequired,
        setStopAfterLoad:PropTypes.func.isRequired,
        setFetchAqi:PropTypes.func
    };

    constructor(props) {
        super(props);

        let queryParams = queryString.parse(props.search);
        RouteWeatherUI.updateFromQueryParams(this.props, queryParams);
        props.setActionUrl(props.action);
        props.setApiKeys(props.maps_api_key,props.timezone_api_key, props.bitly_token);
        RouteWeatherUI.setupRideWithGps(props);
        props.updateControls(queryParams.controlPoints==undefined?[]:parseControls(queryParams.controlPoints,true));
        const zoomToRange = loadCookie('zoomToRange');
        if (zoomToRange !== undefined) {
            this.props.setZoomToRange(zoomToRange);
        }
        const fetchAqi = loadCookie('fetchAqi');
        if (fetchAqi !== undefined) {
            this.props.setFetchAqi(fetchAqi);
        }
        this.state = {};
        if (typeof window !== 'undefined') {
            window.onpopstate = (event) => {
                Sentry.addBreadcrumb({
                    category:'history',
                    level: "info",
                    data:JSON.stringify(event.state),
                    message:document.location
                });

                if (event.state == null) {
                    this.props.reset();
                } else {
                    // TODO
                    // don't think this is necessary (anymore?) -- but check with father
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
                    const token = loadCookie("rwgpsToken");
                    console.info('credentials retrieved from cookie');
                    if (token !== undefined) {
                        props.setRwgpsToken(token);
                        saveRwgpsCredentials(token);
                    }
                } else {
                    console.info('credentials retrieved from credential manager');
                    props.setRwgpsToken(credentials.password);
                    saveRwgpsCredentials(credentials.password);
                }
            } catch (err) {
                console.info(`failed to load credentials with ${err}`);
                const token = loadCookie("rwgpsToken");
                if (token !== undefined) {
                    props.setRwgpsToken(token);
                    saveRwgpsCredentials(token);
                }
        }
        } else {
            const token = loadCookie("rwgpsToken");
            console.info('credentials manager not supported, retrieved from cookie');
        if (token !== undefined) {
                props.setRwgpsToken(token);
                saveRwgpsCredentials(token);
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

    static hasZone(zone) {
        return zone !== undefined && Info.isValidIANAZone(zone);
    }

    static hasProvider(provider) {
        return provider !== undefined &&
            Object.keys(providerValues).includes(provider)

    }

    static updateFromQueryParams(props, queryParams) {
        if (queryParams === undefined) {
            return;
        }
        props.setRwgpsRoute(queryParams.rwgpsRoute);
        RouteWeatherUI.getStravaToken(queryParams,props);
        if (queryParams.startTimestamp !== undefined) {
            if (RouteWeatherUI.hasZone(queryParams.zone)) {
                props.setStartTimestamp(queryParams.startTimestamp, queryParams.zone);
            } else {
                props.setStartTimestamp(queryParams.startTimestamp);
            }
        }
        else if (queryParams.start !== undefined) {
            if (RouteWeatherUI.hasZone(queryParams.zone)) {
                props.setInitialStart(queryParams.start, queryParams.zone);
            } else {
                props.setInitialStart(queryParams.start);
            }
        }
        if (queryParams.pace !== undefined && inputPaceToSpeed[queryParams.pace.trim()] !== undefined) {
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
            props.setRouteLoadingMode(routeLoadingModes.STRAVA);
        }
        if (RouteWeatherUI.hasProvider(queryParams.provider)) {
            props.setWeatherProvider(queryParams.provider);
        } else {
            props.setWeatherProvider('weatherapi');
        }
        // make show weather provider "sticky"
        if (queryParams.showProvider !== undefined) {
            props.showWeatherProvider(queryParams.showProvider==="true");
            saveCookie("showWeatherProvider", queryParams.showProvider==="true");
        }
        else {
            let showWeatherProvider = loadCookie("showWeatherProvider");
            if (showWeatherProvider !== undefined) {
                props.showWeatherProvider(showWeatherProvider);
            }
        }
        if (queryParams.rwgpsToken !== undefined) {
            props.setRwgpsToken(queryParams.rwgpsToken);
            // if we have just received an auth token then we previously clicked show pinned routes
            props.setUsePinnedRoutes(true);
            saveRwgpsCredentials(queryParams.rwgpsToken);
        }
        props.setStopAfterLoad(queryParams.stopAfterLoad);
    }

    render() {
        return (
            <FunAppWrapperThingForHooksUsability maps_api_key={this.props.maps_api_key} queryParams={queryString.parse(this.props.search)}/>
        );
    }
}

const mapDispatchToProps = {
    setStravaToken, setActionUrl, setRwgpsRoute, setApiKeys, setStravaError, setInitialStart, setPace, setInterval, setMetric,
    setStravaActivity, updateControls:updateUserControls, setRouteLoadingMode, setStravaRefreshToken,
    loadFromRideWithGps, reset, setWeatherProvider, showWeatherProvider, setRwgpsToken, setStartTimestamp,
    setZoomToRange, setUsePinnedRoutes, setStopAfterLoad, setFetchAqi
};

const mapStateToProps = (state) =>
    ({
        rwgpsRouteIsTrip: state.uiInfo.routeParams.rwgpsRouteIsTrip,
    });

export default connect(mapStateToProps, mapDispatchToProps)(RouteWeatherUI);

const useLoadRouteFromURL = (queryParams) => {
    const dispatch = useDispatch()
    useEffect(() => {
        if (queryParams.rwgpsRoute !== undefined) {
            dispatch(loadRouteFromURL())
        }
    }, [queryParams])
}

const useLoadControlPointsFromURL = (queryParams) => {

    const dispatch = useDispatch()
    useEffect(() => {
        if (queryParams.controlPoints === undefined || queryParams.controlPoints === "") {
            dispatch(updateUserControls([]))
        } else {
            dispatch(updateUserControls(parseControls(queryParams.controlPoints, false)))
            dispatch(setDisplayControlTableUI(true))
        }
    }, [queryParams])
}

const useSetPageTitle = () => {

    const routeInfo = useSelector(state => state.routeInfo)

    useEffect(() => {
        if (routeInfo.name !== '') {
            document.title = `Forecast for ${routeInfo.name}`;
        }
    }, [routeInfo.name])
}

const FunAppWrapperThingForHooksUsability = ({maps_api_key, queryParams}) => {
    // TODO
    // this is causing obnoxious bugs -- can we just cut it?
    // useSaveControlsToCookie()
    useSetPageTitle()
    useLoadRouteFromURL(queryParams)
    useLoadControlPointsFromURL(queryParams)

    return (
        <div>
            <LocationContext.Consumer>
                {value => <QueryString href={value.href} origin={value.origin} />}
            </LocationContext.Consumer>
            <MediaQuery minWidth={501}>
                <DesktopUI mapsApiKey={maps_api_key} />
            </MediaQuery>
            <MediaQuery maxWidth={500}>
                <MobileUI mapsApiKey={maps_api_key} />
            </MediaQuery>
        </div>
    )
}

FunAppWrapperThingForHooksUsability.propTypes = {
        maps_api_key: PropTypes.string.isRequired,
        queryParams: PropTypes.object.isRequired
};

// Commented out below because evaluating permanently removing the feature of saving off controls
// const useSaveControlsToCookie = () => {

//     const controlPoints = useSelector(state => state.controls.userControlPoints)
//     const routeInfo = useSelector(state => state.routeInfo)

//     useEffect(() => {
//         if (routeInfo.name !== '') {
//             document.title = `Forecast for ${routeInfo.name}`;
//             if (controlPoints !== '' && controlPoints.length !== 0) {
//                 saveCookie(routeInfo.name, formatControlsForUrl(controlPoints, false));
//             }
//         }
//     }, [
// routeInfo.name,
// controlPoints
// ])
// }
