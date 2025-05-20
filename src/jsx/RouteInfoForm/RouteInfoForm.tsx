import {Toast2,Section,SectionCard, Elevation} from '@blueprintjs/core';
import Slider from '@mui/material/Slider';
import ReactGA from "react-ga4";
import {connect, useDispatch, ConnectedProps} from 'react-redux';

import { routeLoadingModeProps,RouteLoadingModes,routeLoadingModes } from '../../data/enums';
import { errorDetailsSet } from '../../redux/dialogParamsSlice';
import { RouteInfoInputRUSA } from './RouteInfoInputRUSA';
import { RouteInfoInputRWGPS } from './RouteInfoInputRWGPS';
import { RouteInfoInputStrava } from './RouteInfoInputStrava'
import {useTranslation} from 'react-i18next'
import bicycle from 'Images/bicycle.svg'
import { routeLoadingModeSet } from '../../redux/routeParamsSlice';
import type { RootState } from "../../redux/store";
import { ReactNode } from 'react';
type PropsFromRedux = ConnectedProps<typeof connector>

const getInputForMode = (mode : RouteLoadingModes ) => {
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

const RouteInfoForm = ({ errorDetails, errorDetailsSet, routeLoadingMode, routeLoadingModeSet } : PropsFromRedux) => {
    const mode = routeLoadingMode
    const dispatch = useDispatch()
    const {t} = useTranslation()

    const modeSwitched = (item : Event, newValue: number | number[]) => {
        routeLoadingModeSet(newValue);
        if (newValue === routeLoadingModes.STRAVA) {ReactGA.event('select_content', {content_type:'strava'})}
    }

    return (
        <div style={{ padding: "14px" }}>
            <RouteLoadingModeSelector mode={mode} modeSwitched={modeSwitched} />
            <div className='spacer' />
            {getInputForMode(mode)}
            {errorDetails !== null && <div style={{ padding: '10px', marginTop: "10px" }}><Toast2 message={errorDetails} timeout={0} onDismiss={() => dispatch(errorDetailsSet(null))} intent="danger"></Toast2></div>}
            <Section style={{marginTop:"1em"}} elevation={Elevation.ONE} title={t('titles.loading')}>
                <SectionCard padded>
                    <strong>Randoplan</strong> {t('data.loading')}
                </SectionCard>
            </Section>            
        </div>
    );
}

const sliderLabelRenderer = (value : number, index : number) : ReactNode => {
    let offset = 0;
    switch (value) {
        case 2: offset = -25; break;
        case 3: offset = -80; break;
        default: 
    }
    return <div style={{position:'relative', left:`${offset}px`, backgroundColor:'#757575', color:'white'}}>{routeLoadingModeProps[value].name}</div>
}

const RouteLoadingModeSelector = ({ mode, modeSwitched } : {mode:RouteLoadingModes, modeSwitched: (item: Event, value: number|number[]) => void}) => {
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

const mapStateToProps = (state : RootState) =>
    ({
        errorDetails: state.uiInfo.dialogParams.errorDetails,
        routeInfo: state.routeInfo,
        needToViewTable: state.forecast.valid && !state.forecast.tableViewed,
        routeLoadingMode: state.uiInfo.routeParams.routeLoadingMode
    });

const mapDispatchToProps = {
    routeLoadingModeSet, errorDetailsSet
};

const connector = connect(mapStateToProps, mapDispatchToProps)
export default connector(RouteInfoForm);
