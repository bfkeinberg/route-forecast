import React from 'react';
import {Input, FormGroup} from 'reactstrap';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import ReactGA from "react-ga4";

const ShortUrl = ({shortUrl}) => {
    return (
        <FormGroup size='sm' style={{ display: shortUrl === ' ' ? 'none' : 'inline-flex', margin: "0px 10px"}}>
            <div style={{width: "150px", display: "flex", alignItems: "center"}}>
                <div>Shareable link:</div>
            </div>
            <Input size='20' bsSize="sm" readOnly type="text" value={shortUrl}
                   onFocus={event => {event.target.select();
                    navigator.clipboard.writeText(document.getSelection.toString());
                   ReactGA.event('share', {item_id:document.getSelection.toString()})}}/>
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