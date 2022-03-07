import { Icon } from "@blueprintjs/core";
import React from "react";
import { Button } from "reactstrap";

export const ToggleButton = ({children, active, onClick, icon = null, style = {}}) => {

  return (
    <Button style={{border: "1px solid #6c757d80", display: "flex", alignItems: "center", justifyContent: "center", ...style}} onClick={onClick} color={active ? "secondary" : "light"} size={"sm"}>
      <span>
        <Icon icon={icon || (active ? "selection" : "circle")} style={{marginRight: "5px", opacity: active ? 1 : 0.25, transition: "opacity 0.15s"}}/>
      </span>
      <span style={{opacity: active ? 1 : 0.25, transition: "opacity 0.15s"}}>
        {children}
      </span>
    </Button>
  )
}