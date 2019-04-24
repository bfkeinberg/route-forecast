import React, {Component} from 'react';
import {Button} from '@blueprintjs/core';
import {AgGridReact} from 'ag-grid-react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {updateUserControls} from './actions/actions';

const smallScreenWidth = 800;
const deleteColumnWidth = 39;

class DeleteRenderer extends Component {
    static propTypes = {
        context: PropTypes.object.isRequired,
        node: PropTypes.object.isRequired
    };

    constructor(props) {
        super(props);
    }

    invokeDelete = () => {this.props.context.componentParent.removeRow(this.props.node.id)};

    render() {
        return (<Button onClick={this.invokeDelete} class={'pt-minimal'} icon={'delete'}/>);
    }
}

export class ControlTable extends Component {
    static propTypes = {
        displayBanked:PropTypes.bool.isRequired,
        compare:PropTypes.bool.isRequired,
        controls:PropTypes.arrayOf(PropTypes.object).isRequired,
        calculatedValues:PropTypes.arrayOf(PropTypes.object).isRequired,
        updateControls:PropTypes.func.isRequired,
        count:PropTypes.number.isRequired,
        metric:PropTypes.bool.isRequired
    };

    constructor(props) {
        super(props);
        let displayBanked = this.props.displayBanked;
        this.state = {
            context: { componentParent: this },
            frameworkComponents: { deleteRenderer: DeleteRenderer },
            columnDefs:[
                {field:'distance', headerTooltip:`In ${props.metric?'km':'miles'}`,
                    type:'numericColumn', unSortIcon:true, sortable:true, resizable:true, editable:true, valueParser:ControlTable.setData, valueSetter:ControlTable.validateData, headerName:`${props.metric?'Kilometers':'Miles'}`},
                {field:'duration', headerTooltip:'How many minutes you expect to spend at this control',
                    sortable:false, type:'numericColumn', resizable:true, editable:true, valueParser:params=>{return Number(params.newValue)},
                    valueSetter:ControlTable.validateData, valueFormatter:ControlTable.appendUnit, headerName:'Expected time spent'},
                {field:'arrival', headerTooltip:'When you are predicted to arrive here',
                    cellRenderer:"agAnimateShowChangeCellRenderer", type:'numericColumn',
                    suppressNavigable:true, sortable:false, resizable:true, enableCellChangeFlash:true, headerName:'Est. arrival time'},
                {colId:'actual', field:'actual', sortable:false, resizable:true, enableCellChangeFlash:true, cellRenderer:"agAnimateShowChangeCellRenderer",
                    headerTooltip:'When you actually arrived here', suppressNavigable:true, hide:!this.props.compare, headerName:'Actual arrival time'},
                {colId:'banked', field:'banked', headerTooltip:'Time remaining at brevet pace',
                    cellRenderer:"agAnimateShowChangeCellRenderer",
                    suppressNavigable:true, sortable:false, resizable:true, type:'numericColumn', valueFormatter:ControlTable.appendUnit, hide:!displayBanked, headerName:'Banked time'},
                {colId:'delete', suppressNavigable:true, suppressSizeToFit: true,
                    pinned:'right', cellRenderer:'deleteRenderer'}
            ]};
        // no name field on mobile
        this.desktop = window.matchMedia("(min-width: 800px)").matches;
        if (this.desktop) {
            this.state.columnDefs.unshift({colId:'name', field:'name', sortable:false, resizable:true, editable:true, menuTabs:[
                    'generalMenuTab',
                    'columnsMenuTab'
                ], headerName:'Name'});
        } else {
            this.state.columnDefs[1].headerName = 'Elapsed';
            this.state.columnDefs[2].headerName = 'Arrival';
        }
    }

    onGridReady = (params) => {
        this.api = params.api;
        this.columnApi = params.columnApi;
        if (this.props.count === 1) {
            this.addRow();
        }
        if (window.outerWidth < smallScreenWidth) {
            this.columnApi.autoSizeAllColumns();
            this.api.sizeColumnsToFit();
        }
    };

    addRow = () => {
        if (this.api===undefined) {
            return;
        }
        if (this.desktop) {
            let row = {name:'',duration:'',distance:'',id:this.props.controls.length};
            this.api.updateRowData({add:[row], addIndex:row.id});
        } else {
            let row = {duration:'',distance:'',id:this.props.controls.length};
            this.api.updateRowData({add:[row], addIndex:row.id});
        }
        this.updateFromGrid();
    };

    removeRow = (row) => {
        let rowNode = this.api.getRowNode(row);
        if (rowNode === undefined) {
            return;
        }
        let transaction = {remove:[rowNode]};
        this.api.updateRowData(transaction);
        this.updateFromGrid();
    };

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
    deleteRenderer = (params) => {
        const deleteButton = <Button onClick={() => {this.removeRow(params.node.id)}} class={'pt-minimal'} icon={'delete'}/>;
        let eDiv = document.createElement('div');
        ReactDOM.render(deleteButton, eDiv);
        return eDiv;
    };

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

    UNSAFE_componentWillReceiveProps(newProps) {
        if (this.api===undefined || newProps===undefined) {
            return;
        }
        this.columnApi.setColumnVisible('banked',newProps.displayBanked);
        this.columnApi.setColumnVisible('actual',newProps.compare);

        let col = this.columnApi.getColumn("distance");
        let colDef = col.getColDef();
        colDef.headerTooltip = `In ${newProps.metric?'km':'miles'}`;
        colDef.headerName = `${newProps.metric?'Kilometers':'Miles'}`;

        // the column is now updated. to reflect the header change, get the grid refresh the header
        this.api.refreshHeader();

        if (newProps.count > newProps.controls.length) {
            this.addRow();
        }
        let rowData = [];
        newProps.controls.forEach((item,index) => rowData.push({...item, ...newProps.calculatedValues[index], id:index}));
        this.api.setRowData(rowData);
        if (newProps.displayBanked !== this.props.displayBanked || newProps.compare !== this.props.compare) {
            this.columnApi.autoSizeAllColumns();
            // this.api.sizeColumnsToFit();
        }
    }

    componentDidUpdate() {
        if (this.api !== undefined/* && window.outerWidth < smallScreenWidth*/) {
            // this.api.sizeColumnsToFit();
            this.columnApi.autoSizeAllColumns();
        }
        if (this.columnApi !== undefined) {
            this.columnApi.setColumnWidth(this.columnApi.getColumn('delete'),deleteColumnWidth);
        }
        // focus on new control if one has been added
        if (this.desktop) {
            if (this.api !== undefined && this.props.controls.length > 0 && this.props.controls[this.props.controls.length-1].name==='') {
                this.api.setFocusedCell(this.props.controls.length-1,'name');
                this.api.startEditingCell({colKey:'name',rowIndex:this.props.controls.length-1});
            }
        } else {
            if (this.api !== undefined && this.props.controls.length > 0 && this.props.controls[this.props.controls.length-1].distance==='') {
                this.api.setFocusedCell(this.props.controls.length-1,'distance');
                this.api.startEditingCell({colKey:'distance',rowIndex:this.props.controls.length-1});
            }
        }
    }

    static setData(params) {
        return Number(params.newValue);
    }

    cellUpdated = (params) => {
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
        if (ControlTable.isValidRow(rowData, this.desktop)) {
            // update
            this.updateFromGrid();
        }
    };

    static isValidRow(rowData, isDesktop) {
        return ((isDesktop ? rowData.name!==undefined : true) && rowData.distance!==undefined && rowData.duration!==undefined &&
            rowData.name!=="" && rowData.distance!=="" && rowData.duration!=="");
    }

    sortChanged = () => {
        this.setState({rowCount:this.api.getModel().getRowCount()});
        this.updateFromGrid();
    };

    updateFromGrid = () => {
        let modifiedControls = [];
        this.api.forEachNodeAfterFilterAndSort(node => {
            const userValues = (({ name, distance, duration, id }) => ({ name, distance, duration, id }))(node.data);
            modifiedControls.push(userValues)});
        this.props.updateControls(modifiedControls);
    };

    render() {
        let rowData = [];
        let newColDefs = this.state.columnDefs.slice();
        this.props.controls.forEach((item,index) => rowData.push({...item, ...this.props.calculatedValues[index], id:index}));
        return (<div id={'controlTable'} className="ag-theme-fresh">
            <AgGridReact enableCellChangeFlash={true} animateRows
                         sortingOrder={['asc']} unSortIcon rowData={rowData}
                         context={this.state.context} frameworkComponents={this.state.frameworkComponents}
             onGridReady={this.onGridReady} onSortChanged={this.sortChanged} singleClickEdit editType={'fullRow'}
            onCellValueChanged={this.cellUpdated} tabToNextCell={ControlTable.tabHandler} getRowNodeId={data => data.id}
            columnDefs={newColDefs}/>
        </div>);
    }
}

const mapStateToProps = (state) =>
    ({
        displayBanked: state.controls.displayBanked,
        compare: state.controls.stravaAnalysis,
        metric: state.controls.metric,
        count: state.controls.count,
        controls: state.controls.userControlPoints,
        calculatedValues: state.controls.calculatedControlValues
    });

const mapDispatchToProps = {
    updateControls : updateUserControls
};

export default connect(mapStateToProps, mapDispatchToProps)(ControlTable);
