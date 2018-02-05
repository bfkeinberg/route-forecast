import React from 'react';
import PropTypes from 'prop-types';
import {ControlLabel, FormControl, FormGroup, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {connect} from 'react-redux';
import {setInterval} from "./actions/actions";

const interval_tooltip = (
    <Tooltip id="interval_tooltip">How often to generate weather forecast</Tooltip>
);

const ForecastInterval = ({interval,setInterval}) => {
    return (
        <FormGroup bsSize='small' controlId="interval" style={{flex:'1',display:'inline-flex',marginTop:'5px',marginBottom:'5px'}}>
            <ControlLabel>Interval in hours</ControlLabel>
            <OverlayTrigger placement='bottom' overlay={interval_tooltip}>
                <FormControl tabIndex='2' type="number" min={0.5} max={2} step={0.5} name="interval" style={{'width':'5em'}}
                             value={interval} onChange={event => {setInterval(event.target.value)}}/>
            </OverlayTrigger>
        </FormGroup>
    );
};

ForecastInterval.propTypes = {
    interval:PropTypes.number.isRequired,
    setInterval:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        interval: state.uiInfo.interval
    });

const mapDispatchToProps = {
    setInterval
};

export default connect(mapStateToProps,mapDispatchToProps)(ForecastInterval);