import React, {Suspense, useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import RideWithGpsCreds from './rideWithGpsCreds.jsx';
import RouteList from './routeList.js';
import axios from 'axios';
import {setPinnedRoutes, setErrorDetails, setRwgpsCredentials} from "../actions/actions";
import cookie from 'react-cookies';

const getPinnedRoutes = async (rwgpsUsername, rwgpsPassword, setErrorDetails, setRwgpsCredentials) => {
    
    const url = `/pinned_routes?username=${rwgpsUsername}&password=${rwgpsPassword}`;
    try {
        const response = await axios.get(url);
        cookie.save('rwgpsUsername', rwgpsUsername);
        cookie.save('rwgpsPassword', rwgpsPassword);
        return response.data.user.slim_favorites;
    } catch (e) {
        console.log(e);
        setErrorDetails(JSON.stringify(e.response.data));
        setRwgpsCredentials(null, null);
        return null;
        
    }
}

const setRoutes = async (rwgpsUsername, rwgpsPassword, setError, setPinnedRoutes, setRwgpsCredentials) => {
    if (rwgpsUsername ==='' || rwgpsPassword === '') {
        return null;
    }
    const user_favorites = await getPinnedRoutes(rwgpsUsername, rwgpsPassword, setError, setRwgpsCredentials);
    if (user_favorites != null) {
        setPinnedRoutes(user_favorites);
    }
}

const PinnedRouteLoader = ({rwgpsUsername, rwgpsPassword, credentialsValid, setPinnedRoutes, setErrorDetails, hasRoutes, setRwgpsCredentials}) => {
    
    useEffect(() => {
        setRoutes(rwgpsUsername, rwgpsPassword, setErrorDetails, setPinnedRoutes, setRwgpsCredentials);
    }, [rwgpsUsername, rwgpsPassword]);
    if (credentialsValid) {
        if (!hasRoutes) {
            return null;
        } else {
            return (
                <Suspense fallback={<p>Loading pinned routes</p>}>
                    <RouteList/>
                </Suspense>
            );
        }
    } else {
        return <RideWithGpsCreds/>;
    }
};


PinnedRouteLoader.propTypes = {
    rwgpsUsername:PropTypes.string,
    rwgpsPassword:PropTypes.string,
    credentialsValid:PropTypes.bool.isRequired,
    setPinnedRoutes:PropTypes.func.isRequired,
    setErrorDetails:PropTypes.func.isRequired,
    setRwgpsCredentials:PropTypes.func.isRequired,
    hasRoutes:PropTypes.bool.isRequired
};

const isValid = (field) => {return (field !== undefined && field !== null && field !== '')};

const mapStateToProps = (state) =>
({
    rwgpsUsername:state.rideWithGpsInfo.username,
    rwgpsPassword:state.rideWithGpsInfo.password,
    credentialsValid:isValid(state.rideWithGpsInfo.username) && isValid(state.rideWithGpsInfo.password),
    hasRoutes:Array.isArray(state.rideWithGpsInfo.pinnedRoutes) && state.rideWithGpsInfo.pinnedRoutes.length > 0
});

const mapDispatchToProps = {
    setPinnedRoutes, setErrorDetails, setRwgpsCredentials
};

export default connect(mapStateToProps,mapDispatchToProps)(PinnedRouteLoader);