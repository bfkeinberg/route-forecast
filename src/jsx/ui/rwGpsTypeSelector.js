import React from 'react';
import PropTypes from 'prop-types';
import {Checkbox, ControlLabel, FormGroup, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {connect} from 'react-redux';
import {setRouteIsTrip} from "../actions/actions";

const RwGpsTypeSelector = (rwgpsRouteIsTrip,setRouteIsTrip,visible) => {
    const rwgps_trip_tooltip = (
        <Tooltip id="trip_tooltip">Ride with GPS has both &#39trips&#39 and &#39routes&#39.
            Routes are created with the planner, trips are recorded rides.</Tooltip>
    );
    const isVisible = visible ? 'inline-flex' : 'none';
    return (
        <FormGroup controlId="rwgpsType" style={{display:isVisible}}>
            <ControlLabel style={{padding:'10px'}}>RideWithGps trip</ControlLabel>
            <OverlayTrigger overlay={rwgps_trip_tooltip}>
                <Checkbox onClick={() => setRouteIsTrip(!rwgpsRouteIsTrip)}
                          checked={rwgpsRouteIsTrip}>Rwgps number is a trip</Checkbox>
            </OverlayTrigger>
        </FormGroup>
        );
};

RwGpsTypeSelector.propTypes = {
    rwgpsRouteIsTrip:PropTypes.bool.isRequired,
    setRouteIsTrip:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        rwgpsRouteIsTrip: state.uiInfo.routeParams.rwgpsRouteIsTrip,
        visible:PropTypes.bool
    });

const mapDispatchToProps = {
    setRouteIsTrip
};

export default connect(mapStateToProps,mapDispatchToProps)(RwGpsTypeSelector);