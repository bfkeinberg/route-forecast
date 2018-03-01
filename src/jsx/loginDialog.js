import React from 'react';
import {Button, Label, Input, FormFeedback, FormGroup, Modal, Tooltip} from 'reactstrap';
import PropTypes from 'prop-types';

class LoginDialog extends React.Component {
    static propTypes = {
        loginCb:PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.logIn = this.logIn.bind(this);
        this.logInCb = this.logInCb.bind(this);
        this.xmlhttp = new XMLHttpRequest();
        this.state = {username: '', password: '', showModal: false, status:''};
    }

    open() {
        this.setState({showModal: true});
    }

    close() {
        this.setState({showModal: false});
    }

    logIn() {
        this.xmlhttp.onreadystatechange = this.logInCb;
        this.xmlhttp.responseType = 'json';
        let loginform = document.getElementById("rwgps_login_form");
        let formdata = new FormData(loginform);
        this.xmlhttp.open("POST","/handle_login");
        this.xmlhttp.send(formdata);
    }

    logInCb(event) {
        if (this.xmlhttp.readyState === 4) {
            let resultFields = event.target.responseText !== '' ? JSON.parse(event.target.responseText) : null;
            if (event.target.status==200) {
                this.setState({status:''});
                this.close();
                this.props.loginCb(event.target);
            }
            else {
                // error handling
                this.setState({status:resultFields !== null ? resultFields['status'] : 'Unknown error'});

            }
        }
    }

    no_login_failure() {
        return this.state.status === '' ? 'success' : 'error';
    }

    render() {
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
                                <Label for='usernameInput'>User name</Label>
                                <Input id='usernameInput' type="text" value={this.state.username}
                                             name='username'
                                             onChange={event => this.setState({username: event.target.value})}
                                             required/>
                                <FormFeedback/>
                            </FormGroup>
                            <FormGroup controlId="password" validationState={this.no_login_failure()}>
                                <Label for='passwordInput'>Password</Label>
                                <Input id='passwordInput' type="password" value={this.state.password}
                                             name="password"
                                             onChange={event => this.setState({password: event.target.value})}
                                             required/>
                                <FormFeedback/>
                            </FormGroup>
                            <Button bsStyle="primary" onClick={this.logIn}>Log in</Button>
                            <Button onClick={this.close}>Cancel</Button>
                        </form>
                    </Modal.Body>
                </Modal>
                <span style={{padding:'10px'}}>Log into RideWithGps</span>
                <Tooltip target='login' id="rwgps_login_tooltip">Needed to enable entering rwgps route numbers</Tooltip>
                <Button id='login' style={{padding:'10px'}} onClick={this.open} bsClass="rwgpsLogin">Login</Button>
            </div>
        );
    }
}

export default LoginDialog;