import LadyBug from 'Images/gustavorezende_lady_bug-555px.png';
import {useRef, useEffect} from 'react';
import {useTranslation} from 'react-i18next'
import { useMediaQuery } from "react-responsive";
import * as Sentry from "@sentry/react";
import { Button } from '@mantine/core';
const BugReportButton = () => {
        const buttonRef = useRef<HTMLButtonElement>(null)
        const buttonDimensions = useMediaQuery({ query: '(min-width: 1300px)' }) ? { height: "39px", width: "28px" } : { height: "34px", width: "25px" }
        const buttonHeight = useMediaQuery({ query: '(min-width: 1300px)' }) ? '40px' : '30px'
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
                        size="sm"
                        ref={buttonRef}
                        rightSection={<img style={buttonDimensions} id='bugImage' src={LadyBug} />}
                        variant='default'
                >
                        {t('buttons.bugReport')}                        
                </Button>
        );
};

export default BugReportButton;