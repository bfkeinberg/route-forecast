
import React from 'react';
import stravaImage from 'Images/api_logo_pwrdBy_strava_stack_light.png';
import { Button, Spinner } from '@blueprintjs/core';
import ErrorBoundary from '../shared/ErrorBoundary';
import StravaRouteIdInput from './StravaRouteIdInput';
import StravaActivityIdInput from './StravaActivityIdInput';
import { useSelector, useDispatch } from 'react-redux';
import { loadStravaActivity, loadStravaRoute } from "../../redux/actions";
import stravaRouteParser from '../../utils/stravaRouteParser';
import ReactGA from "react-ga4";

export const RouteInfoInputStrava = () => {
  const dispatch = useDispatch()

  const strava_activity_id = useSelector(state => state.strava.activity);
  const strava_route_id = useSelector(state => state.strava.route);
  const fetchRoute = () => {
    ReactGA.event('earn_virtual_currency', {virtual_currency_name:strava_activity_id});
    dispatch(loadStravaActivity())
  }

  const fetchingFromStrava = useSelector(state => state.strava.fetching)
  const accessToken = useSelector(state => state.strava.access_token)

  const validActivityId = strava_activity_id != ''

  return (
    <div style={{display: "flex", flexFlow: "column", alignItems: "flex-end"}}>
      <ErrorBoundary>
        <div style={{width: "100%"}}>
          {accessToken === null ?
            <StravaLoginButton/> :
            <div>
              <StravaActivityIdInput/>
              <StravaRouteIdInput/>
              <Button
                id='analyze'
                tabIndex='0'
                intent="primary"
                onClick={fetchRoute}
                disabled={fetchingFromStrava || !validActivityId}
                style={{backgroundColor: "rgb(234, 89, 41)", borderColor: "rgb(234, 89, 41)", width: "100%", marginTop: "10px"}}
              >
                Analyze Ride
                {fetchingFromStrava && <Spinner/>}
              </Button>
              <Button disabled={fetchingFromStrava || strava_route_id === ''} style={{ backgroundColor: "#137cbd", borderColor: "#137cbd", marginTop: "10px", width: "100%" }} onClick={() => dispatch(loadStravaRoute(strava_route_id))}>
                {fetchingFromStrava ? "Loading..." : "Load Route"}
                {fetchingFromStrava && <Spinner />}
              </Button>
            </div>
          }
        </div>
      </ErrorBoundary>
      <img style={{marginTop: "10px"}} id='stravaImage' src={stravaImage}/>
    </div>
  )
}

const StravaLoginButton = () => {
  return (
    <Button
      style={{backgroundColor: "rgb(234, 89, 41)", borderColor: "rgb(234, 89, 41)", width: "100%"}}
      onClick={() => stravaRouteParser.authenticate()}
    >
      Login to Strava
    </Button>
  )
}