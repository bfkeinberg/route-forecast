import React from 'react';
import PropTypes from 'prop-types';
import {InputGroup, FormGroup, Button} from '@blueprintjs/core';
import {connect} from 'react-redux';
import { routeDataCleared, rwgpsRouteSet } from '../../redux/reducer';


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

const RideWithGpsId = ({rwgpsRouteSet,loadingSource,loadingSuccess,rwgpsRoute,routeDataCleared,loadButtonRef}) => {

    const isNumberKey = function(event) {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode === 13) {
            loadButtonRef.current.click()
        }
    };

    const settingRoute = (route) => {
        rwgpsRouteSet(route);
        routeDataCleared();
    };

    const clearRoute = () => {
        settingRoute('')
    }

    return (
        <FormGroup inline={false} style={{fontSize:"90%"}} label={<span><b>Route ID</b></span>} labelFor={'rwgps_route'} >
            <InputGroup id={'rwgps_route'} className={'glowing_input'}
                   autoFocus tabIndex='0' type="text" rightElement={<Button minimal icon="delete" onClick={clearRoute}></Button>}
                   {...decideValidationStateFor('rwgps',loadingSource,loadingSuccess)}
                 onKeyDown={isNumberKey}
                 onValueChange={settingRoute}
                 onDrop={event => {
                     let dt = event.dataTransfer;
                     if (dt.items) {
                         for (let i=0;i < dt.items.length;i++) {
                             if (dt.items[i].kind === 'string') {
                                 event.preventDefault();
                                 dt.items[i].getAsString(value => {
                                     settingRoute(value);
                                 });
                             } else {
                                 return false;
                             }
                         }
                     }
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
    loadButtonRef:PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({ current: PropTypes.instanceOf(Object) })
    ])
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