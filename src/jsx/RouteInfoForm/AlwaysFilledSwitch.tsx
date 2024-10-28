
import "./AlwaysFilledSwitch.css"

import { Switch, SwitchProps } from '@blueprintjs/core';

interface AlwaysFilledSwitchProps extends SwitchProps{
  checked: boolean  
}

export const AlwaysFilledSwitch = (props:AlwaysFilledSwitchProps) => {
  return (
    <Switch {...props} className={`always-filled-switch ${props.checked ? "checked" : "unchecked"}`} style={{paddingLeft: "46px", marginBottom: "0px"}} />
  )
}
