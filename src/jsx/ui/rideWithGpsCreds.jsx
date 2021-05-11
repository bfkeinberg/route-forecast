import React, {useState} from 'react';
import PropTypes from 'prop-types';
import { Dialog, Button, InputGroup } from "@blueprintjs/core";
import { Tooltip2 } from "@blueprintjs/popover2";
import {connect} from 'react-redux';
import {setRwgpsCredentials} from "../actions/actions";

const RideWithGpsCreds = ({rwgpsUsername, rwgpsPassword, setRwgpsCredentials}) => {
    const [dlgIsOpen, setOpen] = useState(true);
    const [username, setUsername] = useState(rwgpsUsername);
    const [password, setPassword] = useState(rwgpsPassword);
    
    const close = () => {setOpen(false)};
    
    return (
        <Dialog
            title='Ride with GPS credentials'
            isOpen={dlgIsOpen} autoFocus={true} canEscapeKeyClose={true}
            onClose={() => setOpen(false)}
            >
            <Tooltip2 content='Ride with GPS username'>
                <InputGroup value={username} placeholder="RideWithGPS username"
                    onChange={event => setUsername(event.target.value)}
                    id='username' autoComplete='username'/>
            </Tooltip2>
            <Tooltip2 content='Ride with GPS password'>
                <InputGroup value={password} placeholder="RideWithGPS password"
                    onChange={event => setPassword(event.target.value)}
                    id='password' type='password' autoComplete='current-password'/>
            </Tooltip2>
            <Tooltip2 content="Accept credentials.">
                <Button onClick={() => {close(); setRwgpsCredentials(username,password)}}>Accept</Button>
            </Tooltip2>
            <Tooltip2 content="Don't set credentials.">
                <Button onClick={() => setOpen(false)}>Cancel</Button>
            </Tooltip2>
        </Dialog>
    );
};

RideWithGpsCreds.propTypes = {
    rwgpsUsername:PropTypes.string,
    rwgpsPassword:PropTypes.string,
    setRwgpsCredentials:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
({
    rwgpsUsername:state.rideWithGpsInfo.username,
    rwgpsPassword:state.rideWithGpsInfo.password
});

const mapDispatchToProps = {
    setRwgpsCredentials
};

export default connect(mapStateToProps,mapDispatchToProps)(RideWithGpsCreds);
