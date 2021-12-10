import React from 'react';
import PropTypes from 'prop-types';
import {Container, UncontrolledTooltip} from 'reactstrap';
import {connect} from 'react-redux';
import {toggleStravaAnalysis} from "../actions/actions";
import Strava from 'Images/api_logo_pwrdBy_strava_stack_light.png';
import {Button} from '@blueprintjs/core';

const AnalysisButton = ({stravaAnalysis,toggleStravaAnalysis}) => {
    let classes = 'pt-small pt-minimal';
    if (stravaAnalysis) {
        classes += ' pt-active';
    }
    return (
        <Container>
            <Button className={classes} tabIndex='-1' id={'enableAnalysis'}
                    onClick={toggleStravaAnalysis}><img id='stravaImage' src={Strava}/></Button>
            <UncontrolledTooltip target={'enableAnalysis'}>Analyze results with Strava</UncontrolledTooltip>
        </Container>
        );
};

AnalysisButton.propTypes = {
    stravaAnalysis:PropTypes.bool.isRequired,
    toggleStravaAnalysis:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        stravaAnalysis: state.controls.stravaAnalysis,
    });

const mapDispatchToProps = {
    toggleStravaAnalysis
};

export default connect(mapStateToProps,mapDispatchToProps)(AnalysisButton);