import React from 'react';
import { Select } from "@blueprintjs/select";
import { Button, MenuItem } from "@blueprintjs/core";
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {loadFromRideWithGps} from "../../redux/actions";
import { routeIsTripSet, rwgpsRouteSet } from '../../redux/reducer';

const renderFavorite = (favorite, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
        return null;
    }
    return (
        <MenuItem
            active={modifiers.active}
            key={favorite.id}
            label={favorite.name}
            onClick={handleClick}
            text={favorite.associated_object_id}
        />
    );
};

const RWGPSRouteList = ({pinnedRoutes, rwgpsRouteSet, route_id, routeIsTripSet, loadFromRideWithGps}) => {
    return (
            <Select
                        items={pinnedRoutes}
                        noResults={<MenuItem disabled={true} text="No results." />}
                        itemRenderer={renderFavorite}
                        filterable={false}
                        itemsEqual="associated_object_id"
                        onItemSelect={(selected) => {
                            routeIsTripSet(selected.associated_object_type=="trip");
                            rwgpsRouteSet(selected.associated_object_id);
                            loadFromRideWithGps(selected.associated_object_id, selected.associated_object_type=="trip");
                        }}
            >
        <Button icon="route" text={route_id} rightIcon="double-caret-vertical" className={'glowing_input'}/>
    </Select>)
}

RWGPSRouteList.propTypes = {
    rwgpsRouteSet:PropTypes.func.isRequired,
    pinnedRoutes:PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        associated_object_type: PropTypes.string,
        associated_object_id: PropTypes.number
    })),
    route_id:PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
    ]),
    routeIsTripSet:PropTypes.func.isRequired,
    loadFromRideWithGps:PropTypes.func.isRequired,
};

const mapStateToProps = (state) =>
({
    pinnedRoutes:state.rideWithGpsInfo.pinnedRoutes,
    route_id:state.uiInfo.routeParams.rwgpsRoute
});

const mapDispatchToProps = {
    rwgpsRouteSet, routeIsTripSet, loadFromRideWithGps
};

export default connect(mapStateToProps,mapDispatchToProps)(RWGPSRouteList);
