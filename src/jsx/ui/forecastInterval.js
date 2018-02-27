import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup, Tooltip} from 'reactstrap';
import {connect} from 'react-redux';
import {setInterval} from "../actions/actions";

const ForecastInterval = ({interval,setInterval}) => {
    return (
        <FormGroup size='sm' style={{flex:'1',display:'inline-flex',marginTop:'5px',marginBottom:'5px'}}>
            <Tooltip toggle={console.log('toggle called')} target='interval' placement='bottom'>How often to generate weather forecast</Tooltip>
            <Label>Interval in hours
                <Input bsSize='small' id='interval' tabIndex='2' type="number"
                       min={0.5} max={2} step={0.5} name="interval" style={{'width':'5em'}}
                             value={interval} onChange={event => {setInterval(event.target.value)}}/>
            </Label>
        </FormGroup>
    );
};

ForecastInterval.propTypes = {
    interval:PropTypes.number.isRequired,
    setInterval:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        interval: state.uiInfo.routeParams.interval
    });

const mapDispatchToProps = {
    setInterval
};

export default connect(mapStateToProps,mapDispatchToProps)(ForecastInterval);