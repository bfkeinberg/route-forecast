import { Icon, Button } from "@blueprintjs/core";
import React from "react";
import PropTypes from 'prop-types';

export const ToggleButtonOpaque = ({children, active, onClick, icon = null, style = {}}) => {

  return (
    <Button style={{border: "1px solid #6c757d80", display: "flex", alignItems: "center", justifyContent: "center", ...style}} onClick={onClick} intent={active ? "none" : "primary"} small={true}>
      <span>
        <Icon icon={icon || (active ? "selection" : "circle")} style={{marginRight: "5px", opacity: active ? 1 : 0.75, transition: "opacity 0.15s"}}/>
      </span>
      <span style={{opacity: active ? 1 : 0.75, transition: "opacity 0.15s"}}>
        {children}
      </span>
    </Button>
  )
}

ToggleButtonOpaque.propTypes = {
  children:PropTypes.string,
  active:PropTypes.bool,
  onClick:PropTypes.func,
  icon:PropTypes.string,
  style:PropTypes.object
};