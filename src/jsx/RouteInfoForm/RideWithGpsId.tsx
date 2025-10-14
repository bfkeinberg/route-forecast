import {connect, ConnectedProps} from 'react-redux';
import {useTranslation} from 'react-i18next'
import * as Sentry from "@sentry/react";
import { routeDataCleared} from '../../redux/routeInfoSlice';
import { rwgpsRouteSet } from '../../redux/routeParamsSlice';
import type { RootState } from "../../redux/store";
import { ChangeEvent, RefObject } from 'react';
import { CloseButton, Flex, Input } from '@mantine/core';

export const decideValidationStateFor = (type : string, methodUsed : string|null, loadingSuccess : boolean) => {
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

type PropsFromRedux = ConnectedProps<typeof connector>
interface RideWithGpsIdProps extends PropsFromRedux {
    loadButtonRef:RefObject<HTMLButtonElement|null>
}

const RideWithGpsId = ({rwgpsRouteSet,loadingSource,loadingSuccess,rwgpsRoute,routeDataCleared,loadButtonRef} : RideWithGpsIdProps) => {
    const { t } = useTranslation()
    const isNumberKey = function(event:React.KeyboardEvent<HTMLInputElement>) {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode === 13 && loadButtonRef && loadButtonRef.current) {
            loadButtonRef.current.click()
        }
    };

    const settingRoute = (value: ChangeEvent<HTMLInputElement>|string) => {
        rwgpsRouteSet(typeof value === "string" ? value : value.target?.value);
        routeDataCleared();
    };

    const clearRoute = () => {
        rwgpsRouteSet('')
        routeDataCleared();
    }

    // set font size of input to keep Mobile Safari from zooming
    return (
        <Flex direction={"column"} justify={"center"} >
            <label htmlFor='rwgps_route'><span style={{fontSize:"80%"}}><b>{t('titles.rwgpsId')}</b></span></label>
            <Input id={'rwgps_route'} style={{fontSize:"16px"}} className={'glowing_input'} autoComplete='on'
                   autoFocus tabIndex={0} type="text" rightSection={<CloseButton onClick={clearRoute}></CloseButton>}
                   {...decideValidationStateFor('rwgps',loadingSource,loadingSuccess)}
                 onKeyDown={isNumberKey}
                 onChange={settingRoute}
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
        </Flex>
    );
};

const mapStateToProps = (state : RootState) =>
    ({
        loadingSource: state.uiInfo.dialogParams.loadingSource,
        loadingSuccess: state.uiInfo.dialogParams.succeeded,
        rwgpsRoute:state.uiInfo.routeParams.rwgpsRoute,
    });

const mapDispatchToProps = {
    rwgpsRouteSet, routeDataCleared
};

const connector = connect(mapStateToProps,mapDispatchToProps)
export default connector(RideWithGpsId);