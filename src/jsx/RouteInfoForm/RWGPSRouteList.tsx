import { Button, MenuItem } from "@blueprintjs/core";
import { Select, ItemRenderer } from "@blueprintjs/select";
import {useRef} from 'react';

import { loadFromRideWithGps } from "../../redux/loadRouteActions";
import { routeIsTripSet, rwgpsRouteSet } from "../../redux/routeParamsSlice";
import { useAppSelector, useAppDispatch } from "../../utils/hooks";
import { Favorite } from "../../redux/rideWithGpsSlice";

const renderFavorite : ItemRenderer<Favorite> = (favorite, { handleClick, modifiers }) => {
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

const RWGPSRouteList = ({}) => {
    const routeName = useAppSelector(state => state.routeInfo.name)
    const selectedName = useRef(routeName)
    const pinnedRoutes = useAppSelector(state => state.rideWithGpsInfo.pinnedRoutes)
    const route_id = useAppSelector(state => state.uiInfo.routeParams.rwgpsRoute)
    const dispatch = useAppDispatch()
    return (
            <Select
                        items={pinnedRoutes}
                        noResults={<MenuItem disabled={true} text="No results." />}
                        itemRenderer={renderFavorite}
                        filterable={false}
                        itemsEqual="associated_object_id"
                        onItemSelect={(selected) => {
                            dispatch(routeIsTripSet(selected.associated_object_type=="trip"))
                            dispatch(rwgpsRouteSet(selected.associated_object_id))
                            selectedName.current = selected.name
                            dispatch(loadFromRideWithGps(selected.associated_object_id, selected.associated_object_type=="trip"))
                        }}
            >
        <Button icon="map" text={selectedName.current === '' ? route_id : selectedName.current} rightIcon="double-caret-vertical" className={'glowing_input'}/>
    </Select>)
}

export default RWGPSRouteList
