
import React from 'react';
import stravaImage from 'Images/api_logo_pwrdBy_strava_stack_light.png';
import { Button } from 'reactstrap';
import ErrorBoundary from '../shared/ErrorBoundary';
import { Spinner } from '@blueprintjs/core';
import StravaRouteIdInput from './StravaRouteIdInput';
import { useSelector, useDispatch } from 'react-redux';
import { loadStravaActivity } from "../../redux/actions";
import stravaRouteParser from '../../utils/stravaRouteParser';
import ReactGA from "react-ga4";

export const RouteInfoInputStrava = () => {
  const dispatch = useDispatch()

  const strava_activity_id = useSelector(state => state.strava.activity);
  const fetchRoute = () => {
    ReactGA.event('earn_virtual_currency', {virtual_currency_name:strava_activity_id});
    dispatch(loadStravaActivity())
  }

  const fetchingFromStrava = useSelector(state => state.strava.fetching)
  const accessToken = useSelector(state => state.strava.access_token)

  const validRouteId = true

  return (
    <div style={{display: "flex", flexFlow: "column", alignItems: "flex-end"}}>
      <ErrorBoundary>
        <div style={{width: "100%"}}>
          {accessToken === null ?
            <StravaLoginButton/> :
            <div>
              <StravaRouteIdInput/>
              <Button
                id='forecast'
                tabIndex='6'
                color="primary"
                onClick={fetchRoute}
                disabled={fetchingFromStrava || !validRouteId}
                style={{backgroundColor: "rgb(234, 89, 41)", borderColor: "rgb(234, 89, 41)", width: "100%", marginTop: "10px"}}
              >
                Analyze Route
                {fetchingFromStrava && <Spinner/>}
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