import LadyBug from 'Images/gustavorezende_lady_bug-555px.png';
import {useRef, useEffect} from 'react';
import {useTranslation} from 'react-i18next'
import { useMediaQuery } from "react-responsive";
import * as Sentry from "@sentry/react";
import { Button } from '@mantine/core';

const BugReportButton = () => {
        const buttonRef = useRef<HTMLButtonElement>(null)
        const widerThan1300 = useMediaQuery({ query: '(min-width: 1300px)' });
        const widerThan1250 = useMediaQuery({ query: '(min-width: 1250px)' });
        const { t } = useTranslation()
        let buttonDimensions = widerThan1300 ? { height: "39px", width: "28px" } : { height: "34px", width: "25px" }
        const buttonVariant = widerThan1250 ? "sm" : "xsm";
        let buttonHeight = widerThan1300 ? '40px' : '30px'
        if (widerThan1250 && !widerThan1300) {
                buttonDimensions = {height: "30px", width: "22px"}
                buttonHeight = "25px"
        }
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