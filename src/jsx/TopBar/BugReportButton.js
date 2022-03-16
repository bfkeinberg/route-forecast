import React from 'react';
import LadyBug from 'Images/gustavorezende_lady_bug-555px.png';
import {Button} from '@blueprintjs/core';
import * as Sentry from '@sentry/browser';
import * as SentryReact from "@sentry/react";

const bugReportDialog = () => {
        const event = Sentry.captureMessage('bug report');
        SentryReact.showReportDialog({eventId:event,
                title:"Looks like you want to report a problem",
                subtitle:"Please provide the details",
                labelSubmit:"Submit bug report"
        });
};

const BugReportButton = () => {
    return (
        <Button className="pt-intent-warning pt-small pt-minimal"
                onClick={bugReportDialog}
                style={{height: "40px"}}
        >
                <img style={{height: "auto"}} id='bugImage' src={LadyBug}/>Report a bug
        </Button>
        );
};

export default BugReportButton;