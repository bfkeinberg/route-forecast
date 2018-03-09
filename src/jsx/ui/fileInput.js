import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup, UncontrolledTooltip, Row, Col} from 'reactstrap';
import {connect} from 'react-redux';
import {loadGpxRoute} from "../actions/actions";
import {decideValidationStateFor} from "../routeInfoEntry";

const FileInput = ({loadingSource,loadingSuccess,loadGpxRoute}) => {
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
                               if (window.chrome !== undefined) {
                                   history.pushState(null, 'nothing', location.origin);
                               }
                            loadGpxRoute(event);
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
    loadGpxRoute:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        loadingSource: state.uiInfo.dialogParams.loadingSource,
        loadingSuccess: state.uiInfo.dialogParams.succeeded
    });

const mapDispatchToProps = {
    loadGpxRoute
};

export default connect(mapStateToProps,mapDispatchToProps)(FileInput);