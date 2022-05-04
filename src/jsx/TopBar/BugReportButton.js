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
        <Button className="pt-intent-warning"
                onClick={bugReportDialog}
                style={{height: "47px"}}
                text={'Report a bug'}
                small
        >
                <img style={{height: "45", width: "32"}} id='bugImage' src={LadyBug}/>
        </Button>
        );
};

export default BugReportButton;