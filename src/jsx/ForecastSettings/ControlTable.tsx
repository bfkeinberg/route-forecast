import { controlRemoved } from '../../redux/controlsSlice';
import { updateUserControls } from '../../redux/actions';
import { useActualArrivalTimes, useForecastDependentValues } from '../../utils/hooks';
import { milesToMeters,stringIsOnlyDecimal, stringIsOnlyNumeric } from '../../utils/util';
import { Table } from "./Table"
import {useTranslation} from 'react-i18next'
import { useAppSelector, useAppDispatch } from '../../utils/hooks';
const minSuffixFunction = (value : string) => `${value} min`
import type { UserControl } from '../../redux/controlsSlice';
import {IconCircleX } from '@tabler/icons-react';
import { CloseButton } from '@mantine/core';

export const ControlTable = () => {
    const { t } = useTranslation()

    const displayBanked = useAppSelector(state => state.controls.displayBanked)
    const stravaActivityData = useAppSelector(state => state.strava.activityData)
    const compare = stravaActivityData !== null
    const metric = useAppSelector(state => state.controls.metric)
    const controls = useAppSelector(state => state.controls.userControlPoints)
    const businessesAreOpen = useAppSelector(state => state.controls.controlOpenStatus)

    const { calculatedControlPointValues: calculatedValues } = useForecastDependentValues()

    const actualArrivalTimes = useActualArrivalTimes()
    const dispatch = useAppDispatch()
    const updateControls = (controls : UserControl[]) => dispatch(updateUserControls(controls))
    const removeControl = (indexToRemove : number) => dispatch(controlRemoved(indexToRemove))

    const onCellValueChanged = (rowIndex : number, field : string, value : (string | number)) => {
        if (field === "duration") {
            value = Number(value)
            // do not allow bogus duration values to be entered
            if (Number.isNaN(value)) {
                value = 0
            }
        }
        updateControls(controls.map((control, index) => (index === rowIndex ? {...control, [field]: value} : control)))
    }

    const controlsData = controls.map((control, index) => {
        const controlObject = { ...control }
        if (calculatedValues !== null && calculatedValues[index] && controlObject.distance === calculatedValues[index].distance) {
            Object.assign(controlObject, calculatedValues[index])
        }
        if (actualArrivalTimes !== null && actualArrivalTimes[index] !== undefined) {
            controlObject.actual = actualArrivalTimes[index].time
        }
        if (businessesAreOpen !== null && businessesAreOpen.length) {
            const found = businessesAreOpen.find(business => business.distance === controlObject.distance)
            if (found) {
                controlObject.isOpen = found.isOpen
            }
        }
        return controlObject
    })

    const sortOurStuffByDistance = () => {
        const sortedControls = Array.from(controls);
        sortedControls.sort((control1, control2) => control1.distance - control2.distance);
        updateControls(sortedControls.map((value, index) => {return {id:index, ...value}}));
    }

    const rwgpsCellStyle = calculatedValues !== null ? {backgroundColor: "rgb(19, 124, 189)", color: "white"} : {}

    const transformDistance = (distanceValue : string) : string => {
        const distance = Number(distanceValue)
        return metric ? ((distance * milesToMeters) / 1000).toFixed(1) : distance.toString();
    };

    const reverseTransformDistance = (distanceValue : string) => {
        const distance = Number(distanceValue)
        return metric ? ((distance * 1000) / milesToMeters).toFixed(1) : distance.toString();
    }

    interface ColumnData {
        name:string,
        render: React.JSX.Element | string,
        width: number,
        editable? : boolean,
        editCompleteFunction? : (value: string) => string,
        editTransformFunction? : (value: string) => string,
        valueTransformFunction? : (value: string) => string,
        editValidateFunction? : (value: string) => boolean,
        cellStyle? : React.JSX.Element | {},
        headerStyle? : {}
    }
    interface TableData { 
        rows: UserControl[],
        columns : ColumnData[]
    }

    const tableData : TableData= {
        rows: controlsData.map(({name, distance, duration, arrival, banked, actual, isOpen}, index) =>
            ({name, distance, duration, arrival, banked, actual, 
                style:(isOpen===false)?{backgroundColor:"rgba(212, 16, 16, 0.315)", borderColor:"rgba(240, 10, 129, 0.86)"}:null, 
                delete: <CloseButton icon={<IconCircleX/>} style={{cursor: "pointer"}} onClick={() => removeControl(index)}/>})),
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