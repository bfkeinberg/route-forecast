import {Button,MenuItem,Toast2,Divider} from '@blueprintjs/core';
import { Select } from "@blueprintjs/select"
import PropTypes from 'prop-types';
import React from 'react';
import ReactGA from "react-ga4";
import {connect, useDispatch} from 'react-redux';
import MediaQuery from 'react-responsive';

import { routeLoadingModeProps,routeLoadingModes } from '../../data/enums';
import { errorDetailsSet, routeLoadingModeSet } from '../../redux/reducer';
import ShortUrl from '../TopBar/ShortUrl';
import { RouteInfoInputRUSA } from './RouteInfoInputRUSA';
import { RouteInfoInputRWGPS } from './RouteInfoInputRWGPS';
import { RouteInfoInputStrava } from './RouteInfoInputStrava'
import { ELEVATION_1 } from '@blueprintjs/core/lib/esm/common/classes';
import {useTranslation} from 'react-i18next'

const getInputForMode = (mode) => {
    switch (mode) {
        case routeLoadingModes.RWGPS:
            return <RouteInfoInputRWGPS/>
        case routeLoadingModes.STRAVA:
            return <RouteInfoInputStrava/>
        case routeLoadingModes.RUSA_PERM:
            return <RouteInfoInputRUSA/>
        default:
            return <RouteInfoInputRWGPS/>
    }
}

const RouteInfoForm = ({ errorDetails, errorDetailsSet, routeLoadingMode, routeLoadingModeSet }) => {
    const mode = routeLoadingMode
    const dispatch = useDispatch()

    const modeSwitched = (item) => {
        routeLoadingModeSet(item);
        if (item === routeLoadingMode.STRAVA) {ReactGA.event('select_content', {content_type:'strava'})}
    }

    return (
        <div style={{ padding: "14px" }}>
            <RouteLoadingModeSelector mode={mode} modeSwitched={modeSwitched} />
            <div className='spacer' />
            {getInputForMode(mode)}
            {errorDetails !== null && <Toast2 style={{ padding: '10px', marginTop: "10px" }} message={errorDetails} timeout={0} onDismiss={() => dispatch(errorDetailsSet(null))} intent="danger"></Toast2>}
            <MediaQuery maxDeviceWidth={500}>
                <div style={{ marginTop: "10px", textAlign: "center" }}>
                    <ShortUrl />
                </div>
            </MediaQuery>
        </div>
    );
}

const renderMode = (mode, { handleClick, handleFocus, modifiers }) => {
    if (!modifiers.matchesPredicate) {
        return null;
    }
    return (
        <MenuItem
            active={modifiers.active}
            key={mode.key}
            disabled={mode.disabled}
            onClick={handleClick}
            onFocus={handleFocus}
            text={mode.name}
        />
    );
};

const RouteLoadingModeSelector = ({ mode, modeSwitched }) => {
    const { t } = useTranslation()
    return (
        <div style={{ display: "flex", justifyContent: "center" }}>
            <Select tabIndex="0"
                id='routeMode'
                items={routeLoadingModeProps}
                itemsEqual={"name"}
                itemRenderer={renderMode}
                filterable={false}
                fill={false}
                activeItem={{ key: mode, name: mode.name }}
                onItemSelect={(selected) => { modeSwitched(selected.key) }}
            >
                <span style={{ marginRight: "1em" }}><b>{t('labels.routeType')}</b></span>
                <Button text={routeLoadingModeProps[mode - 1].name} rightIcon="symbol-triangle-down" />
            </Select>
        </div>
    )
}

RouteLoadingModeSelector.propTypes = {
    mode:PropTypes.number.isRequired,
    modeSwitched:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        errorDetails: state.uiInfo.dialogParams.errorDetails,
        routeInfo: state.routeInfo,
        controlPoints: state.controls.userControlPoints,
        needToViewTable: state.forecast.valid && !state.forecast.tableViewed,
        routeLoadingMode: state.uiInfo.routeParams.routeLoadingMode
    });

const mapDispatchToProps = {
    routeLoadingModeSet, errorDetailsSet
};

RouteInfoForm.propTypes = {
    controlPoints: PropTypes.arrayOf(PropTypes.object).isRequired,
    errorDetails: PropTypes.string,
    routeInfo: PropTypes.shape({ name: PropTypes.string }),
    needToViewTable: PropTypes.bool.isRequired,
    routeProps: PropTypes.object,
    routeLoadingMode: PropTypes.number,
    routeLoadingModeSet: PropTypes.func.isRequired,
    errorDetailsSet:PropTypes.func.isRequired
};

export default connect(mapStateToProps, mapDispatchToProps, null)(RouteInfoForm);
