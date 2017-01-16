import React, { Component } from 'react';
import {FormControl,FormGroup,Button,Modal,Tooltip,OverlayTrigger,ControlLabel} from 'react-bootstrap';

class LoginDialog extends React.Component {
    constructor(props) {
        super(props);
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.logIn = this.logIn.bind(this);
        this.logInCb = this.logInCb.bind(this);
        this.state = {username: '', password: '', showModal: false, xmlhttp : new XMLHttpRequest(), status:''};
    }

    open() {
        this.setState({showModal: true});
    }

    close() {
        this.setState({showModal: false});
    }

    logIn(event) {
        this.state.xmlhttp.onreadystatechange = this.logInCb;
        this.state.xmlhttp.responseType = 'json';
        let loginform = document.getElementById("rwgps_login_form");
        let formdata = new FormData(loginform);
        this.state.xmlhttp.open("POST","/handle_login");
        this.state.xmlhttp.send(formdata);
    }

    logInCb(event) {
        if (this.state.xmlhttp.readyState == 4) {
            let resultFields = event.target.responseText != '' ? JSON.parse(event.target.responseText) : null;
            if (event.target.status==200) {
                this.state.status='';
                this.close();
                this.props.loginCb(event.target);
            }
            else {
                // error handling
                this.setState({status:resultFields != null ? resultFields['status'] : 'Unknown error'});

            }
        }
    }

    no_login_failure() {
        return this.state.status == '' ? 'success' : 'error';
    }

    render() {
        let rwgps_login_tooltip = (<Tooltip id="rwgps_login_tooltip">Needed to enable entering rwgps route numbers</Tooltip>);
        return (
            <div>
                <Modal show={this.state.showModal} onHide={this.close}>
                    <Modal.Header closeButton>
                        <Modal.Title>RWGPS login</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Note that user name and password are not currently persisted,
                        so they will need to be re-entered on future sessions<br/><br/>
                        {this.state.status}
                        <form id="rwgps_login_form">
                            <FormGroup controlId="username" validationState={this.no_login_failure()}>
                                <ControlLabel>User name</ControlLabel>
                                <FormControl type="text" value={this.state.username}
                                             name='username'
                                             onChange={event => this.setState({username: event.target.value})}
                                             required/>
                                <FormControl.Feedback/>
                            </FormGroup>
                            <FormGroup controlId="password" validationState={this.no_login_failure()}>
                                <ControlLabel>Password</ControlLabel>
                                <FormControl type="password" value={this.state.password}
                                             name="password"
                                             onChange={event => this.setState({password: event.target.value})}
                                             required/>
                                <FormControl.Feedback/>
                            </FormGroup>
                            <Button bsStyle="primary" onClick={this.logIn}>Log in</Button>
                            <Button onClick={this.close}>Cancel</Button>
                        </form>
                    </Modal.Body>
                </Modal>
                <span style={{padding:'10px'}}>Log into RideWithGps</span>
                <OverlayTrigger overlay={rwgps_login_tooltip}>
                    <Button style={{padding:'10px'}} onClick={this.open} bsClass="rwgpsLogin">Login</Button>
                </OverlayTrigger>
            </div>
        );
    }
}

module.exports=LoginDialog;
export default LoginDialog;