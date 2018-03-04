import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup, UncontrolledTooltip} from 'reactstrap';
import RouteInfoForm from "../routeInfoEntry";
import {connect} from 'react-redux';
import {loadFromRideWithGps, setRwgpsRoute} from "../actions/actions";

const RideWithGpsId = ({setRwgpsRoute,loadingSource,loadingSuccess,rwgpsRoute,rwgpsRouteIsTrip,loadFromRideWithGps,
                           timezone_api_key}) => {
    const handleRwgpsRoute = function(value) {
        let route = RouteInfoForm.getRouteNumberFromValue(value);
        if (route !== '') {
            if (isNaN(route)) {
                return;
            }
            loadFromRideWithGps(route,rwgpsRouteIsTrip,timezone_api_key);
            // clear file input to avoid confusion
            document.getElementById('routeFile').value = null;
        }
    };

    const isNumberKey = function(event) {
        const charCode = (event.which) ? event.which : event.keyCode;
        if ((charCode < 48 || charCode > 57))
            return false;

        return charCode;
    };
    return (
        <FormGroup inline>
            <Label for='rwgps_route' size='sm' tag='b'>RideWithGps route</Label>
            <UncontrolledTooltip placement="bottom" target='rwgps_route'>The number for a route on ridewithgps</UncontrolledTooltip>
            <Input id='rwgps_route'
                   size="9" bsSize='xsm' tabIndex='5' type="text"
                   {...RouteInfoForm.decideValidationStateFor('rwgps',loadingSource,loadingSuccess)}
                 onBlur={event => {handleRwgpsRoute(event.target.value)}}
                 onKeyPress={isNumberKey}
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
                 /*onDragOver={event => {
                     event.preventDefault();
                     event.dataTransfer.dropEffect = 'move';
                 }}*/
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
                 value={rwgpsRoute}/>
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
        rwgpsRoute:state.uiInfo.routeParams.rwgpsRoute,
        rwgpsRouteIsTrip:state.uiInfo.routeParams.rwgpsRouteIsTrip,
        timezone_api_key:state.params.timezone_api_key
    });

const mapDispatchToProps = {
    setRwgpsRoute,loadFromRideWithGps
};

export default connect(mapStateToProps,mapDispatchToProps)(RideWithGpsId);