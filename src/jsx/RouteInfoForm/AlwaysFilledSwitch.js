
import "./AlwaysFilledSwitch.css"

import { Switch } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import React from 'react';

export const AlwaysFilledSwitch = (props) => {
  return (
    <Switch {...props} className={`always-filled-switch ${props.checked ? "checked" : "unchecked"}`} style={{paddingLeft: "46px", marginBottom: "0px"}} />
  )
}

AlwaysFilledSwitch.propTypes = {
  checked:PropTypes.bool.isRequired
};
