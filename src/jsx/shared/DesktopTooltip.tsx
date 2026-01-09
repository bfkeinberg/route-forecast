import MediaQuery from 'react-responsive'
import { Tooltip } from "@mantine/core";
import type { TooltipProps } from '@mantine/core';

export const DesktopTooltip = (props : TooltipProps) => {
    return (
        <MediaQuery minWidth={501}>
            {(matches) => matches ?
            <Tooltip {...props}>{props.children}</Tooltip> : props.children}
        </MediaQuery>
    )
}
