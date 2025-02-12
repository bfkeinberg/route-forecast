import { FormGroup,InputGroup } from '@blueprintjs/core';
import ReactGA from "react-ga4";
import {connect} from 'react-redux';

import { AppToaster } from '../shared/toast';
import { RootState } from  '../app/topLevel'

const ShortUrl = ({shortUrl} : {shortUrl:string}) => {
    return (
        <FormGroup inline={true} style={{ display: shortUrl === ' ' ? 'none' : 'inline-flex', margin: "0px 10px"}}>
            <div style={{width: "150px", display: "flex", alignItems: "center"}}>
                <div>Shareable link:</div>
            </div>
            <InputGroup id={'shortUrl'} size={20} small={true} readOnly type="text" value={shortUrl}
                   onClick={async event => {
                       try {
                            await navigator.clipboard.writeText((event.target as HTMLInputElement).value);
                            (await AppToaster).show({ message: "Short URL copied", timeout:3000, isCloseButtonShown: false });
                       } catch (err) {
                           console.warn(err);
                           (event.target as HTMLInputElement).select();document.execCommand('copy');
                       }
                    ReactGA.event('share', {item_id:(event.target as HTMLInputElement).value})}}/>
        </FormGroup>
    );
};

const mapStateToProps = (state : RootState) =>
    ({
        shortUrl: state.uiInfo.dialogParams.shortUrl
    });

export default connect(mapStateToProps)(ShortUrl);