import React from 'react';
import LadyBug from 'Images/gustavorezende_lady_bug-555px.png';
import {Button} from '@blueprintjs/core';

const bugReportUrl = "https://github.com/bfkeinberg/route-forecast/issues";
const BugReportButton = () => {
    return (
        <Button className="pt-intent-warning pt-small pt-minimal"
                onClick={() => window.open(bugReportUrl,"_blank")}><img id='bugImage' src={LadyBug}/>Report a bug</Button>
        );
};

export default BugReportButton;