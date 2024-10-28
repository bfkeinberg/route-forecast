import { Button,Icon, MaybeElement } from "@blueprintjs/core";
import { BlueprintIcons_16Id } from "@blueprintjs/icons/lib/esm/generated/16px/blueprint-icons-16";
import { ReactNode } from "react";

interface ToggleButtonOpaqueProps {
  children: ReactNode
  active: boolean
  onClick: React.MouseEventHandler
  icon: BlueprintIcons_16Id | MaybeElement | null
  style?: {}
}

export const ToggleButtonOpaque = ({children, active, onClick, icon = null, style = {}} : ToggleButtonOpaqueProps) => {

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
