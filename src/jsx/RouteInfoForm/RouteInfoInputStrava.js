
import React from 'react';
import stravaImage from 'Images/api_logo_pwrdBy_strava_stack_light.png';
import { Alert, Button } from 'reactstrap';
import ErrorBoundary from '../errorBoundary';
import { Spinner } from '@blueprintjs/core';
import StravaRouteIdInput from './StravaRouteIdInput';
import { useSelector } from 'react-redux';
import { loadStravaActivity } from "../actions/actions";
import stravaRouteParser from '../../stravaRouteParser';
import { useDispatch } from 'react-redux';

export const RouteInfoInputStrava = () => {
  const dispatch = useDispatch()

  const fetchRoute = () => {
    dispatch(loadStravaActivity())
  }

  const stravaError = useSelector(state => state.strava.errorDetails)
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
          <Alert isOpen={stravaError !== null && stravaError !== ""} color='danger'>Error loading route from Strava: {stravaError}</Alert>
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