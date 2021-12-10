import React from 'react';
import PropTypes from 'prop-types';
import {Input, Label, FormGroup, UncontrolledTooltip} from 'reactstrap';
import {connect} from 'react-redux';
import {toggleRouteIsTrip} from "../actions/actions";

const RwGpsTypeSelector = ({rwgpsRouteIsTrip,toggleRouteIsTrip,visible}) => {
    const isVisible = visible ? 'inline-flex' : 'none';
    return (
        <FormGroup check style={{display:isVisible}}>
            <UncontrolledTooltip target='selectTrip' id="trip_tooltip">Ride with GPS has both &#39trips&#39 and &#39routes&#39.
                Routes are created with the planner, trips are recorded rides.</UncontrolledTooltip>
            <Label check style={{padding:'10px'}}>Rwgps number is a trip
                <Input type='checkbox' id='selectTrip' onClick={() => toggleRouteIsTrip} onChange={() => toggleRouteIsTrip}
                          checked={rwgpsRouteIsTrip}/>
            </Label>
        </FormGroup>
        );
};

RwGpsTypeSelector.propTypes = {
    rwgpsRouteIsTrip:PropTypes.bool.isRequired,
    toggleRouteIsTrip:PropTypes.func.isRequired,
    visible:PropTypes.bool.isRequired
};

const mapStateToProps = (state) =>
    ({
        rwgpsRouteIsTrip: state.uiInfo.routeParams.rwgpsRouteIsTrip
    });

const mapDispatchToProps = {
    toggleRouteIsTrip
};

export default connect(mapStateToProps,mapDispatchToProps)(RwGpsTypeSelector);