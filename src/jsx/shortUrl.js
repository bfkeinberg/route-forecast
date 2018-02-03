import React, {Component} from 'react';
import {FormControl, FormGroup} from 'react-bootstrap';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

class ShortUrl extends Component {
    static propTypes = {
        shortUrl:PropTypes.string.isRequired
    };

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
const mapStateToProps = (state, ownProps) =>
    ({
        shortUrl: state.uiInfo.shortUrl
    });

export default connect(mapStateToProps)(ShortUrl);