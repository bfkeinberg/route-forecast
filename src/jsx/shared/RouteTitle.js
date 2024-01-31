import React from "react"
import { useSelector } from "react-redux"
import PropTypes from 'prop-types';
import { useMediaQuery } from "react-responsive";

export const RouteTitle = ({style, className}) => {
  const titleFont = useMediaQuery({ query: '(min-width: 1540px)' }) ? "20px" : "15px"
  const routeName = useSelector(state => state.routeInfo.name || (state.strava.activityData && state.strava.activityData.name))

  return (
    <div className={className} style={{fontStyle: "oblique", color: "rgba(64, 111, 140, 0.87)", fontSize: titleFont, height: "60px", textAlign: "center", ...style}}>{routeName}</div>
  )
}

RouteTitle.propTypes = {
  className:PropTypes.string,
  style:PropTypes.object
};