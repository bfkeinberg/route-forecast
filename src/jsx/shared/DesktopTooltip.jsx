import { Tooltip } from "@blueprintjs/core";
import PropTypes from 'prop-types';
import React from "react";
import { useMediaQuery } from 'react-responsive'

export const DesktopTooltip = (props) => {
    const isDesktop = useMediaQuery({ query: '(minWidth={501})' });
    return (
        <>
        {isDesktop ? <Tooltip {...props}>{props.children}</Tooltip> : props.children}
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