
import { Button,Intent } from '@blueprintjs/core';
import React, { useRef,useState } from 'react';
import { useDispatch,useSelector } from 'react-redux';

import { loadFromRideWithGps } from '../../redux/actions';
import ErrorBoundary from "../shared/ErrorBoundary";
import PinnedRouteLoader from './PinnedRouteLoader.jsx';
import RideWithGpsId from './RideWithGpsId';
import {useTranslation} from 'react-i18next'

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
  const { t } = useTranslation()
  const loading = useSelector(state => state.uiInfo.dialogParams.fetchingRoute)
  const hasRwgpsRouteId = useSelector(state => state.uiInfo.routeParams.rwgpsRoute!=='')
  const hasStravaRouteId = useSelector(state => state.strava.route!=='')
  const dispatch = useDispatch()
  return (
    <Button ref={loadButtonRef} intent={Intent.PRIMARY} disabled={loading || (!hasRwgpsRouteId && !hasStravaRouteId)}
      fill loading={loading} onClick={() => dispatch(loadFromRideWithGps())}>
      {t('buttons.loadRoute')}
    </Button>
  )
}