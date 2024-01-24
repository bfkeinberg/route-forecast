import React from 'react';
import PropTypes from 'prop-types';
import {InputGroup, FormGroup} from '@blueprintjs/core';
import {connect} from 'react-redux';
import { routeDataCleared, rwgpsRouteSet } from '../../redux/reducer';
import { getRouteNumberFromValue } from '../../utils/util';

export const decideValidationStateFor = (type, methodUsed, loadingSuccess) => {
    if (type === methodUsed) {
        if (loadingSuccess) {
            return {'valid':null};
        } else {
            return {'invalid':null};
        }
    } else {
        return null;
    }
}

const RideWithGpsId = ({rwgpsRouteSet,loadingSource,loadingSuccess,rwgpsRoute,routeDataCleared}) => {
    const handleRwgpsRoute = function(value) {
        let route = getRouteNumberFromValue(value);
        if (route !== '') {
            if (isNaN(route)) {
                return;
            }
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
        rwgpsRouteSet(route);
        routeDataCleared();
    };

    return (
        <FormGroup inline={false} style={{fontSize:"90%"}} label={<span><b>Route ID</b></span>} labelFor={'rwgps_route'} >
            <InputGroup id={'rwgps_route'} className={'glowing_input'}
                   autoFocus tabIndex='0' type="text"
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
    rwgpsRouteSet:PropTypes.func.isRequired,
    routeDataCleared:PropTypes.func.isRequired,
    loadingSuccess:PropTypes.bool,
    rwgpsRoute:PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.string
    ]),
};

const mapStateToProps = (state) =>
    ({
        loadingSource: state.uiInfo.dialogParams.loadingSource,
        loadingSuccess: state.uiInfo.dialogParams.succeeded,
        rwgpsRoute:state.uiInfo.routeParams.rwgpsRoute,
    });

const mapDispatchToProps = {
    rwgpsRouteSet, routeDataCleared
};

export default connect(mapStateToProps,mapDispatchToProps)(RideWithGpsId);