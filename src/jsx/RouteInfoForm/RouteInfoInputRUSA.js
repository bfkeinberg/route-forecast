
import { Button,FormGroup, InputGroup,Spinner } from '@blueprintjs/core';
import React, { useRef } from 'react';
import ReactGA from "react-ga4"
import { useDispatch,useSelector } from 'react-redux';

import { loadFromRideWithGps } from '../../redux/actions';
import { errorDetailsSet,rusaPermRouteIdSet, rwgpsRouteSet } from '../../redux/reducer';
import { rusaIdLookupApiSlice } from '../../redux/rusaLookupApiSlice';

export const RouteInfoInputRUSA = () => {
    const loadButtonRef = useRef(null)
    const dispatch = useDispatch()
    const rusaPermRouteId = useSelector(state => state.uiInfo.routeParams.rusaPermRouteId)
    const rusaPermLookupApiKey = useSelector(state => state.params.rusaPermApiKey)

    const [getRusaPermInfo] = rusaIdLookupApiSlice.useLazyLookupRusaPermIdQuery()

    const lookupRouteId = React.useCallback(() => {
        ReactGA.event('spend_virtual_currency', {virtual_currency_name:'RUSA',value:Number.parseInt(rusaPermRouteId)})
        getRusaPermInfo(rusaPermRouteId).unwrap().then(routeInfo => {
            if (routeInfo.length === 0) {
                dispatch(errorDetailsSet(`${rusaPermRouteId} is not a valid permanent route ID`))
                return
            }
            dispatch(rwgpsRouteSet(routeInfo[0].rwgps))
            dispatch(loadFromRideWithGps())
        }).catch(error => dispatch(errorDetailsSet(error)))
    }, [rusaPermRouteId,rusaPermLookupApiKey])

    const isReturnKey = function(event) {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode === 13) {
            loadButtonRef.current.click()
        }
    };

    const clearRoute = () => {
        dispatch(rusaPermRouteIdSet(''))
    }

    const settingRoute = (route) => {
        dispatch(rusaPermRouteIdSet(route))
    }

    return (
        <>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <FormGroup inline={false} style={{fontSize:"90%"}} label={<span><b>RUSA permanent route ID</b></span>} labelFor={'rusa_perm_route'} >
                <InputGroup id={'rusa_perm_route'} className={'glowing_input'}
                    autoFocus tabIndex='0' type="number" rightElement={<Button minimal icon="delete" onClick={clearRoute}></Button>}
                    onValueChange={settingRoute}
                    onKeyDown={isReturnKey}
                    value={rusaPermRouteId}/>
            </FormGroup>
                    {/* <div style={{ flex: 1 }}><RideWithGpsId loadButtonRef={loadButtonRef} /></div>
                    <div className="or-divider" style={{ flex: 0.3, fontSize: "13px", textAlign: "center" }}>- OR -</div> */}
            </div>
            <RUSALoadRouteButton loadButtonRef={loadButtonRef} lookupFunc={lookupRouteId}/>
        </>
    )
}

// eslint-disable-next-line react/prop-types
const RUSALoadRouteButton = ({loadButtonRef, lookupFunc}) => {
  const loading = useSelector(state => state.uiInfo.dialogParams.fetchingRoute)
  const hasRusaPermId = useSelector(state => state.uiInfo.routeParams.rusaPermRouteId !== '')
  return (
    <Button ref={loadButtonRef} disabled={loading || (!hasRusaPermId)}
        style={{ backgroundColor: "#137cbd", borderColor: "#137cbd", marginTop: "10px", width: "100%" }}
        onClick={lookupFunc}>
      {loading ? "Loading..." : "Load Route"}
      {loading && <Spinner />}
    </Button>
  )
}