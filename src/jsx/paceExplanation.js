import {Button, Popover, PopoverHeader, PopoverBody} from 'reactstrap';
import rideRatingText from './cyclerouteplanner.htm';
import React, {Component} from 'react';
import { Icon, Intent } from "@blueprintjs/core";
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
                    <Icon icon={IconNames.HELP} iconSize={Icon.SIZE_STANDARD} intent={Intent.NONE} />
                </Button>
                <Popover innerClassName='rideRatingPopup' isOpen={this.state.isOpen} placement='right'
                         toggle={this.toggle} style={{width:450, maxWidth:500}} target='rideRatingPopup'>
                    <PopoverHeader>Route forecast tool info</PopoverHeader>
                    <PopoverBody>
                        <div dangerouslySetInnerHTML={{__html: rideRatingText}}/>
                    </PopoverBody>
                </Popover>
            </div>
        );
    }
}

export default PaceExplanation;

