import React from 'react';
import { Icon } from '@blueprintjs/core';
import { useSelector } from 'react-redux';
import { updateUserControls } from '../../redux/actions';
import { routeLoadingModes } from '../../data/enums';
import { Table } from "./Table"
import { useDispatch } from 'react-redux';
import { useActualArrivalTimes } from '../../utils/hooks';

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
    const compare = useSelector(state => state.uiInfo.routeParams.routeLoadingMode === routeLoadingModes.STRAVA)
    const metric = useSelector(state => state.controls.metric)
    const controls = useSelector(state => state.controls.userControlPoints)
    const calculatedValues = useSelector(state => state.controls.calculatedControlValues)

    const actualArrivalTimes = useActualArrivalTimes()

    const dispatch = useDispatch()
    const updateControls = controls => dispatch(updateUserControls(controls))
    const removeControl = indexToRemove => dispatch(updateUserControls(controls.filter((control, index) => index !== indexToRemove)))

    const onCellValueChanged = (rowIndex, field, value) => {
        updateControls(controls.map((control, index) => index === rowIndex ? {...control, [field]: value} : control))
    }

    const controlsData = controls.map((control, index) => {
        const controlObject = {...control, ...calculatedValues[index]}
        if (actualArrivalTimes !== null) {
            controlObject.actual = actualArrivalTimes[index].time
        }
        return controlObject
    })

    const tableData = {
        rows: controlsData.map(({name, distance, duration, arrival, banked, actual}, index) =>
            ({name, distance, duration, arrival, banked, actual, delete: <Icon icon="delete" style={{cursor: "pointer"}} onClick={() => removeControl(index)}/>})),
        columns: [
            {name: "name", render: "Name", width: 40, editable: true},
            {name: "distance", render: metric ? "Kilometers" : "Miles", width: 40, editable: true},
            {name: "duration", render: "Expected Time Spent", valueTransformFunction: minSuffixFunction, width: 80, editable: true},
            {name: "arrival", render: "Estimated Arrival Time", width: 80},
            {name: "delete", render: "Delete", width: 60}
        ]
    }
    const bankedColumn = {name: "banked", render: "Banked Time", valueTransformFunction: minSuffixFunction, width: 80}
    if (displayBanked) {
        tableData.columns.splice(4, 0, bankedColumn)
    }
    const actualArrivalTimeColumn = { name: "actual", render: "Actual Arrival Time", width: 80 }
    if (compare) {
        tableData.columns.splice(5, 0, actualArrivalTimeColumn)
    }

    return <Table data={tableData} onCellValueChanged={onCellValueChanged}/>
}