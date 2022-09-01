import React from "react";
import MediaQuery from 'react-responsive';
import { Tooltip2 } from "@blueprintjs/popover2";
import PropTypes from 'prop-types';

export const DesktopTooltip = (props) => {
    return (
        <>
            <MediaQuery minWidth={501}>
                <Tooltip2 {...props}>
                    {props.children}
                </Tooltip2>
            </MediaQuery>
            <MediaQuery maxWidth={500}>
                {props.children}
            </MediaQuery>
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