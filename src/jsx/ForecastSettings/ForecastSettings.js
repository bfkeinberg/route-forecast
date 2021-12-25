import React from 'react';
import '../../static/controlsStyles.css';
import { SettingsRWGPS } from './SettingsRWGPS';
import { ControlTableContainer } from './ControlTableContainer';

export default () => {
    return (
        <div className="controlPoints">
            <SettingsRWGPS />
            <ControlTableContainer/>
        </div>
    );
}