import { AnchorButton } from "@blueprintjs/core";
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import ReactGA from "react-ga4";
import { useMediaQuery } from "react-responsive";
import {DesktopTooltip} from "../shared/DesktopTooltip"
import {useTranslation} from 'react-i18next'
import cookie from 'react-cookies';

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

    const donateWasClicked = cookie.load('clickedDonate')
    const buttonImageWidth = useMediaQuery({ query: '(min-width: 1300px)' }) ?'106px' : '80px'
    useEffect(() => {
        if (wacky && !donateWasClicked) {
            const interval = setInterval(() => {
                setTransform(`rotate3d(${Math.random()}, ${Math.random()}, ${Math.random()}, ${Math.random() * 90 - 45}deg)`)
                setFilter(`hue-rotate(${Math.random() * 360}deg)`)
            }, 1500)
            return () => {
                clearInterval(interval)
            }
        }
    }, [wacky])

    const { t, i18n } = useTranslation()
        
    return (
        // eslint-disable-next-line react/jsx-no-comment-textnodes
        <div style={{ transform: transform, transition: "transform 1.5s, filter 1.5s linear", filter: filter, zIndex: 1 }}>
            <DesktopTooltip content={'Hi, if you would like to support randoplan, please consider donating'}>
                <AnchorButton id={'donate'} href="https://paypal.me/BFeinberg" target="_blank"
                    onClick={() => { cookie.save('clickedDonate', true, { path: '/' }); ReactGA.event('purchase', { currency: 'dollars' }) }}>
                    <img alt="" border="0" src={donationImage(i18n)} width={buttonImageWidth} /* height="30" */ />
                </AnchorButton>
            </DesktopTooltip>
        </div>
    );
}

DonationRequest.propTypes = {
    wacky:PropTypes.bool.isRequired
};

export default DonationRequest;

