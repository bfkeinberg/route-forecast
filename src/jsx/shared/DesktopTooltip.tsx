import MediaQuery from 'react-responsive'
import { Tooltip, TooltipProps } from "@mantine/core";

export const DesktopTooltip = (props : TooltipProps) => {
    return (
        <MediaQuery minWidth={501}>
            {(matches) => matches ?
            <Tooltip {...props}>{props.children}</Tooltip> : props.children}
        </MediaQuery>
    )
}
