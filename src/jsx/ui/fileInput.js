import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup, UncontrolledTooltip, Row, Col} from 'reactstrap';
import {connect} from 'react-redux';
import {loadGpxRoute} from "../actions/actions";
import {decideValidationStateFor} from "../routeInfoEntry";

const FileInput = ({loadingSource,loadingSuccess,loadGpxRoute,timezone_api_key}) => {
    const ok=decideValidationStateFor('gpx',loadingSource,loadingSuccess);
    return (
        <FormGroup size='sm'
                   className='formGroup d-none d-md-block'>
            <UncontrolledTooltip placement='bottom' target='routeFile'>Upload a .gpx file describing your route</UncontrolledTooltip>
            <Row noGutters>
                <Col sm="3">
                    <Label for='routeFile' size='sm' tag='b'>Route file</Label>
                </Col>
                <Col>
                    <Input size='2' bsSize='sm' tabIndex='4' type="file" name='route'
                           accept=".gpx" id='routeFile' {...ok}
                           onChange={event => {
                            // nothing to encode if the URL if we're working from a local file
                            history.pushState(null, 'nothing', location.origin);
                            loadGpxRoute(event,timezone_api_key);
                        }
                    }/>
                </Col>
            </Row>
        </FormGroup>
    );
};

FileInput.propTypes = {
    loadingSource:PropTypes.string,
    loadingSuccess:PropTypes.bool,
    loadGpxRoute:PropTypes.func.isRequired,
    timezone_api_key:PropTypes.string.isRequired
};

const mapStateToProps = (state) =>
    ({
        loadingSource: state.uiInfo.dialogParams.loadingSource,
        loadingSuccess: state.uiInfo.dialogParams.succeeded,
        timezone_api_key: state.params.timezone_api_key
    });

const mapDispatchToProps = {
    loadGpxRoute
};

export default connect(mapStateToProps,mapDispatchToProps)(FileInput);