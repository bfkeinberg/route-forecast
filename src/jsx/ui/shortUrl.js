import React from 'react';
import {Input, FormGroup} from 'reactstrap';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

const ShortUrl = ({shortUrl}) => {
    return (
        <FormGroup size='sm' style={{marginTop:'10px',marginLeft:'135px',width:'15em',display:shortUrl===''?'none':'inline-flex'}}>
            <Input bsSize="small" readOnly type="text" value={shortUrl}
                   onFocus={event => {event.target.select();document.execCommand('copy')}}/>
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