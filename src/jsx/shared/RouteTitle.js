import React from "react"
import { useSelector } from "react-redux"
import PropTypes from 'prop-types';

export const RouteTitle = ({style, className}) => {
  const routeName = useSelector(state => state.routeInfo.name)

  return (
    <div className={className} style={{fontStyle: "oblique", color: "rgba(64, 111, 140, 0.87)", fontSize: "20px", height: "60px", textAlign: "center", ...style}}>{routeName}</div>
  )
}

RouteTitle.propTypes = {
  className:PropTypes.string,
  style:PropTypes.object
};