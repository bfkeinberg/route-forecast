import {Button, Modal, ModalBody} from 'reactstrap';
import rideRatingText from './cyclerouteplanner.htm';
import React, {Component} from 'react';
import { Icon, IconSize, Intent } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

class PaceExplanation extends Component {
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
                <Button id='rideRatingPopup' onClick={this.toggle} color='info' size="sm">
                    <Icon icon={IconNames.HELP} iconSize={IconSize.STANDARD} intent={Intent.NONE} />
                </Button>
                <Modal isOpen={this.state.isOpen} scrollable={true} toggle={this.toggle}>
                    <ModalBody>
                        <div dangerouslySetInnerHTML={{__html: rideRatingText}}/>
                    </ModalBody>
                </Modal>
            </div>
        );
    }
}

export default PaceExplanation;

