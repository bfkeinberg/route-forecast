import React from 'react';
import PropTypes from 'prop-types';
import {Label, Container, Button} from 'reactstrap';
import {connect} from 'react-redux';
import {toggleStravaAnalysis} from "../actions/actions";
import Strava from 'Images/api_logo_pwrdBy_strava_stack_light.png';

const AnalysisButton = ({stravaAnalysis,enabled,toggleStravaAnalysis}) => {
    return (
        <Container>
            {/*<Label for="enableAnalysis" size='sm' tag='b'>Analyze with Strava</Label>*/}
            <Button size="sm" outline={true} tabIndex='-1' id='enableAnalysis' disabled={!enabled}
                    onClick={toggleStravaAnalysis}><img id='stravaImage' src={Strava}/></Button>
        </Container>
        );
};

AnalysisButton.propTypes = {
    stravaAnalysis:PropTypes.bool.isRequired,
    enabled: PropTypes.bool.isRequired,
    toggleStravaAnalysis:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        stravaAnalysis: state.controls.stravaAnalysis,
        enabled: state.forecast.valid
    });

const mapDispatchToProps = {
    toggleStravaAnalysis
};

export default connect(mapStateToProps,mapDispatchToProps)(AnalysisButton);