
import React, { useState, useRef } from 'react';
import RideWithGpsId from './RideWithGpsId';
import PinnedRouteLoader from './PinnedRouteLoader.jsx';
import ErrorBoundary from "../shared/ErrorBoundary";
import { loadFromRideWithGps } from '../../redux/actions';
import { Spinner, Button } from '@blueprintjs/core';
import { useSelector, useDispatch } from 'react-redux';

export const RouteInfoInputRWGPS = () => {
  const usingPinnedRoutes = useSelector(state => state.rideWithGpsInfo.usePinnedRoutes)

  const [
showPinnedRoutes,
setShowPinnedRoutes
] = useState(usingPinnedRoutes)
  const loadButtonRef = useRef(null)

  return (
    <>
      <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
        {showPinnedRoutes ?
null :
          <>
            <div style={{flex: 1}}><RideWithGpsId loadButtonRef={loadButtonRef}/></div>
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
      </div>
      <RWGPSLoadRouteButton loadButtonRef={loadButtonRef}/>
    </>
  )
}

// eslint-disable-next-line react/prop-types
const RWGPSLoadRouteButton = ({loadButtonRef}) => {
  const loading = useSelector(state => state.uiInfo.dialogParams.fetchingRoute)
  const dispatch = useDispatch()
  return (
    <Button ref={loadButtonRef} disabled={loading} style={{ backgroundColor: "#137cbd", borderColor: "#137cbd", marginTop: "10px", width: "100%" }} onClick={() => dispatch(loadFromRideWithGps())}>
      {loading ? "Loading..." : "Load Route"}
      {loading && <Spinner />}
    </Button>
  )
}