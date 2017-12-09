import React from 'react';
import { FormControl,FormGroup } from 'react-bootstrap';

class ShortUrl extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <FormGroup bsSize="small">
                <FormControl readOnly type="text" style={{marginTop:'10px',marginLeft:'135px',width:'15em',display:this.props.shortUrl==''?'none':'inline-flex'}}
                             value={this.props.shortUrl} onFocus={event => {event.target.select();document.execCommand('copy')}}/>
            </FormGroup>
        );
    }
}

export default ShortUrl;