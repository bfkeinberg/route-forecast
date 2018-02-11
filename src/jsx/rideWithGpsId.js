import React from 'react';
import PropTypes from 'prop-types';
import {ControlLabel, FormControl, FormGroup, OverlayTrigger, Tooltip} from 'react-bootstrap';
import RouteInfoForm from "./routeInfoEntry";
import {connect} from 'react-redux';
import {loadFromRideWithGps, setRwgpsRoute} from "./actions/actions";

const RideWithGpsId = ({setRwgpsRoute,loadingSource,loadingSuccess,rwgpsRoute,rwgpsRouteIsTrip,loadFromRideWithGps,
                           timezone_api_key}) => {
    const tooltip_rwgps_enabled = (
        <Tooltip id="rwgps_tooltip">The number for a route on ridewithgps</Tooltip>
    );
    const handleRwgpsRoute = function(value) {
        let route = RouteInfoForm.getRouteNumberFromValue(value);
        if (route !== '') {
            if (isNaN(route)) {
                return;
            }
            loadFromRideWithGps(route,rwgpsRouteIsTrip,timezone_api_key);
            // clear file input to avoid confusion
            document.getElementById('route').value = null;
        }
    };

    return (
        <FormGroup
            validationState={RouteInfoForm.decideValidationStateFor('rwgps',loadingSource,loadingSuccess)}
            controlId="ridewithgps" style={{flex:'1',display:'inline-flex',marginTop:'5px',marginBottom:'5px'}}>
            <ControlLabel>RideWithGps route</ControlLabel>
            <OverlayTrigger placement="bottom" overlay={tooltip_rwgps_enabled}>
                <FormControl tabIndex='5' type="text"
                             onBlur={event => {handleRwgpsRoute(event.target.value)}}
                             onKeyPress={RouteInfoForm.isNumberKey}
                             onChange={event => {setRwgpsRoute(event.target.value)}}
                             onDrop={event => {
                                 let dt = event.dataTransfer;
                                 if (dt.items) {
                                     for (let i=0;i < dt.items.length;i++) {
                                         if (dt.items[i].kind === 'string') {
                                             event.preventDefault();
                                             dt.items[i].getAsString(value => {
                                                 setRwgpsRoute(value);
                                                 handleRwgpsRoute(value);
                                             });
                                         } else {
                                             console.log('vetoing drop of',i,dt.items[i].kind);
                                             return false;
                                         }
                                     }
                                 }
                             }}
                             onDragOver={event => {
                                 event.preventDefault();
                                 event.dataTransfer.dropEffect = 'move';
                             }}
                             onDragEnd={event => {
                                 let dt = event.dataTransfer;
                                 if (dt.items) {
                                     // Use DataTransferItemList interface to remove the drag data
                                     for (let i = 0;i < dt.items.length;i++) {
                                         dt.items.remove(i);
                                     }
                                 }
                             }}
                             pattern="[0-9]*"
                             value={rwgpsRoute}
                             style={{flex:'1',display:'inline-flex',alignItems:'center'}}/>
            </OverlayTrigger>
        </FormGroup>
    );
};

RideWithGpsId.propTypes = {
    loadingSource:PropTypes.string,
    setRwgpsRoute:PropTypes.func.isRequired,
    loadFromRideWithGps:PropTypes.func.isRequired,
    loadingSuccess:PropTypes.bool,
    rwgpsRoute:PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.oneOf([''])
    ]),
    rwgpsRouteIsTrip:PropTypes.bool.isRequired,
    timezone_api_key:PropTypes.string.isRequired
};

const mapStateToProps = (state) =>
    ({
        loadingSource: state.uiInfo.dialogParams.loadingSource,
        loadingSuccess: state.uiInfo.dialogParams.succeeded,
        rwgpsRoute:state.uiInfo.rwgpsRoute,
        rwgpsRouteIsTrip:state.uiInfo.rwgpsRouteIsTrip,
        timezone_api_key:state.params.timezone_api_key
    });

const mapDispatchToProps = {
    setRwgpsRoute,loadFromRideWithGps
};

export default connect(mapStateToProps,mapDispatchToProps)(RideWithGpsId);