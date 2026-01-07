
import '@mantine/core/styles/Switch.css';
import "./AlwaysFilledSwitch.css"
import { Switch } from "@mantine/core";
import type { SwitchProps } from "@mantine/core";

interface AlwaysFilledSwitchProps extends SwitchProps{
  checked: boolean  
}

export const AlwaysFilledSwitch = (props : AlwaysFilledSwitchProps) => {
  return (
    <Switch {...props} className={`always-filled-switch ${props.checked ? "checked" : "unchecked"}`} style={{/* paddingLeft: "46px",  */marginBottom: "0px"}} />
  )
}
