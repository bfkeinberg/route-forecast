import {Button} from '@blueprintjs/core';
import { getClient } from "@sentry/react"
import LadyBug from 'Images/gustavorezende_lady_bug-555px.png';
import React from 'react';

const openSentryDialog = () => {
        const client = getClient();
        if (client) {
                const feedback = client.getIntegrationByName("Feedback")
                if (feedback) feedback.openDialog()
        }
}

const BugReportButton = () => {
    return (
        <Button className="pt-intent-warning"
                onClick={openSentryDialog}
                style={{height: "47px"}}
                text={'Report a bug'}
                small
        >
                <img style={{height: "45", width: "32"}} id='bugImage' src={LadyBug}/>
        </Button>
        );
};

export default BugReportButton;