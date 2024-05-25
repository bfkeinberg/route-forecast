import {Button} from '@blueprintjs/core';
import { getClient } from "@sentry/react"
import LadyBug from 'Images/gustavorezende_lady_bug-555px.png';
import React from 'react';
import {useTranslation} from 'react-i18next'

const openSentryDialog = () => {
        const client = getClient();
        if (client) {
                const feedback = client.getIntegrationByName("Feedback")
                if (feedback) feedback.openDialog()
        }
}

const BugReportButton = () => {
        const { t } = useTranslation()
        return (
                <Button className="pt-intent-warning"
                        onClick={openSentryDialog}
                        style={{ height: "47px" }}
                        text={t('buttons.bugReport')}
                        small
                >
                        <img style={{ height: "45", width: "32" }} id='bugImage' src={LadyBug} />
                </Button>
        );
};

export default BugReportButton;