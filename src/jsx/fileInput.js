import React from 'react';
import PropTypes from 'prop-types';
import {ControlLabel, FormControl, FormGroup, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {connect} from 'react-redux';
import {loadGpxRoute} from "./actions/actions";
import {decideValidationStateFor} from "./routeInfoEntry";

const FileInput = ({loadingSource,loadingSuccess,loadGpxRoute,timezone_api_key}) => {
    let file_upload_tooltip = ( <Tooltip id="upload_tooltip">Upload a .gpx file describing your route</Tooltip> );
    return (
        <FormGroup bsSize='small'
                   bsClass='formGroup hidden-xs hidden-sm'
                   validationState={decideValidationStateFor('gpx',loadingSource,loadingSuccess)}
                   style={{display:'inline-flex',marginTop:'5px',marginBottom:'5px'}}
                   controlId="route">
            <ControlLabel>Route file</ControlLabel>
            <OverlayTrigger placement='bottom' overlay={file_upload_tooltip}>
                <FormControl tabIndex='4' type="file" name='route' accept=".gpx" id='route' onChange={
                    event => {
                        // nothing to encode if the URL if we're working from a local file
                        history.pushState(null, 'nothing', location.origin);
                        loadGpxRoute(event,timezone_api_key);
                    }
                }/>
            </OverlayTrigger>
        </FormGroup>
    );
};

FileInput.propTypes = {
    loadingSource:PropTypes.string.isRequired,
    loadingSuccess:PropTypes.bool.isRequired,
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