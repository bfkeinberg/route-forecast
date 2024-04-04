import { Button,Icon } from "@blueprintjs/core";
import PropTypes from 'prop-types';
import React from "react";

export const ToggleButton = ({children, active, onClick, icon = null, style = {}}) => {

  return (
    <Button style={{height: '100%', border: "1px solid #6c757d80", display: "flex", alignItems: "center", justifyContent: "center", padding: '.25rem .5rem', ...style}} onClick={onClick} intent={active ? "success" : "none"} small={true}>
      <span style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
          <Icon icon={icon || (active ? "selection" : "circle")} style={{opacity: active ? 1 : 0.25, transition: "opacity 0.15s"}}/>
        <span style={{opacity: active ? 1 : 0.25, transition: "opacity 0.15s", textAlign: 'center'}}>
          {children}
        </span>
      </span>
    </Button>
  )
}

ToggleButton.propTypes = {
  children:PropTypes.string,
  active:PropTypes.bool,
  onClick:PropTypes.func,
  icon:PropTypes.string,
  style:PropTypes.object
};