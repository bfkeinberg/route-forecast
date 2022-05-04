import React, { useEffect, useState } from 'react';
import { AnchorButton } from "@blueprintjs/core";
import PropTypes from 'prop-types';
import ReactGA from "react-ga4";
import { Tooltip2 } from '@blueprintjs/popover2';

const DonationRequest = ({wacky}) =>  {
    const [
transform,
setTransform
] = useState("")
    const [
filter,
setFilter
] = useState("")

    useEffect(() => {
        if (wacky) {
            const interval = setInterval(() => {
                setTransform(`rotate3d(${Math.random()}, ${Math.random()}, ${Math.random()}, ${Math.random() * 90 - 45}deg)`)
                setFilter(`hue-rotate(${Math.random() * 360}deg)`)
            }, 1500)
            return () => {
                clearInterval(interval)
            }
        }
    }, [wacky])
//
    return (
        // eslint-disable-next-line react/jsx-no-comment-textnodes
        <div style={{transform: transform, transition: "transform 1.5s, filter 1.5s linear", filter: filter, zIndex: 1}}>
            <Tooltip2 content={'Hi, if you would like to support randoplan, please consider donating something to my Paypal'}>
                <AnchorButton id={'donate'} href="https://paypal.me/BFeinberg" target="_blank" onClick={() => ReactGA.event('purchase', { currency: 'dollars' })}>
                    <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" width="106" height="30" />
                </AnchorButton>
            </Tooltip2>
        </div>
    );
}

DonationRequest.propTypes = {
    wacky:PropTypes.bool.isRequired
};

export default DonationRequest;

