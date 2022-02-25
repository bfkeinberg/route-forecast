import React, {Suspense, useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import axios from 'axios';
import {setPinnedRoutes, setErrorDetails, setRwgpsToken, setLoadingPinned} from "../actions/actions";
import cookie from 'react-cookies';
import {lazy} from '@loadable/component';
import queryString from 'query-string';

const LoadableRouteList = lazy(() => import(/* webpackChunkName: "RouteList" */ './routeList'));

export const saveRwgpsCredentials = (token) => {
    if ("credentials" in navigator && "PasswordCredential" in window) {

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

const getPinnedRoutes = async (rwgpsToken, setErrorDetails, setRwgpsToken) => {
    
    const url = `/pinned_routes?token=${rwgpsToken}`;
    try {
        const response = await axios.get(url);
        saveRwgpsCredentials(rwgpsToken);
        return response.data;
    } catch (e) {
        console.log(`axios exception is ${e}`);
        if (e.response !== undefined) {
            setErrorDetails(JSON.stringify(e.response.data));
        } else {
            setErrorDetails(e);
        }
        setRwgpsToken(null);
        return null;
        
    }
}

const setRoutes = async (rwgpsToken, setError, setPinnedRoutes, setLoadingPinned) => {
    if (rwgpsToken === '' || rwgpsToken === null) {
        return null;
    }
    setLoadingPinned(true);
    const user_favorites = await getPinnedRoutes(rwgpsToken, setError, setRwgpsToken);
    if (user_favorites != null) {
        setPinnedRoutes(user_favorites);
    }
    setLoadingPinned(false);
}

const PinnedRouteLoader = ({rwgpsToken, credentialsValid, setPinnedRoutes, setErrorDetails, hasRoutes, setLoadingPinned, showPinnedRoutes}) => {
    useEffect(() => {if (showPinnedRoutes && !rwgpsToken) {window.location.href = `/rwgpsAuthReq?state=${JSON.stringify(queryString.parse(location.search))}`}}, [showPinnedRoutes]);
    useEffect(() => {
        setRoutes(rwgpsToken, setErrorDetails, setPinnedRoutes, setLoadingPinned);
    }, [credentialsValid]);
    if (!hasRoutes || !showPinnedRoutes || !credentialsValid) {
        return null;
    } else {
        return (
            <Suspense fallback={<p>Loading pinned routes</p>}>
                <LoadableRouteList/>
            </Suspense>
        );
    }
};


PinnedRouteLoader.propTypes = {
    rwgpsToken:PropTypes.string,
    credentialsValid:PropTypes.bool.isRequired,
    setPinnedRoutes:PropTypes.func.isRequired,
    setErrorDetails:PropTypes.func.isRequired,
    setRwgpsToken:PropTypes.func.isRequired,
    hasRoutes:PropTypes.bool.isRequired,
    setLoadingPinned:PropTypes.func.isRequired,
    showPinnedRoutes:PropTypes.bool.isRequired
};

const isValid = (field) => {return (field !== undefined && field !== null && field !== '')};

const mapStateToProps = (state) =>
({
    rwgpsToken:state.rideWithGpsInfo.token,
    credentialsValid:isValid(state.rideWithGpsInfo.token),
    hasRoutes:Array.isArray(state.rideWithGpsInfo.pinnedRoutes) && state.rideWithGpsInfo.pinnedRoutes.length > 0
});

const mapDispatchToProps = {
    setPinnedRoutes, setErrorDetails, setLoadingPinned, setRwgpsToken
};

export default connect(mapStateToProps,mapDispatchToProps)(PinnedRouteLoader);
