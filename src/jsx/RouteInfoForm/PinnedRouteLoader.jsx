import React, {Suspense, useEffect} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import RideWithGpsCreds from './RideWithGpsCreds.jsx';
import axios from 'axios';
import {setPinnedRoutes, setErrorDetails, setRwgpsCredentials, setLoadingPinned} from "../actions/actions";
import cookie from 'react-cookies';
import {lazy} from '@loadable/component';
import { Button } from '@blueprintjs/core';

const LoadableRouteList = lazy(() => import(/* webpackChunkName: "RouteList" */ './RWGPSRouteList'));

export const saveRwgpsCredentials = (username, password) => {
    if ("credentials" in navigator && "PasswordCredential" in window) {

        let credential = new PasswordCredential({
            id: username,
            name:username,
            password:password
        });

        navigator.credentials.store(credential).then(() => {
        console.info("Credential stored in the user agent's credential manager.");
        }, (err) => {
            console.error("Error while storing the credential: ", err);
        });
    } else {
        cookie.save('rwgpsUsername', username, { path: '/' });
        cookie.save('rwgpsPassword', password, { path: '/' });
        console.info('credentials stored in cookie');
    }
};

const getPinnedRoutes = async (rwgpsUsername, rwgpsPassword, setErrorDetails, setRwgpsCredentials) => {
    
    const url = `/pinned_routes?username=${rwgpsUsername}&password=${rwgpsPassword}`;
    try {
        const response = await axios.get(url);
        saveRwgpsCredentials(rwgpsUsername, rwgpsPassword);
        return response.data;
    } catch (e) {
        console.log(`axios exception is ${e}`);
        const errorMessage = e.response !== undefined ? JSON.stringify(e.response.data) : e
        setErrorDetails(`Ride with GPS login failure: ${errorMessage}`);
        setRwgpsCredentials(null, null);
        return null;
        
    }
}

const setRoutes = async (rwgpsUsername, rwgpsPassword, setError, setPinnedRoutes, setRwgpsCredentials, setLoadingPinned) => {
    if (rwgpsUsername ==='' || rwgpsPassword === '') {
        return null;
    }
    setLoadingPinned(true);
    const user_favorites = await getPinnedRoutes(rwgpsUsername, rwgpsPassword, setError, setRwgpsCredentials);
    if (user_favorites != null) {
        setPinnedRoutes(user_favorites);
    }
    setLoadingPinned(false);
}

const PinnedRouteLoader = ({rwgpsUsername, rwgpsPassword, credentialsValid, setPinnedRoutes, setErrorDetails, hasRoutes,
    loadingPinnedRoutes, setRwgpsCredentials, setLoadingPinned, showPinnedRoutes, setShowPinnedRoutes}) => {

    useEffect(() => {
        setRoutes(rwgpsUsername, rwgpsPassword, setErrorDetails, setPinnedRoutes, setRwgpsCredentials, setLoadingPinned);
    }, [rwgpsUsername, rwgpsPassword]);

    return (
        <>
            <Button intent="primary"
                small={true}
                outlined={showPinnedRoutes}
                active={showPinnedRoutes}
                icon="star"
                loading={loadingPinnedRoutes}
                text={showPinnedRoutes ? "Don't use pinned routes" : "Use pinned routes"}
                style={{fontSize: "13px"}}
                onClick={() => setShowPinnedRoutes(!showPinnedRoutes)}
            />
            {credentialsValid ? (
                hasRoutes && (
                    <Suspense fallback={<p>Loading pinned routes</p>}>
                        <LoadableRouteList/>
                    </Suspense>
                )
            ) : (
                showPinnedRoutes && <RideWithGpsCreds dialogClosed={() => setShowPinnedRoutes(false)} />
            )}
        </>
    )
};


PinnedRouteLoader.propTypes = {
    rwgpsUsername:PropTypes.string,
    rwgpsPassword:PropTypes.string,
    credentialsValid:PropTypes.bool.isRequired,
    setPinnedRoutes:PropTypes.func.isRequired,
    setErrorDetails:PropTypes.func.isRequired,
    setRwgpsCredentials:PropTypes.func.isRequired,
    hasRoutes:PropTypes.bool.isRequired,
    loadingPinnedRoutes:PropTypes.bool.isRequired,
    setLoadingPinned:PropTypes.func.isRequired,
    showPinnedRoutes:PropTypes.bool.isRequired,
    setShowPinnedRoutes:PropTypes.func.isRequired
};

const isValid = (field) => {return (field !== undefined && field !== null && field !== '')};

const mapStateToProps = (state) =>
({
    rwgpsUsername:state.rideWithGpsInfo.username,
    rwgpsPassword:state.rideWithGpsInfo.password,
    credentialsValid:isValid(state.rideWithGpsInfo.username) && isValid(state.rideWithGpsInfo.password),
    hasRoutes:Array.isArray(state.rideWithGpsInfo.pinnedRoutes) && state.rideWithGpsInfo.pinnedRoutes.length > 0,
    loadingPinnedRoutes:state.rideWithGpsInfo.loadingRoutes
});

const mapDispatchToProps = {
    setPinnedRoutes, setErrorDetails, setRwgpsCredentials, setLoadingPinned
};

export default connect(mapStateToProps,mapDispatchToProps)(PinnedRouteLoader);
