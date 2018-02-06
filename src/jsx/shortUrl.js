import React from 'react';
import {FormControl, FormGroup} from 'react-bootstrap';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

const ShortUrl = ({shortUrl}) => {
    return (
        <FormGroup bsSize="small">
            <FormControl readOnly type="text" style={{marginTop:'10px',marginLeft:'135px',width:'15em',display:shortUrl===''?'none':'inline-flex'}}
                         value={shortUrl} onFocus={event => {event.target.select();document.execCommand('copy')}}/>
        </FormGroup>
    );
};

ShortUrl.propTypes = {
    shortUrl:PropTypes.string.isRequired
};

const mapStateToProps = (state) =>
    ({
        shortUrl: state.uiInfo.dialogParams.shortUrl
    });

export default connect(mapStateToProps)(ShortUrl);