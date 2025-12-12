import { Button } from "@mantine/core";
import {IconCircle, IconCircleDot} from "@tabler/icons-react"
import { ForwardedRef, forwardRef } from "react";
interface ToggleButtonProps {
  children: string
  active: boolean
  onClick: (event : React.MouseEvent) => void
  icon?: React.JSX.Element | null
  style?: {}
}

export const ToggleButton = forwardRef((props : ToggleButtonProps, ref : ForwardedRef<HTMLButtonElement>) => {
  const {children, active, onClick, icon, style} : ToggleButtonProps = props
  const activeIcon = (<IconCircleDot style={{opacity: 1, transition: "opacity 0.15s"}}/>)
  const inactiveIcon = (<IconCircle style={{opacity: 0.25, transition: "opacity 0.15s"}}/>)
  return (
    <Button ref={ref} leftSection={icon || (active?activeIcon:inactiveIcon)} 
    style={{height: '100%', border: "1px solid #6c757d80", display: "flex", alignItems: "center", 
      justifyContent: "center", padding: '.25rem .5rem', ...style}}
     onClick={onClick} variant={active ? "success" : "default"} size='compact-sm'>
      <span style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
        <span style={{opacity: active ? 1 : 0.25, transition: "opacity 0.15s", textAlign: 'center'}}>
          {children}
        </span>
      </span>
    </Button>
  )
})
