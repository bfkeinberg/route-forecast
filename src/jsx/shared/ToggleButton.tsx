import { Button,Icon, MaybeElement } from "@blueprintjs/core";
import { BlueprintIcons_16Id } from "@blueprintjs/icons/lib/esm/generated/16px/blueprint-icons-16";

interface ToggleButtonProps {
  children: string
  active: boolean
  onClick: (event : React.MouseEvent) => void
  icon?: BlueprintIcons_16Id | MaybeElement
  style?: {}
}
export const ToggleButton = ({children, active, onClick, icon = null, style = {}} : ToggleButtonProps) => {

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
