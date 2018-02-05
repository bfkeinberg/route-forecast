import {Button, OverlayTrigger, Popover} from 'react-bootstrap';
import rideRatingText from './rideRating.htm';
import React from 'react';

const rideRatingDisplay = (
    <Popover style={{width:450, maxWidth:500}} id="ride-rating-popup" title="Ride rating system">
        <div dangerouslySetInnerHTML={{__html: rideRatingText}}/>
    </Popover>
);

const PaceExplanation = () => {
    return (
        <OverlayTrigger trigger="click" placement="right" rootClose overlay={rideRatingDisplay}>
            <Button style={{marginLeft: '7px'}} bsSize="xsmall">Pace explanation</Button>
        </OverlayTrigger>);
};

export default PaceExplanation;

