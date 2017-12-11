import {Button,ButtonGroup,ButtonToolbar,Glyphicon} from 'react-bootstrap';
import {Checkbox,FormGroup,ControlLabel,FormControl} from 'react-bootstrap';
import React from 'react';
// import MediaQuery from 'react-responsive';
import ControlTable from './controlTable';


class ControlPoints extends React.Component {

    constructor(props) {
        super(props);
        this.addControl = this.addControl.bind(this);
        this.updateFromTable = this.updateFromTable.bind(this);
        this.toggleDisplayBanked = this.toggleDisplayBanked.bind(this);
        this.toggleMetric = this.toggleMetric.bind(this);
        this.toggleCompare = this.toggleCompare.bind(this);
        this.state = {
            displayBankedTime : false, metric:this.props.metric, lookback:false
        };
    }

    addControl( ) {
        this.table.addRow();
    }

    toggleDisplayBanked(event) {
        this.setState({displayBankedTime:!this.state.displayBankedTime});
    }

    toggleMetric(event) {
        let metric = !this.state.metric;
        this.setState({metric:metric});
        this.props.updateControls(this.props.controlPoints,metric);
    }

    toggleCompare(event) {
        let lookback = !this.state.lookback;
        this.setState({lookback:lookback});
    }

    updateFromTable(controlPoints) {
        this.props.updateControls(controlPoints,this.state.metric);
    }

    doControlsMatch(newControl,oldControl) {
        return newControl.distance===oldControl.distance &&
            newControl.name===oldControl.name &&
            newControl.duration===oldControl.duration &&
            newControl.arrival===oldControl.arrival &&
            newControl.banked===oldControl.banked;
    }

    shouldComponentUpdate(nextProps,newState) {
        let controlPoints = this.props.controlPoints;
        if (newState.displayBankedTime !== this.state.displayBankedTime ||
                newState.lookback != this.state.lookback ||
                !nextProps.controlPoints.every((v, i)=> this.doControlsMatch(v,controlPoints[i])) ||
                newState.metric !== this.state.metric
        ) {
            return true;
        }
        return false;
    }

    render () {
        const title = this.props.name == '' ?
            ( <h3 style={{textAlign:"center"}}>Control point list</h3> ) :
            ( <h3 style={{textAlign:"center"}}>Control point list for <i>{this.props.name}</i></h3> );
        const rusa_banked_header = (<th style={{'fontSize':'80%','width':'17%'}}>Banked time</th>);
        return (
            <div className="controlPoints">
                <ButtonToolbar style={{display:'inline-flex',flexDirection:'row', paddingTop:'11px',paddingLeft:'4px'}}>
                {/*<ButtonGroup style={{display:'flex',flexFlow:'row wrap'}}>*/}
                <ButtonGroup>
                    <Button tabIndex='10' onClick={this.addControl} id='addButton'><Glyphicon glyph="plus-sign"></Glyphicon>Add control point</Button>
                    {/*<Button onClick={this.addControl} id='addButton' style={{display:'inline-flex',width:'165px',height:'34px'}}><Glyphicon glyph="plus-sign"></Glyphicon>Add control point</Button>*/}
                    <FormGroup controlId="finishTime" style={{display:'inline-flex'}}>
                        <ControlLabel style={{width:'7em',display:'inline-flex',marginTop:'7px',paddingLeft:'8px'}}>Finish time</ControlLabel>
                        <FormControl tabIndex='-1' type="text" style={{display:'inline-flex',width:'12em',marginTop:'3px',marginBotton:'0px',paddingLeft:'2px',paddingTop:'2px',height:'28px'}}
                                     value={this.props.finishTime}/>
                    </FormGroup>
                    <Checkbox tabIndex='12' checked={this.state.metric} inline
                              onClick={this.toggleMetric} onChange={this.toggleMetric}
                              style={{padding:'0px 0px 0px 26px',display:'inline-flex'}}>metric</Checkbox>
                    <Checkbox tabIndex='11' checked={this.state.displayBankedTime} inline
                              onChange={this.toggleDisplayBanked} onClick={this.toggleDisplayBanked}
                              style={{padding:'0px 0px 0px 24px', display:'inline-flex'}}>Display banked time</Checkbox>
                    <Checkbox tabIndex="13" checked={this.state.lookback} inline onClick={this.toggleCompare} style={{display:'inline-flex'}}>Compare</Checkbox>
                </ButtonGroup>
                </ButtonToolbar>
                <ControlTable rows={this.props.controlPoints.length} controls={this.props.controlPoints}
                              displayBanked={this.state.displayBankedTime} compare={this.state.lookback} update={this.updateFromTable} ref={(table) => {this.table = table;}}/>
            </div>
        );
    }
}

export default ControlPoints;