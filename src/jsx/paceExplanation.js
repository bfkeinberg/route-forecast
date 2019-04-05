import {Button, Popover, PopoverHeader, PopoverBody} from 'reactstrap';
import rideRatingText from './cyclerouteplanner.htm';
import React, {Component} from 'react';

class PaceExplanation extends Component {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
        this.state = {
            isOpen: false
        };
    }

    toggle() {
        this.setState({
            isOpen: !this.state.isOpen
        });
    }

    render() {
        return (
            <div>
                <Button id='rideRatingPopup' onClick={this.toggle} color='info' size="sm">Info</Button>
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

