import {Button,ButtonGroup,ButtonToolbar,Glyphicon,Table,Panel,InputGroup} from 'react-bootstrap';
import {Checkbox,FormGroup,ControlLabel,FormControl} from 'react-bootstrap';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
let MediaQuery = require('react-responsive');

class ControlPoint extends React.Component {

    constructor(props) {
        super(props);
        this.state = {fields:props.fields,index:props.index};
    }

    componentWillReceiveProps(newProps) {
        this.setState({fields:newProps.fields,index:newProps.index});
    }

    componentDidMount() {
        ReactDOM.findDOMNode(this.refs.nameField).focus();
    }

    computeTabIndex(index,offset) {
        let baseIndex = index*3 + 12;
        if (baseIndex > 94) {
            baseIndex -= 82;
        }
        return baseIndex+offset;
    }

    render() {
        const banked_time = (<td>
            <InputGroup>
            <input style={{'fontSize':'90%','width':'100%','padding':'2px 4px 1px'}}
            value={this.props.fields['banked']} readOnly tabIndex='-1' type="text"/>
                <MediaQuery minDeviceWidth={1000}>
                    <InputGroup.Addon>min</InputGroup.Addon>
                </MediaQuery>
            </InputGroup>
        </td>);
        return (
            <tr>
                <td><input tabIndex={this.computeTabIndex(this.props.index,0)}
                           style={{'fontSize':'90%','width':'100%','padding':'2px 4px 1px'}}
                            type='text' value={this.state.fields['name']}
                                ref="nameField"
                                onChange={event => this.setState({
                                  fields:
                                      {
                                          name: event.target.value,
                                          distance: this.state.fields['distance'],
                                          duration: this.state.fields['duration'],
                                          arrival: this.props.fields['arrival'],
                                          banked: this.props.fields['banked']
                                      }
                           })}
                           onBlur={event => this.props.onChange(this.state.index,this.state.fields)}
                           onFocus={event => event.target.select()}
                /></td>
                <td>
                    <InputGroup>
                    <input tabIndex={this.computeTabIndex(this.props.index,1)}
                           style={{'fontSize':'90%','width':'100%','padding':'2px 4px 1px'}}
                            value={this.state.fields['duration']}
                            onChange={(event) => this.setState({
                                fields:
                                    {
                                        name:this.state.fields['name'],
                                        distance:this.state.fields['distance'],
                                        duration:event.target.value,
                                        arrival:this.props.fields['arrival'],
                                        banked:this.props.fields['banked']
                                    }
                            })}
                           onBlur={event => this.props.onChange(this.state.index,this.state.fields)} onFocus={event => event.target.select()}
                           type="number"/>
                        <MediaQuery minDeviceWidth={1000}>
                            <InputGroup.Addon>min</InputGroup.Addon>
                        </MediaQuery>
                    </InputGroup>
                </td>
                <td><input tabIndex={this.computeTabIndex(this.props.index,2)}
                           style={{'fontSize':'90%','width':'100%','padding':'2px 4px 1px'}}
                            value={this.state.fields['distance']}
                            onChange={(event) => this.setState({
                                fields:
                                    {
                                        name:this.state.fields['name'],
                                        distance: event.target.value,
                                        duration: this.state.fields['duration'],
                                        arrival: this.props.fields['arrival'],
                                        banked: this.props.fields['banked']
                                    }
                            })}
                            onBlur={event => this.props.onChange(this.state.index,this.state.fields)}
                            onFocus={event => event.target.select()}
                            type="number"/>
                </td>
                <td><input style={{'fontSize':'90%','width':'100%','padding':'2px 4px 1px 0px'}}
                            value={this.props.fields['arrival']} readOnly tabIndex='-1' type="text"/></td>
                {this.props.displayBanked?banked_time:null}
                <td><Button onClick={() => this.props.removeRow(this.props.index)} style={{width:'90%'}} tabIndex="-1"><Glyphicon glyph="minus-sign"></Glyphicon></Button></td>
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
            displayBankedTime : false, controlsChanged:false
        }
    }

    addControl( ) {
        let controlPoints = this.props.controlPoints;
        let key = controlPoints.length;
        controlPoints.push({name:'',distance:0,duration:0,arrival:"00:00"});
        this.props.updateControls(controlPoints);
        this.setState({controlsChanged:true});
    }

    removeRow(key) {
        let controlPoints = this.props.controlPoints;
        controlPoints.splice(key,1);
        this.props.updateControls(controlPoints);
        this.setState({controlsChanged:true});
    }

    updateRow(key,value) {
        let controlPoints = this.props.controlPoints;
        controlPoints[key] = value;
        this.props.updateControls(controlPoints);
        this.setState({controlsChanged:true});
    }

    toggleDisplayBanked(event) {
        this.setState({displayBankedTime:!this.state.displayBankedTime});
    }

    shouldComponentUpdate(newProps,newState) {
        if (newState.controlsChanged || newState.displayBankedTime != this.state.displayBankedTime ||
            this.props.controlPoints != newProps.controlPoints) {
            return true;
        }
        return false;
    }

    componentDidUpdate() {
        this.setState({controlsChanged:false});
    }

    componentWillReceiveProps(newProps) {
        this.setState({controlsChanged:true});
    }

    render () {
        const title = this.props.name == '' ?
            ( <h3 style={{textAlign:"center"}}>Control point list</h3> ) :
            ( <h3 style={{textAlign:"center"}}>Control point list for <i>{this.props.name}</i></h3> );
        const rusa_banked_header = (<th style={{'fontSize':'80%','width':'17%'}}>Banked time</th>);
        return (
            <div className="controlPoints">
                <ButtonToolbar style={{paddingTop:'11px',paddingLeft:'4px'}}>
                {/*<ButtonGroup style={{display:'flex',flexFlow:'row wrap'}}>*/}
                <ButtonGroup>
                    <Button tabIndex='10' onClick={this.addControl} id='addButton'><Glyphicon glyph="plus-sign"></Glyphicon>Add control point</Button>
                    {/*<Button onClick={this.addControl} id='addButton' style={{display:'inline-flex',width:'165px',height:'34px'}}><Glyphicon glyph="plus-sign"></Glyphicon>Add control point</Button>*/}
                    <Checkbox tabIndex='11' checked={this.state.displayBankedTime} inline
                       onChange={this.toggleDisplayBanked}
                     onClick={this.toggleDisplayBanked}
                     style={{padding:'7px 0px 0px 28px','textAlign':'center',float:'right', display:'inline-flex',width: '170px',height:'28px'}}>Display banked time</Checkbox>
                    <FormGroup controlId="finishTime" style={{display:'inline-flex'}}>
                        <ControlLabel style={{width:'8em',display:'flex',float:'right',marginTop:'7px',paddingLeft:'8px'}}>Finish time</ControlLabel>
                        <FormControl tabIndex='-1' type="text" style={{width:'12em',float:'right',marginTop:'2px',marginBotton:'0px',paddingLeft:'4px',paddingTop:'2px',height:'28px'}}
                                     value={this.props.finishTime}/>
                    </FormGroup>
                </ButtonGroup>
                </ButtonToolbar>
                <Panel header={title} bsStyle="info" style={{margin:'10px'}}>
                    <Table responsive condensed bordered striped hover fill>
                        <thead>
                        <tr>
                            <th style={{'fontSize':'80%','width':'22%'}}>Name</th>
                            <th style={{'fontSize':'80%','width':'18%'}}>Expected time spent</th>
                            <th style={{'fontSize':'80%','width':'11%'}}>Distance</th>
                            <th style={{'fontSize':'80%','width':'28%'}}>Est. arrival time</th>
                            {this.state.displayBankedTime?rusa_banked_header:null}
                        </tr>
                        </thead>
                        <tbody>
                        {this.props.controlPoints.map((row, key) =>
                            <ControlPoint key={key} index={key} onChange={this.updateRow} removeRow={this.removeRow}
                                          displayBanked={this.state.displayBankedTime} fields={row}/>)}
                        </tbody>
                    </Table>
                    <div tabIndex="98" onFocus={event => {document.getElementById('addButton').focus()}}></div>
                </Panel>
            </div>
        );
    }
}

module.exports=ControlPoints;
export default ControlPoint;