import {Button} from '@blueprintjs/core';
import { getClient } from "@sentry/react"
import LadyBug from 'Images/gustavorezende_lady_bug-555px.png';
import React, {useRef, useEffect} from 'react';
import {useTranslation} from 'react-i18next'

const BugReportButton = () => {
        const buttonRef = useRef()
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
                        style={{ height: "47px" }}
                        text={t('buttons.bugReport')}
                        small
                        ref={buttonRef}
                >
                        <img style={{ height: "45", width: "32" }} id='bugImage' src={LadyBug} />
                </Button>
        );
};

export default BugReportButton;