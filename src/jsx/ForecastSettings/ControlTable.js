import { Icon } from '@blueprintjs/core';
import React from 'react';
import { useDispatch,useSelector } from 'react-redux';

import { removeControl as removeControlAction, updateUserControls } from '../../redux/actions';
import { useActualArrivalTimes, useForecastDependentValues } from '../../utils/hooks';
import { milesToMeters,stringIsOnlyDecimal, stringIsOnlyNumeric } from '../../utils/util';
import { Table } from "./Table"
import {useTranslation} from 'react-i18next'

const minSuffixFunction = value => `${value} min`

export const ControlTable = () => {
    const { t } = useTranslation()

    const displayBanked = useSelector(state => state.controls.displayBanked)
    const stravaActivityData = useSelector(state => state.strava.activityData)
    const compare = stravaActivityData !== null
    const metric = useSelector(state => state.controls.metric)
    const controls = useSelector(state => state.controls.userControlPoints)

    const { calculatedControlPointValues: calculatedValues } = useForecastDependentValues()

    const actualArrivalTimes = useActualArrivalTimes()
    const dispatch = useDispatch()
    const updateControls = controls => dispatch(updateUserControls(controls))
    const removeControl = indexToRemove => dispatch(removeControlAction(indexToRemove))

    const onCellValueChanged = (rowIndex, field, value) => {
        if (field === "duration") {
            value = Number(value)
        }
        updateControls(controls.map((control, index) => (index === rowIndex ? {...control, [field]: value} : control)))
    }

    const controlsData = controls.map((control, index) => {
        const controlObject = {...control}
        if (calculatedValues !== null) {
            Object.assign(controlObject, calculatedValues[index])
        }
        if (actualArrivalTimes !== null && actualArrivalTimes[index] !== undefined) {
            controlObject.actual = actualArrivalTimes[index].time
        }
        return controlObject
    })

    const sortOurStuffByDistance = () => {
        const sortedControls = Array.from(controls);
        sortedControls.sort((control1, control2) => control1.distance - control2.distance);
        updateControls(sortedControls.map((value, index) => {return {id:index, ...value}}));
    }

    const rwgpsCellStyle = calculatedValues !== null ? {backgroundColor: "rgb(19, 124, 189)", color: "white"} : {}

    const transformDistance = distance => {
        return metric ? ((distance * milesToMeters) / 1000).toFixed(1) : distance;
    };

    const reverseTransformDistance = distance => {
        return metric ? ((distance * 1000) / milesToMeters).toFixed(1) : distance;
    }

    const tableData = {
        rows: controlsData.map(({name, distance, duration, arrival, banked, actual}, index) =>
            ({name, distance, duration, arrival, banked, actual, delete: <Icon icon="delete" style={{cursor: "pointer"}} onClick={() => removeControl(index)}/>})),
        columns: [
            {name: "name", render: t('controls.name'), width: 40, editable: true},
            {name: "distance", editTransformFunction: transformDistance, editCompleteFunction: reverseTransformDistance,  valueTransformFunction: transformDistance, render: <div style={{color: '#0000EE', cursor:'pointer'}} onClick={sortOurStuffByDistance}>{metric ? t('controls.distanceKilometers') :t('controls.distanceMiles')}</div>, width: 40, editable: true, editValidateFunction: stringIsOnlyDecimal},
            {name: "duration", render: t('controls.duration'), valueTransformFunction: minSuffixFunction, width: 80, editable: true, editValidateFunction: stringIsOnlyNumeric},
            {name: "arrival", render: t('controls.arrival'), width: 80, editable: false, cellStyle: rwgpsCellStyle, headerStyle: rwgpsCellStyle},
            {name: "delete", render: t('controls.delete'), width: 60}
        ]
    }
    const bankedColumn = {name: "banked", render: "Banked Time", valueTransformFunction: minSuffixFunction, width: 80}
    if (displayBanked) {
        tableData.columns.splice(tableData.columns.length - 1, 0, bankedColumn)
    }
    const actualArrivalTimeColumn = {
        name: "actual",
        render: "Actual Arrival Time",
        headerStyle: {backgroundColor: "rgba(234, 89, 41, 0.8)", color: "white"},
        width: 80,
        cellStyle: {backgroundColor: "rgba(234, 89, 41, 0.8)", color: "white"}
    }
    if (compare) {
        tableData.columns.splice(tableData.columns.length - 1, 0, actualArrivalTimeColumn)
    }

    return <Table data={tableData} onCellValueChanged={onCellValueChanged}/>
}