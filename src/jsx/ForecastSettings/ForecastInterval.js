import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup } from "@blueprintjs/core";
import { Tooltip2 } from "@blueprintjs/popover2";
import {Slider} from "@blueprintjs/core";
import {connect} from 'react-redux';
import {setInterval} from "../../redux/actions";

const ForecastInterval = ({interval,setInterval}) => {
    return (
        <FormGroup style={{flex: 1}} label='Forecast Interval'>
            <Tooltip2 usePortal={true} placement='bottom' content='How often to generate weather forecast'>
                <Slider
                    value={interval}
                    labelPrecision={1}
                    labelStepSize={0.5}
                    stepSize={0.05}
                    min={0.5}
                    max={2.0}
                    labelRenderer={value=>`${(value*60).toFixed()} minutes`}
                    intent="primary"
                    onRelease={selected => setInterval(selected)}/>
            </Tooltip2>
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