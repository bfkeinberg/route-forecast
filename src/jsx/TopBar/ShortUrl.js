import { FormGroup,InputGroup } from '@blueprintjs/core';
import PropTypes from 'prop-types';
import React from 'react';
import ReactGA from "react-ga4";
import {connect} from 'react-redux';

import { AppToaster } from '../shared/toast';

const ShortUrl = ({shortUrl}) => {
    return (
        <FormGroup inline={true} style={{ display: shortUrl === ' ' ? 'none' : 'inline-flex', margin: "0px 10px"}}>
            <div style={{width: "150px", display: "flex", alignItems: "center"}}>
                <div>Shareable link:</div>
            </div>
            <InputGroup id={'shortUrl'} size='20' small={true} readOnly type="text" value={shortUrl}
                   onClick={async event => {
                       try {
                            await navigator.clipboard.writeText(event.target.value);
                            (await AppToaster).show({ message: "Short URL copied", timeout:3000, isCloseButtonShown: false });
                       } catch (err) {
                           console.warn(err);
                            event.target.select();document.execCommand('copy');
                       }
                    ReactGA.event('share', {item_id:event.target.value})}}/>
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