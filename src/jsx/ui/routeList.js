import React, {useState} from 'react';
import { Select } from "@blueprintjs/select";
import { Button, MenuItem, Label } from "@blueprintjs/core";
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {setRwgpsRoute, loadFromRideWithGps, setFetchAfterLoad, setRouteIsTrip} from "../actions/actions";

const renderFavorite = (favorite, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
        return null;
    }
    return (
        <MenuItem
            active={modifiers.active}
            key={favorite.id}
            label={favorite.associated_object_type}
            onClick={handleClick}
            text={favorite.associated_object_id}
        />
    );
};

const RouteList = ({pinnedRoutes, setRwgpsRoute, route_id, loadFromRideWithGps, setFetchAfterLoad, setRouteIsTrip}) => {
    return (<Label>Ride with GPS routes
            <Select
                        items={pinnedRoutes}
                        noResults={<MenuItem disabled={true} text="No results." />}
                        itemRenderer={renderFavorite}
                        filterable={false}
                        itemsEqual="id"
                        onItemSelect={(selected) => {
                            setFetchAfterLoad(true);
                            setRouteIsTrip(selected.associated_object_type=="trip");
                            setRwgpsRoute(selected.associated_object_id);
                            loadFromRideWithGps(selected.associated_object_id, selected.associated_object_type=="trip")
                        }}
            >
        <Button icon="route" text={route_id} rightIcon="double-caret-vertical" />
    </Select></Label>)
}

RouteList.propTypes = {
    setRwgpsRoute:PropTypes.func.isRequired,
    pinnedRoutes:PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        associated_object_type: PropTypes.string,
        associated_object_id: PropTypes.number
    })),
    route_id:PropTypes.oneOfType([PropTypes.number,PropTypes.string]),
    loadFromRideWithGps:PropTypes.func.isRequired,
    setFetchAfterLoad:PropTypes.func.isRequired,
    setRouteIsTrip:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
({
    pinnedRoutes:state.rideWithGpsInfo.pinnedRoutes,
    route_id:state.uiInfo.routeParams.rwgpsRoute
});

const mapDispatchToProps = {
    setRwgpsRoute, loadFromRideWithGps, setFetchAfterLoad, setRouteIsTrip
};

export default connect(mapStateToProps,mapDispatchToProps)(RouteList);
