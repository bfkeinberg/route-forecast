import { ReactNode } from "react";
import { Button } from "@mantine/core";
import {IconCircle, IconCircleDot} from "@tabler/icons-react"

interface ToggleButtonOpaqueProps {
  children: ReactNode
  active: boolean
  onClick: React.MouseEventHandler
  icon: React.JSX.Element | null
  style?: {}
}

export const ToggleButtonOpaque = ({children, active, onClick, icon = null, style = {}} : ToggleButtonOpaqueProps) => {
  const activeIcon = (<IconCircleDot style={{opacity: 1, transition: "opacity 0.15s"}}/>)
  const inactiveIcon = (<IconCircle style={{opacity: 0.75, transition: "opacity 0.15s"}}/>)

  return (
    <Button leftSection={icon || (active?activeIcon:inactiveIcon)} style={{border: "1px solid #6c757d80", display: "flex", alignItems: "center", justifyContent: "center", ...style}} onClick={onClick} variant={active ? "default" : "filled"} size='sm'>
      <span>
      </span>
      <span style={{opacity: active ? 1 : 0.75, transition: "opacity 0.15s"}}>
        {children}
      </span>
    </Button>
  )
}
