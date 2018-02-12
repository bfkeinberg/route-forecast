import React, {Component} from 'react';
import {Button} from '@blueprintjs/core';

import {AgGridReact} from 'ag-grid-react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {updateUserControls} from './actions/actions';

const smallScreenWidth = 800;
const deleteColumnWidth = 39;

class ControlTable extends Component {
    static propTypes = {
        displayBanked:PropTypes.bool.isRequired,
        compare:PropTypes.bool.isRequired,
        controls:PropTypes.arrayOf(PropTypes.object).isRequired,
        calculatedValues:PropTypes.arrayOf(PropTypes.object).isRequired,
        updateControls:PropTypes.func.isRequired,
        count:PropTypes.number.isRequired
    };

    constructor(props) {
        super(props);
        let displayBanked = this.props.displayBanked;
        this.deleteRenderer = this.deleteRenderer.bind(this);
        this.removeRow = this.removeRow.bind(this);
        this.state = {
            columnDefs:[
                {colId:'name', field:'name', unSortIcon:true, suppressSorting:true, editable:true, headerName:'Name'},
                {field:'distance', headerTooltip:'In miles or km, depending on the metric checkbox',
                    type:'numericColumn', unSortIcon:true, editable:true, valueParser:ControlTable.setData, valueSetter:ControlTable.validateData, headerName:'Distance'},
                {field:'duration', headerTooltip:'How many minutes you expect to spend at this control',
                    suppressSorting:true, type:'numericColumn', editable:true, valueParser:params=>{return Number(params.newValue)},
                    valueSetter:ControlTable.validateData, valueFormatter:ControlTable.appendUnit, headerName:'Expected time spent'},
                {field:'arrival', headerTooltip:'When you are predicted to arrive here',
                    cellRenderer:"agAnimateShowChangeCellRenderer", type:'numericColumn',
                    suppressNavigable:true, suppressSorting:true, enableCellChangeFlash:true, headerName:'Est. arrival time'},
                {colId:'actual', field:'actual', suppressSorting:true, enableCellChangeFlash:true, cellRenderer:"agAnimateShowChangeCellRenderer",
                    headerTooltip:'When you actually arrived here', suppressNavigable:true, hide:!this.props.compare, headerName:'Actual arrival time'},
                {colId:'banked', field:'banked', headerTooltip:'Time remaining at brevet pace',
                    cellRenderer:"agAnimateShowChangeCellRenderer",
                    suppressNavigable:true, suppressSorting:true, type:'numericColumn', valueFormatter:ControlTable.appendUnit, hide:!displayBanked, headerName:'Banked time'},
                {colId:'delete', suppressNavigable:true, suppressSorting:true, cellRenderer:this.deleteRenderer}
            ]};
        this.addRow = this.addRow.bind(this);
        this.onGridReady = this.onGridReady.bind(this);
        this.cellUpdated = this.cellUpdated.bind(this);
        this.sortChanged = this.sortChanged.bind(this);
        this.updateFromGrid = this.updateFromGrid.bind(this);
    }

    onGridReady(params) {
        this.api = params.api;
        this.columnApi = params.columnApi;
        if (window.outerWidth < smallScreenWidth) {
            this.api.sizeColumnsToFit();
        }
    }

    addRow() {
        if (this.api===undefined) {
            return;
        }
        let row = {name:'',duration:'',distance:'',id:this.props.controls.length};
        this.api.updateRowData({add:[row], addIndex:row.id});
        // focus on new control if one has been added
        this.api.setFocusedCell(this.props.controls.length,'name',null);
        // this.api.startEditingCell(this.api.getFocusedCell());
        this.updateFromGrid();
    }

    removeRow(row) {
        let rowNode = this.api.getRowNode(row);
        if (rowNode === undefined) {
            return;
        }
        let transaction = {remove:[rowNode]};
        this.api.updateRowData(transaction);
        this.updateFromGrid();
    }

    static appendUnit(cell) {
        return cell.value + ' min';
    }

    static validateData(params) {
        if (Number.isNaN(parseInt(params.newValue,10)) && params.oldValue!==params.newValue) {
            return false;
        }
        else {
            params.data[params.colDef.field] = params.newValue;
            return true;
        }
    }

    // create a DOM object
    deleteRenderer(params) {
        const deleteButton = <Button onClick={() => {this.removeRow(params.node.id)}} iconName={'delete'}/>;
        let eDiv = document.createElement('div');
        ReactDOM.render(deleteButton, eDiv);
        return eDiv;
    }

    static tabHandler(params) {
        let nextCell = params.nextCellDef;
        if (params.backwards) {
            return nextCell;
        } else {
            if (nextCell.column.colId==='arrival') {
                let col = nextCell.column.columnApi.getColumn('name');
                let renderedRowCount = nextCell.column.gridApi.getModel().getRowCount();
                let nextRowIndex = nextCell.rowIndex + 1;
                if (nextRowIndex >= renderedRowCount) {
                    nextRowIndex = 0;
                }
                return {rowIndex:nextRowIndex, column:col};
            } else {
                return params.nextCellDef;
            }
        }
    }

    componentWillReceiveProps(newProps) {
        if (this.api===undefined || newProps===undefined) {
            return;
        }
        this.columnApi.setColumnVisible('banked',newProps.displayBanked);
        this.columnApi.setColumnVisible('actual',newProps.compare);
        if (newProps.count > newProps.controls.length) {
            this.addRow();
        }
        let rowData = [];
        newProps.controls.forEach((item,index) => rowData.push({...item, ...newProps.calculatedValues[index], id:index}));
        this.api.setRowData(rowData);
    }

    static setData(params) {
        return Number(params.newValue);
    }

    cellUpdated(params) {
        if (params.colDef.field==="name") {
            if (params.newValue===params.oldValue) {
                return;
            }
        } else {
            if (params.newValue===Number(params.oldValue)) {
                return;
            }
        }
        let rowData = params.node.data;
        if (ControlTable.isValidRow(rowData)) {
            // update
            this.updateFromGrid();
        }
    }

    static isValidRow(rowData) {
        return (rowData.name!==undefined && rowData.distance!==undefined && rowData.duration!==undefined &&
            rowData.name!=="" && rowData.distance!=="" && rowData.duration!=="");
    }

    sortChanged() {
        this.setState({rowCount:this.api.getModel().getRowCount()});
        this.updateFromGrid();
    }

    updateFromGrid() {
        let modifiedControls = [];
        this.api.forEachNodeAfterFilterAndSort(node => {
            const userValues = (({ name, distance, duration, id }) => ({ name, distance, duration, id }))(node.data);
            modifiedControls.push(userValues)});
        this.props.updateControls(modifiedControls);
    }

    render() {
        if (this.api !== undefined && window.outerWidth < smallScreenWidth) {
            this.api.sizeColumnsToFit();
        }
        if (this.columnApi !== undefined) {
            this.columnApi.setColumnWidth(this.columnApi.getColumn('delete'),deleteColumnWidth);
        }
        let rowData = [];
        this.props.controls.forEach((item,index) => rowData.push({...item, ...this.props.calculatedValues[index], id:index}));
        return (<div className="ag-theme-fresh">
            <AgGridReact enableColResize enableSorting animateRows sortingOrder={['asc']} unSortIcon rowData={rowData}
             onGridReady={this.onGridReady} onSortChanged={this.sortChanged} singleClickEdit
            onCellValueChanged={this.cellUpdated} tabToNextCell={ControlTable.tabHandler} getRowNodeId={data => data.id}
            columnDefs={this.state.columnDefs}/>
        </div>);
    }
}

const mapStateToProps = (state) =>
    ({
        displayBanked: state.controls.displayBanked,
        compare: state.controls.stravaAnalysis,
        count: state.controls.count,
        controls: state.controls.userControlPoints,
        calculatedValues: state.controls.calculatedControlValues
    });

const mapDispatchToProps = {
    updateControls : updateUserControls
};

export default connect(mapStateToProps, mapDispatchToProps)(ControlTable);
