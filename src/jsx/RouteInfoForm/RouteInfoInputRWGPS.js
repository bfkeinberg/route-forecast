
import React, { useState } from 'react';
import RwGpsTypeSelector from './RwGpsTypeSelector';
import RideWithGpsId from './RideWithGpsId';
import PinnedRouteLoader from './PinnedRouteLoader.jsx';
import ErrorBoundary from "../shared/ErrorBoundary";
import { Button } from 'reactstrap';
import { loadFromRideWithGps } from '../../redux/actions';
import { Spinner } from '@blueprintjs/core';
import { useSelector, useDispatch } from 'react-redux';

export const RouteInfoInputRWGPS = () => {
  const usingPinnedRoutes = useSelector(state => state.rideWithGpsInfo.usePinnedRoutes)

  const [
showPinnedRoutes,
setShowPinnedRoutes
] = useState(usingPinnedRoutes)

  return (
    <>
      <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
        {showPinnedRoutes ?
null :
          <>
            <div style={{flex: 1}}><RideWithGpsId /></div>
            <div className="or-divider" style={{flex: 0.3, fontSize: "13px", textAlign: "center"}}>- OR -</div>
          </>
        }
        <ErrorBoundary>
          <div style={{flex: 1, padding: "5px"}}>
            <PinnedRouteLoader
              showPinnedRoutes={showPinnedRoutes}
              setShowPinnedRoutes={setShowPinnedRoutes}
            />
          </div>
        </ErrorBoundary>
        <RwGpsTypeSelector visible={false}/>
      </div>
      <RWGPSLoadRouteButton/>
    </>
  )
}

const RWGPSLoadRouteButton = () => {
  const loading = useSelector(state => state.uiInfo.dialogParams.fetchingRoute)
  const dispatch = useDispatch()
  return (
    <Button disabled={loading} style={{ backgroundColor: "#137cbd", borderColor: "#137cbd", marginTop: "10px", width: "100%" }} onClick={() => dispatch(loadFromRideWithGps())}>
      {loading ? "Loading..." : "Load Route"}
      {loading && <Spinner />}
    </Button>
  )
}