import { UncontrolledTooltip } from 'reactstrap';
import React, { useEffect, useState } from 'react';
import { AnchorButton } from "@blueprintjs/core";

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

    return (
        <div style={{transform: transform, transition: "transform 1.5s, filter 1.5s linear", filter: filter, zIndex: 1}}>
            <AnchorButton id={'donate'} href="https://paypal.me/BFeinberg" target="_blank">
                <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" height="30" />
            </AnchorButton>
            <UncontrolledTooltip placement={'top'} target={'donate'}>Hi, if you'd like to support randoplan, please consider donating something to my Paypal</UncontrolledTooltip>
        </div>
    );
}

export default DonationRequest;

