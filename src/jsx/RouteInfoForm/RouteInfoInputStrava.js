
import React from 'react';
import stravaImage from 'Images/api_logo_pwrdBy_strava_stack_light.png';
import { Alert, Button } from 'reactstrap';
import ErrorBoundary from '../errorBoundary';
import { Spinner } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import StravaRouteIdInput from './StravaRouteIdInput';
import { connect } from 'react-redux';
import { updateExpectedTimes } from "../actions/actions";

const RouteInfoInputStrava = ({stravaError, fetchingFromStrava, updateExpectedTimes}) => {
  const fetchRoute = () => {
    updateExpectedTimes()
  }

  const validRouteId = true

  return (
    <>
      <ErrorBoundary>
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
        <Alert isOpen={stravaError !== null && stravaError !== ""} color='warning'>{stravaError}</Alert>
      </ErrorBoundary>
      <img id='stravaImage' src={stravaImage}/>
    </>
  )
}

RouteInfoInputStrava.propTypes = {
  stravaError: PropTypes.string,
  fetchingFromStrava:PropTypes.bool,
  updateExpectedTimes: PropTypes.func.isRequired
}

const mapStateToProps = (state) =>
  ({
      stravaError: state.strava.errorDetails,
      fetchingFromStrava: state.strava.fetching
  });

const mapDispatchToProps = {
  updateExpectedTimes
};

export default connect(mapStateToProps, mapDispatchToProps)(RouteInfoInputStrava);