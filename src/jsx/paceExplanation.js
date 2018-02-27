import {Button, Popover, PopoverHeader, PopoverBody} from 'reactstrap';
import rideRatingText from './rideRating.htm';
import React from 'react';

const PaceExplanation = () => {
    return (
        <div>
            <Button id='rideRatingPopup' style={{marginLeft: '7px'}} size="sm">Pace explanation</Button>
            <Popover isOpen={false} placement='right' style={{width:450, maxWidth:500}} target='rideRatingPopup'>
                <PopoverHeader>Ride rating system</PopoverHeader>
                <PopoverBody>
                    <div dangerouslySetInnerHTML={{__html: rideRatingText}}/>
                </PopoverBody>
            </Popover>
        </div>
        );
};

export default PaceExplanation;

