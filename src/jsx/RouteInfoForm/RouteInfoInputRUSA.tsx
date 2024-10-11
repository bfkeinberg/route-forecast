
import { Button, FormGroup, InputGroup,Intent } from '@blueprintjs/core';
import * as Sentry from "@sentry/react";
import React, { useRef } from 'react';
import ReactGA from "react-ga4"

import { loadFromRideWithGps } from '../../redux/actions_';
import { errorDetailsSet } from '../../redux/dialogParamsSlice';
import { rusaIdLookupApiSlice } from '../../redux/rusaLookupApiSlice';
import { rusaPermRouteIdSet, rwgpsRouteSet } from '../../redux/routeParamsSlice';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
export const RouteInfoInputRUSA = () => {
    const loadButtonRef = useRef(null)
    const dispatch = useAppDispatch()
    const rusaPermRouteId = useAppSelector(state => state.uiInfo.routeParams.rusaPermRouteId)

    const [getRusaPermInfo] = rusaIdLookupApiSlice.useLazyLookupRusaPermIdQuery()

    const lookupRouteId = React.useCallback(() => {
        ReactGA.event('spend_virtual_currency', {virtual_currency_name:'RUSA',value:Number.parseInt(rusaPermRouteId)})
        Sentry.addBreadcrumb({
            category: 'load',
            level: 'info',
            message:'Loading RUSA perm query'
        })
        getRusaPermInfo(rusaPermRouteId).unwrap().then(routeInfo => {
            if (routeInfo.length === 0) {
                dispatch(errorDetailsSet(`${rusaPermRouteId} is not a valid permanent route ID`))
                return
            }
            dispatch(rwgpsRouteSet(routeInfo[0].rwgps))
            dispatch(loadFromRideWithGps())
        }).catch(error => dispatch(errorDetailsSet(error)))
    }, [rusaPermRouteId])

    const isReturnKey = function(event : React.KeyboardEvent) {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode === 13) {
            (loadButtonRef.current! as HTMLButtonElement).click()
        }
    };

    const clearRoute = () => {
        dispatch(rusaPermRouteIdSet(''))
    }

    const settingRoute = (route : string) => {
        dispatch(rusaPermRouteIdSet(route))
    }

    return (
        <>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <FormGroup inline={false} style={{fontSize:"90%"}} label={<span><b>RUSA permanent route ID</b></span>} labelFor={'rusa_perm_route'} >
                    <InputGroup id={'rusa_perm_route'} style={{fontSize:"16px"}} className={'glowing_input'}
                        autoFocus tabIndex={0} type="number" rightElement={<Button minimal icon="delete" onClick={clearRoute}></Button>}
                        onValueChange={settingRoute}
                        onKeyDown={isReturnKey}
                        value={rusaPermRouteId}/>
                </FormGroup>
            </div>
            <RUSALoadRouteButton loadButtonRef={loadButtonRef} lookupFunc={lookupRouteId}/>
        </>
    )
}

type RUSALoadRouteButtonProps = {
    loadButtonRef: React.MutableRefObject<HTMLButtonElement|null>
    lookupFunc:  () => void
}

const RUSALoadRouteButton = ({loadButtonRef, lookupFunc} : RUSALoadRouteButtonProps) => {
  const isLoading = useAppSelector(state => state.uiInfo.dialogParams.fetchingRoute)
  const hasRusaPermId = useAppSelector(state => state.uiInfo.routeParams.rusaPermRouteId !== '')
  return (
    <Button ref={loadButtonRef} intent={Intent.PRIMARY} fill disabled={isLoading || (!hasRusaPermId)}
        onClick={lookupFunc} loading={isLoading}>
            Load Route
    </Button>
  )
}