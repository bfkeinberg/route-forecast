
import { Switch } from '@blueprintjs/core';
import React from 'react';
import "./AlwaysFilledSwitch.css"

export const AlwaysFilledSwitch = (props) => {
  return (
    <Switch {...props} className={`always-filled-switch ${props.checked ? "checked" : "unchecked"}`} style={{paddingLeft: "46px", marginBottom: "0px"}} />
  )
}