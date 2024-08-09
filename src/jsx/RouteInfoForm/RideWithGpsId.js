import {Button,FormGroup, InputGroup} from '@blueprintjs/core';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import {useTranslation} from 'react-i18next'
import { routeDataCleared, rwgpsRouteSet } from '../../redux/reducer';
import * as Sentry from "@sentry/react";

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
    const { t } = useTranslation()
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
        // set size to keep Mobile Safari from zooming
        <FormGroup inline={false} label={<span style={{fontSize:"90%"}} ><b>{t('titles.rwgpsId')}</b></span>} labelFor={'rwgps_route'} >
            <InputGroup id={'rwgps_route'} style={{fontSize:"16px"}} className={'glowing_input'} autoComplete='on'
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
                         try {
                            for (let i = dt.items.length - 1; i >= 0; i--) {
                                dt.items.remove(i);
                            }   
                         } catch (err) {
                            Sentry.captureException(err)
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