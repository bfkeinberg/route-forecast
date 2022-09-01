import React from "react";
import { useMediaQuery } from 'react-responsive'
import { Tooltip2 } from "@blueprintjs/popover2";
import PropTypes from 'prop-types';

export const DesktopTooltip = (props) => {
    const isDesktop = useMediaQuery({ query: '(minWidth={501})' });
    return (
        <>
        {isDesktop ? <Tooltip2 {...props}>{props.children}</Tooltip2> : props.children}
        </>
    )
}

DesktopTooltip.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.element),
        PropTypes.element.isRequired
      ]),
      options: PropTypes.object
}