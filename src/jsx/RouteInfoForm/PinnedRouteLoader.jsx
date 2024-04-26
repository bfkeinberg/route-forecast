import { Button, Spinner } from '@blueprintjs/core';
// import {lazy} from '@loadable/component';
import * as Sentry from "@sentry/react";
import axios from 'axios';
import PropTypes from 'prop-types';
import queryString from 'query-string';
import React, {Suspense, useEffect, lazy} from 'react';
import ReactGA from "react-ga4";
import {connect} from 'react-redux';

import { errorDetailsSet,loadingPinnedSet, pinnedRoutesSet, rwgpsTokenSet, usePinnedRoutesSet } from '../../redux/reducer';

const addBreadcrumb = (msg) => {
    Sentry.addBreadcrumb({
        category: 'loading',
        level: "info",
        message: msg
    })
}

const LoadableRouteList = lazy(() => {addBreadcrumb('loading route list'); return import(/* webpackChunkName: "RouteList" */ './RWGPSRouteList')});

const getPinnedRoutes = async (rwgpsToken, setErrorDetails, rwgpsTokenSet) => {

    const url = `/pinned_routes?token=${rwgpsToken}`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (e) {
        console.log(`axios exception is ${e}`);
        Sentry.captureException(e)
        const errorMessage = e.response !== undefined ? JSON.stringify(e.response.data) : e
        setErrorDetails(`Ride with GPS login failure: ${errorMessage}`);
        rwgpsTokenSet(null);
        return null;
    }
}

const setRoutes = async (rwgpsToken, setRwgpsToken, setError, setPinnedRoutes, setLoadingPinned, usingPinnedRoutes, hasRoutes) => {
    if (rwgpsToken === '' || rwgpsToken === null || !usingPinnedRoutes || hasRoutes) {
        return null;
    }
    setLoadingPinned(true);
    const user_favorites = await getPinnedRoutes(rwgpsToken, setError, setRwgpsToken);
    if (user_favorites != null) {
        setPinnedRoutes(user_favorites);
    }
    setLoadingPinned(false);
}

const togglePinnedRoutes = (setUsePinnedRoutes, setShowPinnedRoutes, usingPinnedRoutes) => {
    // if usingPinnedRoutes is false then we're about to turn it on
    if (!usingPinnedRoutes) {
        ReactGA.event('join_group', {group_id:'pinned_routes'});
    }
    setUsePinnedRoutes(!usingPinnedRoutes);
    setShowPinnedRoutes(!usingPinnedRoutes);
};

const PinnedRouteLoader = ({rwgpsToken, rwgpsTokenSet, credentialsValid, pinnedRoutesSet, errorDetailsSet, hasRoutes, loadingPinnedRoutes, loadingPinnedSet, usePinnedRoutesSet, setShowPinnedRoutes, usingPinnedRoutes}) => {
    useEffect(() => {if (usingPinnedRoutes && !rwgpsToken) {window.location.href = `/rwgpsAuthReq?state=${JSON.stringify(queryString.parse(location.search))}`}}, [
        usingPinnedRoutes,
         credentialsValid
        ]);
    useEffect(() => {
        setRoutes(rwgpsToken, rwgpsTokenSet, errorDetailsSet, pinnedRoutesSet, loadingPinnedSet, usingPinnedRoutes, hasRoutes);
    }, [
        rwgpsToken,
        usingPinnedRoutes
    ]);
    let button_class = usingPinnedRoutes ? null : 'glowing_input'
    Sentry.addBreadcrumb({
        category: 'load',
        level: 'info',
        message:'Loading pinned route list'
    })

    return (
        <>
            <Button intent="primary"
                small={true}
                outlined={usingPinnedRoutes}
                active={usingPinnedRoutes}
                icon="star"
                loading={loadingPinnedRoutes}
                className={button_class}
                text={usingPinnedRoutes ? "Don't use pinned routes" : "Use pinned routes"}
                style={{fontSize: "13px"}}
                onClick={() => {togglePinnedRoutes(usePinnedRoutesSet, setShowPinnedRoutes, usingPinnedRoutes)}}
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
            {usingPinnedRoutes && !hasRoutes && !loadingPinnedRoutes && <Spinner/>}
        </>
    )
};

PinnedRouteLoader.propTypes = {
    rwgpsToken:PropTypes.string,
    credentialsValid:PropTypes.bool.isRequired,
    pinnedRoutesSet:PropTypes.func.isRequired,
    errorDetailsSet:PropTypes.func.isRequired,
    rwgpsTokenSet:PropTypes.func.isRequired,
    hasRoutes:PropTypes.bool.isRequired,
    loadingPinnedRoutes:PropTypes.bool.isRequired,
    loadingPinnedSet:PropTypes.func.isRequired,
    showPinnedRoutes:PropTypes.bool.isRequired,
    usePinnedRoutesSet:PropTypes.func.isRequired,
    usingPinnedRoutes:PropTypes.bool.isRequired,
    setShowPinnedRoutes:PropTypes.func.isRequired
};

const isValid = (field) => {return (field !== undefined && field !== null && field !== '')};

const mapStateToProps = (state) =>
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

export default connect(mapStateToProps,mapDispatchToProps)(PinnedRouteLoader);
