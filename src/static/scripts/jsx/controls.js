import {Button,ButtonGroup,ButtonToolbar,Glyphicon,Table,Panel,InputGroup} from 'react-bootstrap';
import {Checkbox} from 'react-bootstrap';
import React, { Component } from 'react';

class ControlPoint extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const banked_time = (<td>
            <InputGroup>
            <input style={{'fontSize':'90%','width':'100%','padding':'2px 4px 1px'}}
            value={this.props.fields['banked']} readOnly tabIndex='-1' type="text"/>
                <InputGroup.Addon>min</InputGroup.Addon>
            </InputGroup>
        </td>);
        return (
            <tr>
                <td><input style={{'fontSize':'90%','width':'100%','padding':'2px 4px 1px'}}
                            type='text' value={this.props.fields['name']}
                              onChange={event => this.props.onChange(this.props.index,{
                               name: event.target.value,
                               distance: this.props.fields['distance'],
                               duration: this.props.fields['duration'],
                               arrival: this.props.fields['arrival']
                           })}/></td>
                <td><input  style={{'fontSize':'90%','width':'100%','padding':'2px 4px 1px'}}
                            value={this.props.fields['distance']}
                             onChange={event => this.props.onChange(this.props.index,{name: this.props.fields['name'],
                                distance: event.target.value,
                                duration: this.props.fields['duration'],
                                arrival: this.props.fields['arrival']
                           })} onFocus={event => event.target.select()}
                           type="number"/></td>
                <td>
                    <InputGroup>
                    <input style={{'fontSize':'90%','width':'100%','padding':'2px 4px 1px'}}
                            value={this.props.fields['duration']}
                           onBlur={event => this.props.onChange(this.props.index,{name: this.props.fields['name'],
                               distance: this.props.fields['distance'],
                               duration: event.target.value,
                               arrival: this.props.fields['arrival']
                           })} onFocus={event => event.target.select()}
                           type="number"/>
                        <InputGroup.Addon>min</InputGroup.Addon>
                    </InputGroup>
                </td>
                <td><input style={{'fontSize':'90%','width':'100%','padding':'2px 4px 1px 0px'}}
                            value={this.props.fields['arrival']} readOnly tabIndex='-1' type="text"/></td>
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
        const rusa_banked_header = (<th style={{'fontSize':'80%','width':'16%'}}>Banked time</th>);
        return (

            <div className="controlPoints">
                <ButtonToolbar style={{padding:'12px'}}>
                <ButtonGroup>
                    <Button onClick={this.addControl}><Glyphicon glyph="plus-sign"></Glyphicon>Add control point</Button>
                     <Checkbox checked={this.state.displayBankedTime} inline
                     inputRef={ref => { this.input = ref; }}
                       onChange={this.toggleDisplayBanked}
                     onClick={this.toggleDisplayBanked}
                     style={{padding:'7px 25px 0px','textAlign':'center',
                     margin:'8x 0px 0px 29px',width:'190px'}}>Display banked time</Checkbox>
                </ButtonGroup>
                </ButtonToolbar>
                <Panel header={title} bsStyle="info">
                    <Table condensed bordered striped hover fill>
                        <thead>
                        <tr>
                            <th style={{'fontSize':'80%','width':'22%'}}>Name</th>
                            <th style={{'fontSize':'80%','width':'11%'}}>Distance</th>
                            <th style={{'fontSize':'80%','width':'18%'}}>Expected time spent</th>
                            <th style={{'fontSize':'80%','width':'26%'}}>Est. arrival time</th>
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