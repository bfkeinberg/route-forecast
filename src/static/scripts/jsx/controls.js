import {Button,ButtonGroup,ButtonToolbar,Glyphicon,Table,Panel} from 'react-bootstrap';
import React, { Component } from 'react';
import { Checkbox } from '@blueprintjs/core';

class ControlPoint extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const banked_time = (<td style={{'fontSize':'80%'}}><input
            value={this.props.fields['banked']} readOnly tabIndex='-1' type="text"/></td>);
        return (
            <tr>
                <td style={{'fontSize':'80%'}}><input type='text' value={this.props.fields['name']}
                           onChange={event => this.props.onChange(this.props.index,{
                               name: event.target.value,
                               distance: this.props.fields['distance'],
                               duration: this.props.fields['duration'],
                               arrival: this.props.fields['arrival']
                           })}/></td>
                <td style={{'fontSize':'80%'}}><input value={this.props.fields['distance']}
                           onChange={event => this.props.onChange(this.props.index,{name: this.props.fields['name'],
                                distance: event.target.value,
                                duration: this.props.fields['duration'],
                                arrival: this.props.fields['arrival']
                           })} onFocus={event => event.target.select()}
                           type="number"/></td>
                <td style={{'fontSize':'80%'}}><input value={this.props.fields['duration']}
                           onChange={event => this.props.onChange(this.props.index,{name: this.props.fields['name'],
                               distance: this.props.fields['distance'],
                               duration: event.target.value,
                               arrival: this.props.fields['arrival']
                           })} onFocus={event => event.target.select()}
                           type="number"/></td>
                <td style={{'fontSize':'80%'}}><input value={this.props.fields['arrival']} readOnly tabIndex='-1' type="text"/></td>
                {this.props.displayBanked?banked_time:null}
                <td><Button onClick={() => this.props.removeRow(this.props.index)} tabIndex="-1"><Glyphicon glyph="minus-sign"></Glyphicon></Button></td>
            </tr>
        );
    }
}

class ControlPoints extends React.Component {

    constructor(props) {
        super(props);
        this.addControl = this.addControl.bind(this);
        this.updateRow = this.updateRow.bind(this);
        this.removeRow = this.removeRow.bind(this);
        this.toggleDisplayBanked = this.toggleDisplayBanked.bind(this);
        this.state = {
            displayBankedTime : false
        }
    }

    addControl( ) {
        let controlPoints = this.props.controlPoints;
        let key = controlPoints.length;
        controlPoints.push({name:'',distance:0,duration:0,arrival:"00:00"});
        this.props.updateControls(controlPoints);
    }

    removeRow(key) {
        let controlPoints = this.props.controlPoints;
        controlPoints.splice(key,1);
        this.props.updateControls(controlPoints);
    }

    updateRow(key,value) {
        let controlPoints = this.props.controlPoints;
        controlPoints[key] = value;
        this.props.updateControls(controlPoints);
    }

    toggleDisplayBanked(event) {
        this.setState({displayBankedTime:!this.state.displayBankedTime});
    }

    render () {
        const title = this.props.name == '' ?
            ( <h3 style={{textAlign:"center"}}>Control point list</h3> ) :
            ( <h3 style={{textAlign:"center"}}>Control point list for <i>{this.props.name}</i></h3> );
        const rusa_banked_header = (<th  style={{'fontSize':'80%'}}>Banked time</th>);

        return (
                <div className="controlPoints">
                        <h2 style={{textAlign:"center"}}>Checkpoint times</h2>
                    <ButtonToolbar>
                        <ButtonGroup>
                            <Button onClick={this.addControl}><Glyphicon glyph="plus-sign"></Glyphicon>Add control point</Button>
                        </ButtonGroup>
                        <Checkbox checked={this.state.displayBankedTime} onChange={this.toggleDisplayBanked}
                                  label="Display banked time" className="pt-inline"/>
                    </ButtonToolbar>
                    <Panel header={title} bsStyle="info">
                        <Table striped condensed hover fill>
                            <thead>
                            <tr>
                                <th  style={{'fontSize':'80%'}}>Name</th>
                                <th  style={{'fontSize':'80%'}}>Distance</th>
                                <th  style={{'fontSize':'80%'}}>Expected time spent</th>
                                <th  style={{'fontSize':'80%'}}>Est. arrival time</th>
                                {this.state.displayBankedTime?rusa_banked_header:null}
                            </tr>
                            </thead>
                            <tbody>
                                {this.props.controlPoints.map((row, key) =>
                                    <ControlPoint key={key} index={key} onChange={this.updateRow} removeRow={this.removeRow}
                                                  displayBanked={this.state.displayBankedTime} fields={row}/>)}
                            </tbody>
                        </Table>
                    </Panel>
                </div>
        );
    }
}

module.exports=ControlPoints;
export default ControlPoint;