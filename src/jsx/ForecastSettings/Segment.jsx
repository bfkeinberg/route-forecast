import { Button} from '@blueprintjs/core';
import Slider from "@mui/material/Slider"
import Typography from '@mui/material/Typography'

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { segmentSet } from '../../redux/reducer';
import { milesToMeters } from '../../utils/util';

const Segment = () => {
    const dispatch = useDispatch()
    const maxDistanceInKm = useSelector(state => state.routeInfo.distanceInKm)
    const segment = useSelector(state => state.uiInfo.routeParams.segment)
    const metric = useSelector(state => state.controls.metric)

    // convert distance from miles to meters if we are not using metric
    // else convert from km to meters
    const transformDistance = distance => {
        return metric ? distance * 1000 : (distance * milesToMeters)
    }

    // convert distance from meters to miles if we aren't using metric
    // else convert from meters to km
    const metersToMiles = distance => {
        return metric ? distance/1000 : (distance / milesToMeters)
    }

    // convert distance from km to miles if we aren't using metric
    const kmToMiles = distance => {
        return metric ? distance : ((distance * 1000) / milesToMeters)
    }

    const cvtToCtrlValue = (value) => {
        return metersToMiles(value)
    }

    const segmentUpdate = (event, newValue) => {
        dispatch(segmentSet([transformDistance(newValue[0]),transformDistance(newValue[1])]))
    }

    const maxDistance = kmToMiles(maxDistanceInKm)

    const resetSegment = () => {
        dispatch(segmentSet([0, maxDistanceInKm*1000]))
    }

    const sliderLabelRenderer = (value, index) => {
        return value.toFixed(1)
    }
    
    const getSliderValue = (segment) => {
        return segment.map(val => cvtToCtrlValue(val))
    }

    return (
        <>
        <Typography gutterBottom>Use custom segment length</Typography>
        <Slider marks value={getSliderValue(segment)} valueLabelFormat={sliderLabelRenderer} valueLabelDisplay='auto'
            min={0} max={maxDistance} onChange={segmentUpdate} />
        <Button onClick={resetSegment}>Reset segment</Button>
        </>)
}

export default React.memo(Segment)