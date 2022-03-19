import React, {Suspense, useEffect} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import axios from 'axios';
import {setPinnedRoutes, setErrorDetails, setRwgpsToken, setLoadingPinned, setUsePinnedRoutes} from "../../redux/actions";
import {lazy} from '@loadable/component';
import queryString from 'query-string';
import { Button, Spinner } from '@blueprintjs/core';
import ReactGA from "react-ga4";

const LoadableRouteList = lazy(() => import(/* webpackChunkName: "RouteList" */ './RWGPSRouteList'));

const getPinnedRoutes = async (rwgpsToken, setErrorDetails, setRwgpsToken) => {

    const url = `/pinned_routes?token=${rwgpsToken}`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (e) {
        console.log(`axios exception is ${e}`);
        const errorMessage = e.response !== undefined ? JSON.stringify(e.response.data) : e
        setErrorDetails(`Ride with GPS login failure: ${errorMessage}`);
        setRwgpsToken(null);
        return null;
    }
}

const setRoutes = async (rwgpsToken, setRwgpsToken, setError, setPinnedRoutes, setLoadingPinned, usingPinnedRoutes, hasRoutes) => {
    ReactGA.event('join_group', {group_id:'pinned_routes'});
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

const PinnedRouteLoader = ({rwgpsToken, setRwgpsToken, credentialsValid, setPinnedRoutes, setErrorDetails, hasRoutes, loadingPinnedRoutes, setLoadingPinned, setUsePinnedRoutes, setShowPinnedRoutes, usingPinnedRoutes}) => {
    useEffect(() => {if (usingPinnedRoutes && !rwgpsToken) {window.location.href = `/rwgpsAuthReq?state=${JSON.stringify(queryString.parse(location.search))}`}}, [
        usingPinnedRoutes,
         credentialsValid
        ]);
    useEffect(() => {
        setRoutes(rwgpsToken, setRwgpsToken, setErrorDetails, setPinnedRoutes, setLoadingPinned, usingPinnedRoutes, hasRoutes);
    }, [
        rwgpsToken,
        usingPinnedRoutes
    ]);
    let button_class = usingPinnedRoutes ? null : 'glowing_input'
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
                onClick={() => {setUsePinnedRoutes(!usingPinnedRoutes);setShowPinnedRoutes(!usingPinnedRoutes)}}
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
    setPinnedRoutes:PropTypes.func.isRequired,
    setErrorDetails:PropTypes.func.isRequired,
    setRwgpsToken:PropTypes.func.isRequired,
    hasRoutes:PropTypes.bool.isRequired,
    loadingPinnedRoutes:PropTypes.bool.isRequired,
    setLoadingPinned:PropTypes.func.isRequired,
    showPinnedRoutes:PropTypes.bool.isRequired,
    setUsePinnedRoutes:PropTypes.func.isRequired,
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
    setPinnedRoutes, setErrorDetails, setLoadingPinned, setUsePinnedRoutes, setRwgpsToken
};

export default connect(mapStateToProps,mapDispatchToProps)(PinnedRouteLoader);
