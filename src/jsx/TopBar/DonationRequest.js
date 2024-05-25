import { AnchorButton } from "@blueprintjs/core";
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import ReactGA from "react-ga4";

import {DesktopTooltip} from "../shared/DesktopTooltip"
import {useTranslation} from 'react-i18next'

const english_donation_image = 'https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif'
const french_donation_image = 'https://www.paypalobjects.com/fr_XC/i/btn/btn_donate_LG.gif'
const donationImage = (i18n) => {
    return i18n.resolvedLanguage.startsWith('fr') ? french_donation_image : english_donation_image 
}

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
    const { t, i18n } = useTranslation()
    
    return (
        // eslint-disable-next-line react/jsx-no-comment-textnodes
        <div style={{transform: transform, transition: "transform 1.5s, filter 1.5s linear", filter: filter, zIndex: 1}}>
            <DesktopTooltip content={'Hi, if you would like to support randoplan, please consider donating something to my Paypal'}>
                <AnchorButton id={'donate'} href="https://paypal.me/BFeinberg" target="_blank" onClick={() => ReactGA.event('purchase', { currency: 'dollars' })}>
                    <img alt="" border="0" src={donationImage(i18n)} width="106" height="30" />
                </AnchorButton>
            </DesktopTooltip>
        </div>
    );
}

DonationRequest.propTypes = {
    wacky:PropTypes.bool.isRequired
};

export default DonationRequest;

