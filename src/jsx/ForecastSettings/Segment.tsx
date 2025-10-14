import Slider from "@mui/material/Slider"
import Typography from '@mui/material/Typography'

import * as React from 'react';
import { useAppDispatch, useAppSelector } from '../../utils/hooks';
import { segmentSet } from '../../redux/routeParamsSlice'
import { milesToMeters } from '../../utils/util';
import {useTranslation} from 'react-i18next'
import Tooltip from '@mui/material/Tooltip'
import Button from "@mui/material/Button"

const Segment = () => {
    const dispatch = useAppDispatch()
    const { t } = useTranslation()
    const maxDistanceInKm = useAppSelector(state => state.routeInfo.distanceInKm)
    const segment = useAppSelector(state => state.uiInfo.routeParams.segment)
    const metric = useAppSelector(state => state.controls.metric)
    const canDoUserSegment = useAppSelector(state => state.routeInfo.canDoUserSegment)

    // convert distance from miles to meters if we are not using metric
    // else convert from km to meters
    const transformDistance = (distance : number) => {
        return metric ? distance * 1000 : (distance * milesToMeters)
    }

    // convert distance from meters to miles if we aren't using metric
    // else convert from meters to km
    const metersToMiles = (distance : number) => {
        return metric ? distance/1000 : (distance / milesToMeters)
    }

    // convert distance from km to miles if we aren't using metric
    const kmToMiles = (distance : number) => {
        return metric ? distance : ((distance * 1000) / milesToMeters)
    }

    const cvtToCtrlValue = (value : number) => {
        return metersToMiles(value)
    }

    const segmentUpdate = (event: Event, newValue: number | number[]) => {
        dispatch(segmentSet([transformDistance((newValue as number[])[0]),transformDistance((newValue as number[])[1])]))
    }

    const maxDistance = kmToMiles(maxDistanceInKm)

    const resetSegment = () => {
        dispatch(segmentSet([0, maxDistanceInKm*1000]))
    }

    const sliderLabelRenderer = (value: number, index: any) => {
        return value.toFixed(1)
    }
    
    const getSliderValue = (segment: number[]) => {
        return segment.map((val: number) => cvtToCtrlValue(val))
    }

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Typography gutterBottom>{t('labels.customSegment')}</Typography>
                <Button disabled={!canDoUserSegment} variant='outlined' onClick={resetSegment}>Reset</Button>
            </div>
            <Tooltip describeChild arrow title={t('tooltips.customSegment')}>
                <Slider marks value={getSliderValue(segment)} valueLabelFormat={sliderLabelRenderer} valueLabelDisplay='auto'
                    getAriaLabel={() => 'Route segment'} style={{width:'96%', marginLeft:'5px'}}
                    min={0} max={maxDistance} onChange={segmentUpdate} disabled={!canDoUserSegment} />
            </Tooltip>
        </>)
}

export default React.memo(Segment)