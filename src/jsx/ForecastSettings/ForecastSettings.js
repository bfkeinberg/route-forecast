import React from 'react';
import { useSelector } from 'react-redux';
import '../../static/controlsStyles.css';
import { SettingsRWGPS } from './SettingsRWGPS';
import { SettingsStrava } from './SettingsStrava';
import { routeLoadingModes } from '../../data/enums';
import { ControlTableContainer } from './ControlTableContainer';

export default () => {
    const routeLoadingMode = useSelector(state => state.uiInfo.routeParams.routeLoadingMode)

    return (
        <div className="controlPoints">
            {routeLoadingMode === routeLoadingModes.RWGPS ?
                <SettingsRWGPS /> :
                <SettingsStrava />}
            <ControlTableContainer/>
        </div>
    );
}