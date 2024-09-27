import {Toast2,Section,SectionCard} from '@blueprintjs/core';
import Slider from '@mui/material/Slider';
import PropTypes from 'prop-types';
import ReactGA from "react-ga4";
import {connect, useDispatch} from 'react-redux';

import { routeLoadingModeProps,routeLoadingModes } from '../../data/enums';
import { errorDetailsSet } from '../../redux/dialogParamsSlice';
import { RouteInfoInputRUSA } from './RouteInfoInputRUSA';
import { RouteInfoInputRWGPS } from './RouteInfoInputRWGPS';
import { RouteInfoInputStrava } from './RouteInfoInputStrava'
import { ELEVATION_1 } from '@blueprintjs/core/lib/esm/common/classes';
import {useTranslation} from 'react-i18next'
import bicycle from 'Images/bicycle.svg'
import { routeLoadingModeSet } from '../../redux/routeParamsSlice';

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
    const {t} = useTranslation()

    const modeSwitched = (item) => {
        routeLoadingModeSet(item.target.value);
        if (item.target.value === routeLoadingMode.STRAVA) {ReactGA.event('select_content', {content_type:'strava'})}
    }

    return (
        <div style={{ padding: "14px" }}>
            <RouteLoadingModeSelector mode={mode} modeSwitched={modeSwitched} />
            <div className='spacer' />
            {getInputForMode(mode)}
            {errorDetails !== null && <Toast2 style={{ padding: '10px', marginTop: "10px" }} message={errorDetails} timeout={0} onDismiss={() => dispatch(errorDetailsSet(null))} intent="danger"></Toast2>}
            <Section style={{marginTop:"1em"}} elevation={ELEVATION_1} title={t('titles.loading')}>
                <SectionCard padded>
                    <strong>Randoplan</strong> {t('data.loading')}
                </SectionCard>
            </Section>            
        </div>
    );
}

const sliderLabelRenderer = (value, index) => {
    return routeLoadingModeProps[index].name
}

const RouteLoadingModeSelector = ({ mode, modeSwitched }) => {
    return (
        <div style={{ display: "flex", justifyContent: "center", margin:'10px', padding:'40px' }}>
            <Slider
                value={mode}
                onChange={modeSwitched}
                min={1}
                max={3}
                valueLabelDisplay={'auto'}
                valueLabelFormat={sliderLabelRenderer}
                marks= {[{value:1, label:'Ride with GPS'}, {value:2,label:'Strava'}, {value:3,label:'RUSA'}]}
                sx={{
                    '& .MuiSlider-thumb': {
                        backgroundImage: `url(${bicycle})`,
                        height: '40px',
                        width: '60px',
                        display:'block',
                        borderRadius:'1px',
                        backgroundSize:'contain',
                        backgroundColor:'white',
                        padding:'12px'
                    },
                }}
            />            
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
        needToViewTable: state.forecast.valid && !state.forecast.tableViewed,
        routeLoadingMode: state.uiInfo.routeParams.routeLoadingMode
    });

const mapDispatchToProps = {
    routeLoadingModeSet, errorDetailsSet
};

RouteInfoForm.propTypes = {
    errorDetails: PropTypes.string,
    routeInfo: PropTypes.shape({ name: PropTypes.string }),
    needToViewTable: PropTypes.bool.isRequired,
    routeProps: PropTypes.object,
    routeLoadingMode: PropTypes.number,
    routeLoadingModeSet: PropTypes.func.isRequired,
    errorDetailsSet:PropTypes.func.isRequired
};

export default connect(mapStateToProps, mapDispatchToProps, null)(RouteInfoForm);
