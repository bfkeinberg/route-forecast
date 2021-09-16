import {Modal, ModalBody, UncontrolledTooltip} from 'reactstrap';
import React, {Component} from 'react';
import { Button, AnchorButton, Icon, IconSize, Intent } from "@blueprintjs/core";

class Donation extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isOpen: false
        };
    }

    toggle = () => {
        this.setState({
            isOpen: !this.state.isOpen
        });
    };

    render() {
        return (
            <div>
                <AnchorButton id={'donate'} href="https://paypal.me/BFeinberg" target="_blank">
                    <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" width="75" height="30" />
                </AnchorButton>
                <UncontrolledTooltip placement={'top'} target={'donate'}>Hi, if you'd like to support randoplan, please consider donating something to my Paypal</UncontrolledTooltip>
            </div>
        );
    }
}
//

export default Donation;

