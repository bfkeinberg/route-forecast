import { RootState } from "../jsx/app/topLevel";
import { AppDispatch } from "../jsx/app/topLevel";
import ReactGA from "react-ga4";
import { GpxRouteData } from "./routeInfoSlice";
import * as Sentry from "@sentry/react";
import { routeLoadingBegun } from "./dialogParamsSlice";
import { gpxRouteLoaded } from "./routeInfoSlice";
import { stravaFetchBegun, stravaFetched, stravaFetchFailed, stravaActivitySet, stravaTokenSet } from "./stravaSlice";
import { stravaErrorSet, errorDetailsSet, gpxRouteLoadingFailed } from "./dialogParamsSlice";
import { Api } from 'rest-api-handler';
import queryString from 'query-string'

const getStravaParser = async function() {
    const parser = await import(/* webpackChunkName: "StravaRouteParser" */ '../utils/stravaRouteParser');
    return parser.default;
};

const stravaTokenTooOld = (getState: () => RootState) => {
    if (getState().strava.expires_at == null) {
        return false;
    }
    return (getState().strava.expires_at! < Math.round(Date.now()/1000));
};

export const refreshOldToken = (dispatch : AppDispatch, getState: () => RootState) => {
    if (stravaTokenTooOld(getState)) {
        return new Promise<string|null>((resolve, reject) => {
            fetch(`/refreshStravaToken?refreshToken=${getState().strava.refresh_token}`).then(response => {
                if (response.status === 200) {
                    return response.json();
                }
            }).then(response => {
                if (response === undefined) {
                    dispatch(stravaErrorSet(Error("Received undefined response from Strava auth service")));
                    reject(Error("Received undefined response from Strava auth service"));
                }
                else {
                    dispatch(stravaTokenSet({token:response.access_token, expires_at:response.expires_at}));
                    resolve(response.access_token);
                }
            }, error => {
                dispatch(stravaErrorSet(error));
                reject(error);
            });
        });
    } else {
        return new Promise<string|null>((resolve) => {resolve(getState().strava.access_token)});
    }
}

export const loadStravaActivity = function() {
    return async function (dispatch : AppDispatch, getState: () => RootState) {
        const parser = await getStravaParser().catch((err) => {
            dispatch(stravaFetchFailed(err));
            return null
        });
        // handle failed load, error has already been dispatched
        if (parser == null) {
            return Promise.resolve(Error('Cannot load parser'));
        }

        const access_token = await refreshOldToken(dispatch, getState)
        if (!access_token) {
            dispatch(stravaFetchFailed(Error("Failed to get Strava access token")));
            dispatch(stravaActivitySet(''))
            return
        }
        dispatch(stravaFetchBegun());
        const activityId = getState().strava.activity
        ReactGA.event('login', {method:activityId});
        return parser.fetchStravaActivity(activityId, access_token).then(result => {
            dispatch(stravaFetched(result));
        }).catch(error => {
            dispatch(stravaFetchFailed(error));
            dispatch(stravaActivitySet(''))
        });

    }
}

const authenticate = (routeId : string) => {
    let params = queryString.parse(location.search);
    params['strava_route'] = routeId;
    window.location.href = '/stravaAuthReq?state=' + encodeURIComponent(JSON.stringify(params));
}

type ModuleType = Promise<any>

export const componentLoader = (lazyComponent : ModuleType, attemptsLeft : number) : ModuleType => {
    return new Promise((resolve, reject) => {
        Sentry.addBreadcrumb({category:'loading',level:'info',message:'in component loader'})
        return lazyComponent
            .then(resolve)
            .catch((error : Error)=>{
                // let us retry after 1500 ms
                setTimeout(() => {
                    Sentry.addBreadcrumb({category:"No stack", level:"info", message:"componentLoader"})
                    if (attemptsLeft === 1) {
                        // instead of rejecting reload the window
                        Sentry.captureException(error);
                        if (!navigator.userAgent.includes("jsdom")) {
                            window.location.reload();
                        }
                        return;
                    }
                    componentLoader(lazyComponent, attemptsLeft - 1).then(resolve, reject);
                }, 1500)
            })
    });
};

const getRouteParser = async function () {
    Sentry.addBreadcrumb({
        category: 'load',
        level: 'info',
        message:'Loading GPX parser module'
    })

    const parser = await componentLoader(import(/* webpackChunkName: "RwgpsParser" */ '../utils/gpxParser'), 5)
    return parser.default;
};

const loadGpxRoute = function(gpxFileData : GpxRouteData) {
    return async function (dispatch : AppDispatch) {
        const parser = await getRouteParser().catch((err) => {dispatch(gpxRouteLoadingFailed(err));return null});
        // handle failed load, error has already been dispatched
        if (parser == null) {
            return Promise.resolve(Error('Cannot load parser'))
        }
        const parsedResults = parser.loadGpxFile(gpxFileData)
        if (parsedResults.gpxData) {
            dispatch(gpxRouteLoaded(parsedResults.gpxData));
        } else if (parsedResults.error) {
            dispatch(gpxRouteLoadingFailed(parsedResults.error))
        }
    }
}

export const loadStravaRoute = (routeId : string) => {
    return async function (dispatch : AppDispatch, getState: () => RootState) {
        routeId = routeId || getState().strava.route
        ReactGA.event('login', {method:routeId});
        ReactGA.event('sign_up', {method:routeId});
        dispatch(routeLoadingBegun('gpx'));
        await Sentry.startSpan({ name: "loadingStravaRoute" }, async () => {
            const api = new Api('https://www.strava.com/api/v3', [(response) => Promise.resolve(response.text())])
            const access_token = await dispatch(refreshOldToken)
            if (!access_token) {
                authenticate(routeId)
            }
            api.setDefaultHeader('Authorization', `Bearer ${access_token}`)
            try {
                const routeInfo = await api.get(`/routes/${routeId}/export_gpx`)
                if (routeInfo && routeInfo.charAt(0)!=="{") {
                    await dispatch(loadGpxRoute(routeInfo))
                } else {
                    dispatch(errorDetailsSet(`Error fetching Strava route: ${JSON.parse(routeInfo).message}`))
                }    
            } catch (err : any) {
                dispatch(errorDetailsSet(`Error fetching Strava route: ${err.details}`))
            }
        })
    }
}