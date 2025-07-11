import { Button, Spinner } from '@blueprintjs/core';
import * as Sentry from "@sentry/react";
import axios from 'axios';
import {Suspense, useEffect, lazy, SetStateAction, Dispatch, useState} from 'react';
import ReactGA from "react-ga4";
import {connect, ConnectedProps} from 'react-redux';
import {useTranslation} from 'react-i18next'
import { Favorite, loadingPinnedSet, pinnedRoutesSet, rwgpsTokenSet, usePinnedRoutesSet } from '../../redux/rideWithGpsSlice';
import { errorDetailsSet } from '../../redux/dialogParamsSlice';
import type { ErrorPayload } from '../../redux/dialogParamsSlice';
import type { RootState } from "../../redux/store";
import { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import Snackbar, {SnackbarCloseReason} from '@mui/material/Snackbar';

const addBreadcrumb = (msg : string) => {
    Sentry.addBreadcrumb({
        category: 'loading',
        level: "info",
        message: msg
    })
}

type PropsFromRedux = ConnectedProps<typeof connector>
type RouteListType = Promise<typeof import(/* webpackChunkName: "RouteList" */ './RWGPSRouteList')>
type DynamicRouteListType = RouteListType | Promise<{default:() => JSX.Element}>
const LoadableRouteList = lazy(() : DynamicRouteListType => {addBreadcrumb('loading route list'); return import(/* webpackChunkName: "RouteList" */ './RWGPSRouteList').catch((err) => {
    addBreadcrumb(`failed to load pinned routes : ${JSON.stringify(err)}`)
    return {default: () => <div>Failed to load pinned route list - {err.message}</div>}
})

});

const getPinnedRoutes = async (rwgpsToken : string, 
    setErrorDetails : ActionCreatorWithPayload<ErrorPayload, "dialogParams/errorDetailsSet">, 
    rwgpsTokenSet : ActionCreatorWithPayload<string|null, "rideWithGpsInfo/rwgpsTokenSet">,) => {
    if (!rwgpsToken || rwgpsToken === 'undefined') {
        return null
    }
    
    const url = `/pinned_routes?token=${rwgpsToken}`
    if (url.endsWith('undefined')) {
        rwgpsTokenSet(null);
        return null
    }
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (e : any) {
        Sentry.captureException(e)
        const errorMessage = e.response ? (e.response.data ? JSON.stringify(e.response.data) : JSON.stringify(e.response)) : e
        setErrorDetails(`Ride with GPS login failure: ${errorMessage}`);
        rwgpsTokenSet(null);
        return null;
    }
}

const setRoutes = async (rwgpsToken : string|null|undefined, setRwgpsToken : ActionCreatorWithPayload<string|null, "rideWithGpsInfo/rwgpsTokenSet">,
    setError : ActionCreatorWithPayload<ErrorPayload, "dialogParams/errorDetailsSet">,
    setPinnedRoutes : ActionCreatorWithPayload<Array<Favorite>, "rideWithGpsInfo/pinnedRoutesSet">, 
    setLoadingPinned : ActionCreatorWithPayload<boolean, "rideWithGpsInfo/loadingPinnedSet">, usingPinnedRoutes : boolean, hasRoutes : boolean) => {
    if (rwgpsToken === '' || !rwgpsToken || rwgpsToken===undefined || !usingPinnedRoutes || hasRoutes) {
        return null;
    }
    setLoadingPinned(true);
    const user_favorites = await getPinnedRoutes(rwgpsToken, setError, setRwgpsToken);
    if (user_favorites != null) {
        setPinnedRoutes(user_favorites);
    }
    setLoadingPinned(false);
}

const togglePinnedRoutes = (setUsePinnedRoutes : ActionCreatorWithPayload<boolean>, 
    setShowPinnedRoutes : Dispatch<SetStateAction<boolean>>, usingPinnedRoutes : boolean) => {
    // if usingPinnedRoutes is false then we're about to turn it on
    if (!usingPinnedRoutes) {
        ReactGA.event('join_group', {group_id:'pinned_routes'});
    }
    setUsePinnedRoutes(!usingPinnedRoutes);
    setShowPinnedRoutes(!usingPinnedRoutes);
};

interface PinnedRouteProps extends PropsFromRedux {
    showPinnedRoutes:boolean,
    setShowPinnedRoutes: Dispatch<SetStateAction<boolean>>
}

const PinnedRouteLoader = ({rwgpsToken, rwgpsTokenSet, credentialsValid, 
    pinnedRoutesSet, errorDetailsSet, hasRoutes, loadingPinnedRoutes, loadingPinnedSet, 
    usePinnedRoutesSet, setShowPinnedRoutes, usingPinnedRoutes} : PinnedRouteProps) => {
    useEffect(() => {if (usingPinnedRoutes && (!rwgpsToken || rwgpsToken===undefined)) {window.location.href = `/rwgpsAuthReq?state=${location.search}`}}, [
        usingPinnedRoutes,
         credentialsValid
        ]);
    useEffect(() => {
        setRoutes(rwgpsToken, rwgpsTokenSet, errorDetailsSet, pinnedRoutesSet, loadingPinnedSet, usingPinnedRoutes, hasRoutes);
    }, [
        rwgpsToken,
        usingPinnedRoutes
    ])
    const { t } = useTranslation()
    const [displayRoutesError, setDisplayRoutesError] = useState(true)
    let button_class = usingPinnedRoutes ? undefined : 'glowing_input'
    Sentry.addBreadcrumb({
        category: 'load',
        level: 'info',
        message:'Loading pinned route list'
    })

    const handleClose = (
        event: React.SyntheticEvent | Event,
        reason?: SnackbarCloseReason,
    ) => {

        setDisplayRoutesError(false);
        usePinnedRoutesSet(false)
        setShowPinnedRoutes(false)
    }

    return (
        <>
            <Button intent="primary"
                size='small'
                variant={usingPinnedRoutes?'outlined':'solid'}
                active={usingPinnedRoutes}
                icon="star"
                loading={loadingPinnedRoutes}
                className={button_class}
                text={usingPinnedRoutes ? t('buttons.dontUsePinned') : t('buttons.usePinned')}
                style={{fontSize: "13px"}}
                onClick={() => {setDisplayRoutesError(true); togglePinnedRoutes(usePinnedRoutesSet, setShowPinnedRoutes, usingPinnedRoutes)}}
            />
            {credentialsValid ?
            (
                usingPinnedRoutes && hasRoutes && (
                    <Suspense fallback={<p>Loading pinned routes</p>}>
                        <LoadableRouteList/>
                    </Suspense>
                )
            ) :
             (
                <div/>
            )}
            <Snackbar message={"No pinned routes to display"} onClose={handleClose} 
                open={usingPinnedRoutes && !loadingPinnedRoutes && !hasRoutes && displayRoutesError} autoHideDuration={5000} />
        </>
    )
};

const isValid = (field : string|null|undefined) => {return (field !== undefined && field !== null && field !== '')};

const mapStateToProps = (state : RootState) =>
({
    rwgpsToken:state.rideWithGpsInfo.token,
    credentialsValid:isValid(state.rideWithGpsInfo.token),
    hasRoutes:Array.isArray(state.rideWithGpsInfo.pinnedRoutes) && state.rideWithGpsInfo.pinnedRoutes.length > 0,
    loadingPinnedRoutes:state.rideWithGpsInfo.loadingRoutes,
    usingPinnedRoutes:state.rideWithGpsInfo.usePinnedRoutes
});

const mapDispatchToProps = {
    pinnedRoutesSet, errorDetailsSet, loadingPinnedSet, usePinnedRoutesSet, rwgpsTokenSet
};

const connector = connect(mapStateToProps,mapDispatchToProps)
export default connector(PinnedRouteLoader);
