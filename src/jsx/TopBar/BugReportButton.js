import {Button} from '@blueprintjs/core';
import { getClient } from "@sentry/react"
import LadyBug from 'Images/gustavorezende_lady_bug-555px.png';
import React, {useRef, useEffect} from 'react';
import {useTranslation} from 'react-i18next'
import { useMediaQuery } from "react-responsive";

const BugReportButton = () => {
        const buttonRef = useRef()
        const buttonDimensions = useMediaQuery({ query: '(min-width: 1300px)' }) ? { height: "45", width: "32" } : { height: "34", width: "25" }
        const buttonHeight = useMediaQuery({ query: '(min-width: 1300px)' }) ? '47px' : '36px'
        const { t } = useTranslation()
        useEffect(() => {
                const client = getClient();
                if (client) {
                        const feedback = client.getIntegrationByName("Feedback")
                        if (buttonRef.current) {
                                feedback.attachTo(buttonRef.current)
                        }
                }        
        })
        return (
                <Button className="pt-intent-warning"
                        style={{ height: buttonHeight }}
                        text={t('buttons.bugReport')}
                        small
                        ref={buttonRef}
                >
                        <img style={buttonDimensions} id='bugImage' src={LadyBug} />
                </Button>
        );
};

export default BugReportButton;