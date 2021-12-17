
import React from 'react';
import StravaDialog from './StravaDialog';
import stravaImage from 'Images/api_logo_pwrdBy_strava_stack_light.png';

export const RouteInfoInputStrava = ({}) => {

  return (
    <>
      <StravaDialog/>
      <img id='stravaImage' src={stravaImage}/>
    </>
  )
}