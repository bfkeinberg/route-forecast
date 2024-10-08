
import { Button,Intent } from '@blueprintjs/core';
import { useRef,useState } from 'react';

import { loadFromRideWithGps } from '../../redux/actions.js';
import ErrorBoundary from "../shared/ErrorBoundary.js";
import PinnedRouteLoader from './PinnedRouteLoader';
import RideWithGpsId from './RideWithGpsId.js';
import {useTranslation} from 'react-i18next'
import type { RefObject } from 'react';
import { useAppSelector, useAppDispatch } from '../../utils/hooks.js';
export const RouteInfoInputRWGPS = () => {
  const usingPinnedRoutes = useAppSelector(state => state.rideWithGpsInfo.usePinnedRoutes)
  const [
showPinnedRoutes,
setShowPinnedRoutes
] = useState<boolean>(usingPinnedRoutes)
  const loadButtonRef = useRef<HTMLButtonElement>(null)

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
const RWGPSLoadRouteButton = ({loadButtonRef}:{loadButtonRef:RefObject<HTMLButtonElement>}) => {
  const { t } = useTranslation()
  const loading = useAppSelector(state => state.uiInfo.dialogParams.fetchingRoute)
  const hasRwgpsRouteId = useAppSelector(state => state.uiInfo.routeParams.rwgpsRoute!=='')
  const hasStravaRouteId = useAppSelector(state => state.strava.route!=='')
  const dispatch = useAppDispatch()
  return (
    <Button ref={loadButtonRef} intent={Intent.PRIMARY} disabled={loading || (!hasRwgpsRouteId && !hasStravaRouteId)}
      fill loading={loading} onClick={() => dispatch(loadFromRideWithGps())}>
      {t('buttons.loadRoute')}
    </Button>
  )
}