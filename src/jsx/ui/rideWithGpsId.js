import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup, UncontrolledTooltip} from 'reactstrap';
import {connect} from 'react-redux';
import {loadFromRideWithGps, setRwgpsRoute, newUserMode} from "../actions/actions";
import cookie from 'react-cookies';
import {getRouteNumberFromValue, decideValidationStateFor} from "../routeInfoEntry";

const RideWithGpsId = ({setRwgpsRoute,loadingSource,loadingSuccess,rwgpsRoute,rwgpsRouteIsTrip,loadFromRideWithGps,
                       newUserMode,firstUse}) => {
    const handleRwgpsRoute = function(value) {
        let route = getRouteNumberFromValue(value);
        if (route !== '') {
            if (isNaN(route)) {
                return;
            }
            loadFromRideWithGps(route,rwgpsRouteIsTrip);
            // clear file input to avoid confusion
            const routeFileField = document.getElementById('routeFile');
            if (routeFileField != null) {
                routeFileField.value = null;
            }
        }
    };

    const isNumberKey = function(event) {
        const charCode = (event.which) ? event.which : event.keyCode;
        if ((charCode < 48 || charCode > 57))
            return false;

        return charCode;
    };

    const settingRoute = (route) => {
        setRwgpsRoute(route);
        cookie.save('initialized', true);
        newUserMode(false);
    };

    return (
        <FormGroup inline>
            <Label for='rwgps_route' size='sm' tag='b'>RideWithGps route</Label>
            <UncontrolledTooltip placement="bottom" target='rwgps_route'>The number for a route on Ride with GPS</UncontrolledTooltip>
            <Input id={'rwgps_route'} className={firstUse?'ridewithgps_init':''}
                   size="9" bsSize='xsm' tabIndex='5' type="text"
                   {...decideValidationStateFor('rwgps',loadingSource,loadingSuccess)}
                 onBlur={event => {handleRwgpsRoute(event.target.value)}}
                 onKeyPress={isNumberKey}
                 onChange={event => {settingRoute(event.target.value)}}
                 onDrop={event => {
                     let dt = event.dataTransfer;
                     if (dt.items) {
                         for (let i=0;i < dt.items.length;i++) {
                             if (dt.items[i].kind === 'string') {
                                 event.preventDefault();
                                 dt.items[i].getAsString(value => {
                                     settingRoute(value);
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
    firstUse:PropTypes.bool.isRequired,
    newUserMode:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        loadingSource: state.uiInfo.dialogParams.loadingSource,
        loadingSuccess: state.uiInfo.dialogParams.succeeded,
        rwgpsRoute:state.uiInfo.routeParams.rwgpsRoute,
        rwgpsRouteIsTrip:state.uiInfo.routeParams.rwgpsRouteIsTrip,
        firstUse: state.params.newUserMode
    });

const mapDispatchToProps = {
    setRwgpsRoute,loadFromRideWithGps,newUserMode
};

export default connect(mapStateToProps,mapDispatchToProps)(RideWithGpsId);