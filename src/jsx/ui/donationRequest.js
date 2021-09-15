import {Modal, ModalBody} from 'reactstrap';
import React, {Component} from 'react';
import { Button, AnchorButton, Icon, IconSize, Intent } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

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
                <Button id='donation' onClick={this.toggle} icon="emoji" small={false} large={true} intent="secondary"/>
                <Modal isOpen={this.state.isOpen} scrollable={true} toggle={this.toggle}>
                    <ModalBody>
                        Hi, if you'd like to support randoplan, please consider donating something to my Paypal, via 
                         <AnchorButton href="https://paypal.me/BFeinberg" target="_blank">
                            <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" width="75" height="30" />
                         </AnchorButton>
                         <p>Thank you!</p>
                    </ModalBody>
            </Modal>
            </div>
        );
    }
}
//

export default Donation;

