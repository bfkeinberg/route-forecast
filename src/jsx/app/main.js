import React, {Component, useEffect} from 'react';
import  {useMediaQuery} from 'react-responsive';
import "normalize.css/normalize.css";
import '@blueprintjs/core/lib/css/blueprint.css';
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import "@blueprintjs/select/lib/css/blueprint-select.css";
import 'Images/style.css';
import queryString from 'query-string';
import PropTypes from 'prop-types';
import { connect, useDispatch, useSelector } from 'react-redux';
import cookie from 'react-cookies';
import DesktopUI from '../DesktopUI';
import MobileUI from '../MobileUI';
import * as Sentry from "@sentry/react";
import {providerValues, actionUrlAdded, apiKeysSet, querySet, queryCleared, metricSet, showWeatherProviderSet,
    displayControlTableUiSet, rwgpsTokenSet, usePinnedRoutesSet, routeLoadingModeSet, startTimestampSet,
    rwgpsRouteSet,fetchAqiSet,zoomToRangeSet,stopAfterLoadSet,stravaTokenSet,stravaRefreshTokenSet,
    stravaErrorSet, stravaActivitySet, stravaRouteSet, reset} from "../../redux/reducer";
import {Info} from "luxon";

import {
    loadCookie,
    loadFromRideWithGps,
    saveCookie,
    setInterval,
    setPace,
    updateUserControls,
    setWeatherProvider,
    loadRouteFromURL,
} from "../../redux/actions";
import { routeLoadingModes } from '../../data/enums';
import { parseControls, inputPaceToSpeed } from '../../utils/util';
import { useForecastMutation } from '../../redux/forecastApiSlice';

export const saveRwgpsCredentials = (token) => {
    if ("credentials" in navigator && "PasswordCredential" in window && "store" in navigator.credentials) {

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
        updateControls:PropTypes.func.isRequired,
        routeLoadingModeSet: PropTypes.func.isRequired,
        loadFromRideWithGps: PropTypes.func.isRequired,
        rwgpsRouteIsTrip: PropTypes.bool.isRequired,
        reset: PropTypes.func.isRequired,
        rwgpsRouteSet: PropTypes.func.isRequired,
        stravaTokenSet: PropTypes.func.isRequired,
        startTimestampSet: PropTypes.func.isRequired,
        setWeatherProvider: PropTypes.func.isRequired,
        setPace: PropTypes.func.isRequired,
        setInterval: PropTypes.func.isRequired,
        metricSet: PropTypes.func.isRequired,
        stravaActivitySet: PropTypes.func.isRequired,
        stravaErrorSet: PropTypes.func.isRequired,
        search: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
        action: PropTypes.string.isRequired,
        maps_api_key: PropTypes.string.isRequired,
        timezone_api_key: PropTypes.string.isRequired,
        bitly_token: PropTypes.string.isRequired,
        rwgpsTokenSet:PropTypes.func.isRequired,
        zoomToRangeSet:PropTypes.func.isRequired,
        usePinnedRoutesSet:PropTypes.func.isRequired,
        stopAfterLoadSet:PropTypes.func.isRequired,
        fetchAqiSet:PropTypes.func,
        actionUrlAdded:PropTypes.func.isRequired,
        apiKeysSet:PropTypes.func.isRequired,
        querySet:PropTypes.func.isRequired,
        loadRouteFromURL:PropTypes.func.isRequired,
        stravaRouteSet:PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);

        let queryParams = queryString.parse(props.search);
        props.querySet({url:props.href,search:props.search})
        RouteWeatherUI.updateFromQueryParams(this.props, queryParams);
        props.actionUrlAdded(props.action);
        props.apiKeysSet({maps_api_key:props.maps_api_key,timezone_api_key:props.timezone_api_key, bitly_token:props.bitly_token});
        RouteWeatherUI.setupRideWithGps(props);
        props.updateControls(queryParams.controlPoints==undefined?[]:parseControls(queryParams.controlPoints,true));
        const zoomToRange = loadCookie('zoomToRange');
        if (zoomToRange !== undefined) {
            this.props.zoomToRangeSet(zoomToRange==="true");
        }
        const fetchAqi = loadCookie('fetchAqi');
        if (fetchAqi !== undefined) {
            this.props.fetchAqiSet(fetchAqi==="true");
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
                    // clear the state when back button takes us past any saved routes
                    this.props.reset();
                } else {
                    // reload previous or next route when moving throw browser history with forward or back buttons
                    let queryParams = queryString.parse(event.state);
                    props.querySet({url:props.href,search:event.state})
                    RouteWeatherUI.updateFromQueryParams(this.props, queryParams);
                    if (queryParams.rwgpsRoute !== undefined) {
                        this.props.loadRouteFromURL()
                        //this.props.loadFromRideWithGps(queryParams.rwgpsRoute,this.props.rwgpsRouteIsTrip);
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
                        props.rwgpsTokenSet(token);
                        saveRwgpsCredentials(token);
                    }
                } else {
                    console.info('credentials retrieved from credential manager');
                    props.rwgpsTokenSet(credentials.password);
                    saveRwgpsCredentials(credentials.password);
                }
            } catch (err) {
                console.info(`failed to load credentials with ${err}`);
                const token = loadCookie("rwgpsToken");
                if (token !== undefined) {
                    props.rwgpsTokenSet(token);
                    saveRwgpsCredentials(token);
                }
        }
        } else {
            const token = loadCookie("rwgpsToken");
            console.info('credentials manager not supported, retrieved from cookie');
        if (token !== undefined) {
                props.rwgpsTokenSet(token);
                saveRwgpsCredentials(token);
            }
        }
    }

    static getStravaToken(queryParams, props) {
        if (queryParams.strava_access_token !== undefined) {
            saveCookie('strava_access_token', queryParams.strava_access_token);
            saveCookie('strava_refresh_token', queryParams.strava_refresh_token);
            saveCookie('strava_token_expires_at', queryParams.strava_token_expires_at);
            props.stravaTokenSet({token:queryParams.strava_access_token, expires_at:queryParams.strava_token_expires_at});
            props.stravaRefreshTokenSet(queryParams.strava_refresh_token);
            return queryParams.strava_access_token;
        } else {
            const stravaToken = loadCookie('strava_access_token');
            props.stravaTokenSet(stravaToken, loadCookie('strava_token_expires_at'));
            props.stravaRefreshTokenSet(loadCookie('strava_refresh_token'));
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
        if (RouteWeatherUI.hasProvider(queryParams.provider)) {
            props.setWeatherProvider(queryParams.provider);
        } else {
            props.setWeatherProvider('visualcrossing');
        }
        props.rwgpsRouteSet(queryParams.rwgpsRoute);
        RouteWeatherUI.getStravaToken(queryParams,props);
        if (queryParams.startTimestamp !== undefined) {
            if (RouteWeatherUI.hasZone(queryParams.zone)) {
                props.startTimestampSet({start:queryParams.startTimestamp, zone:queryParams.zone});
            } else {
                props.startTimestampSet({start:queryParams.startTimestamp});
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
        props.metricSet(queryParams.metric==="true");
        props.stravaActivitySet(queryParams.strava_activity);
        props.stravaRouteSet(queryParams.strava_route)
        props.stravaErrorSet(queryParams.strava_error);
        if (queryParams.strava_analysis !== undefined) {
            props.routeLoadingModeSet(routeLoadingModes.STRAVA);
        }
        // make show weather provider "sticky"
        if (queryParams.showProvider !== undefined) {
            props.showWeatherProviderSet(queryParams.showProvider==="true");
            saveCookie("showWeatherProvider", queryParams.showProvider==="true");
        }
        else {
            let showWeatherProvider = loadCookie("showWeatherProvider");
            if (showWeatherProvider !== undefined) {
                props.showWeatherProviderSet(showWeatherProvider==="true");
            }
        }
        if (queryParams.rwgpsToken !== undefined) {
            props.rwgpsTokenSet(queryParams.rwgpsToken);
            // if we have just received an auth token then we previously clicked show pinned routes
            props.usePinnedRoutesSet(true);
            saveRwgpsCredentials(queryParams.rwgpsToken);
        }
        props.stopAfterLoadSet(queryParams.stopAfterLoad);
    }

    render() {
        return (
            <FunAppWrapperThingForHooksUsability maps_api_key={this.props.maps_api_key} queryParams={queryString.parse(this.props.search)}/>
        );
    }
}

const mapDispatchToProps = {
    stravaTokenSet, rwgpsRouteSet, stravaErrorSet, setPace, setInterval, metricSet,
    stravaActivitySet, updateControls:updateUserControls, routeLoadingModeSet, stravaRefreshTokenSet,
    loadFromRideWithGps, reset, setWeatherProvider, showWeatherProviderSet, rwgpsTokenSet, startTimestampSet,
    zoomToRangeSet, usePinnedRoutesSet, stopAfterLoadSet, fetchAqiSet, stravaRouteSet,
    actionUrlAdded, apiKeysSet, querySet, queryCleared, loadRouteFromURL
};

const mapStateToProps = (state) =>
    ({
        rwgpsRouteIsTrip: state.uiInfo.routeParams.rwgpsRouteIsTrip,
    });

export default connect(mapStateToProps, mapDispatchToProps)(RouteWeatherUI);

const useLoadRouteFromURL = (queryParams, forecastFunc) => {
    const dispatch = useDispatch()
    useEffect(() => {
        if (queryParams.rwgpsRoute || queryParams.strava_route) {
            dispatch(loadRouteFromURL(forecastFunc))
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
            dispatch(displayControlTableUiSet(true))
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
    const [forecast] = useForecastMutation()
    useSetPageTitle()
    useLoadRouteFromURL(queryParams, forecast)
    useLoadControlPointsFromURL(queryParams)
    const isLandscape = useMediaQuery({query:'(orientation:landscape)'})
    const isLargeEnough = useMediaQuery({query:'(min-width: 850px)'})
    return (
        <div>
            {isLandscape && isLargeEnough && <DesktopUI mapsApiKey={maps_api_key} />}
            {(!isLargeEnough || !isLandscape) && <MobileUI mapsApiKey={maps_api_key} />}
        </div>
    )
}

FunAppWrapperThingForHooksUsability.propTypes = {
        maps_api_key: PropTypes.string.isRequired,
        queryParams: PropTypes.object.isRequired
};
