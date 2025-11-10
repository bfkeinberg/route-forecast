import LadyBug from 'Images/gustavorezende_lady_bug-555px.png';
import {useRef, useEffect} from 'react';
import {useTranslation} from 'react-i18next'
import { useMediaQuery } from "react-responsive";
import * as Sentry from "@sentry/react";
import { Button } from '@mantine/core';
const BugReportButton = () => {
        const buttonRef = useRef<HTMLButtonElement>(null)
        let buttonDimensions = useMediaQuery({ query: '(min-width: 1300px)' }) ? { height: "39px", width: "28px" } : { height: "34px", width: "25px" }
        const buttonVariant = useMediaQuery({ query: '(min-width: 1250px)' }) ? "sm" : "xsm";
        let buttonHeight = useMediaQuery({ query: '(min-width: 1300px)' }) ? '40px' : '30px'
        if (useMediaQuery({ query: '(min-width: 1250px)' })) {
                buttonDimensions = {height: "30px", width: "22px"}
                buttonHeight = "25px"
        }
        const { t } = useTranslation()
        useEffect(() => {
                const feedback = Sentry.feedbackIntegration({autoInject:false, isEmailRequired:false})
                if (buttonRef.current && feedback) {
                        feedback.attachTo(buttonRef.current)
                }
        })
        return (
                <Button
                        style={{ height: buttonHeight }}
                        size={buttonVariant}
                        ref={buttonRef}
                        rightSection={<img style={buttonDimensions} id='bugImage' src={LadyBug} />}
                        variant='default'
                >
                        {t('buttons.bugReport')}                        
                </Button>
        );
};

export default BugReportButton;