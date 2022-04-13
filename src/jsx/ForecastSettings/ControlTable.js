import React from 'react';
import { Icon } from '@blueprintjs/core';
import { useSelector, useDispatch } from 'react-redux';
import { removeControl as removeControlAction, updateUserControls } from '../../redux/actions';
import { Table } from "./Table"
import { useActualArrivalTimes, useForecastDependentValues } from '../../utils/hooks';
import { stringIsOnlyNumeric, stringIsOnlyDecimal } from '../../utils/util';

const minSuffixFunction = value => `${value} min`

export const ControlTable = () => {

    //     // no name field on mobile
    //     this.desktop = window.matchMedia("(min-width: 800px)").matches;
    //     if (this.desktop) {
    //         this.state.columnDefs.unshift({colId:'name', field:'name', sortable:false, resizable:true, editable:true, menuTabs:[
    //                 'generalMenuTab',
    //                 'columnsMenuTab'
    //             ], headerName:'Name'});
    //     } else {
    //         this.state.columnDefs[1].headerName = 'Elapsed';
    //         this.state.columnDefs[2].headerName = 'Arrival';
    //     }
    // }

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
        updateControls(controls.map((control, index) => (index === rowIndex ? {...control, [field]: value} : control)))
    }

    const controlsData = controls.map((control, index) => {
        const controlObject = {...control}
        if (calculatedValues !== null) {
            Object.assign(controlObject, calculatedValues[index])
        }
        if (actualArrivalTimes !== null) {
            controlObject.actual = actualArrivalTimes[index].time
        }
        return controlObject
    })

    const rwgpsCellStyle = calculatedValues !== null ? {backgroundColor: "rgb(19, 124, 189)", color: "white"} : {}

    const tableData = {
        rows: controlsData.map(({name, distance, duration, arrival, banked, actual}, index) =>
            ({name, distance, duration, arrival, banked, actual, delete: <Icon icon="delete" style={{cursor: "pointer"}} onClick={() => removeControl(index)}/>})),
        columns: [
            {name: "name", render: "Name", width: 40, editable: true},
            {name: "distance", render: metric ? "Kilometers" : "Miles", width: 40, editable: true, editValidateFunction: stringIsOnlyDecimal},
            {name: "duration", render: "Expected Time Spent", valueTransformFunction: minSuffixFunction, width: 80, editable: true, editValidateFunction: stringIsOnlyNumeric},
            {name: "arrival", render: "Estimated Arrival Time", width: 80, editable: false, cellStyle: rwgpsCellStyle, headerStyle: rwgpsCellStyle},
            {name: "delete", render: "Delete", width: 60}
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