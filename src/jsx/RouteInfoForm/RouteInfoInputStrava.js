
import React from 'react';
import stravaImage from 'Images/api_logo_pwrdBy_strava_stack_light.png';
import { Alert, Button } from 'reactstrap';
import ErrorBoundary from '../errorBoundary';
import { Spinner } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import StravaRouteIdInput from './StravaRouteIdInput';
import { connect } from 'react-redux';
import { updateExpectedTimes } from "../actions/actions";
import stravaRouteParser from '../../stravaRouteParser';

const RouteInfoInputStrava = ({stravaError, fetchingFromStrava, updateExpectedTimes, accessToken}) => {
  const fetchRoute = () => {
    updateExpectedTimes()
  }

  const validRouteId = true

  return (
    <div style={{display: "flex", flexFlow: "column", alignItems: "flex-end"}}>
      <ErrorBoundary>
        <div style={{width: "100%"}}>
          {accessToken === null ?
            <StravaLoginButton/> :
            <>
              <StravaRouteIdInput/>
              <Button
                id='forecast'
                tabIndex='6'
                color="primary"
                onClick={fetchRoute}
                disabled={fetchingFromStrava || !validRouteId}
                style={{backgroundColor: "rgb(234, 89, 41)", borderColor: "rgb(234, 89, 41)"}}
              >
                Analyze Route
                {fetchingFromStrava && <Spinner/>}
              </Button>
            </>
          }
          <Alert isOpen={stravaError !== null && stravaError !== ""} color='danger'>Error loading route from Strava: {stravaError}</Alert>
        </div>
      </ErrorBoundary>
      <img style={{marginTop: "10px"}} id='stravaImage' src={stravaImage}/>
    </div>
  )
}

RouteInfoInputStrava.propTypes = {
  stravaError: PropTypes.string,
  fetchingFromStrava:PropTypes.bool,
  updateExpectedTimes: PropTypes.func.isRequired,
  accessToken: PropTypes.string
}

const mapStateToProps = (state) =>
  ({
      stravaError: state.strava.errorDetails,
      fetchingFromStrava: state.strava.fetching,
      accessToken: state.strava.access_token
  });

const mapDispatchToProps = {
  updateExpectedTimes
};

export default connect(mapStateToProps, mapDispatchToProps)(RouteInfoInputStrava);

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