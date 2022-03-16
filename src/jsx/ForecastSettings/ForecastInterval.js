import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup } from "@blueprintjs/core";
import { Tooltip2 } from "@blueprintjs/popover2";
//import {Slider} from "@blueprintjs/core";
import Slider from "@mui/material/Slider"
import {connect} from 'react-redux';
import {setInterval} from "../../redux/actions";

const ForecastInterval = ({interval,setInterval}) => {
    return (
        <FormGroup style={{flex: 1}} label='Forecast Interval'>
            <Tooltip2 usePortal={true} placement='bottom' content='How often to generate weather forecast in minutes'>
                <Slider
                    value={interval}
                    step={0.25}
                    min={0.25}
                    max={2.0}
                    marks={[
{value:0.25,label:'15'},
{value:0.5,label:'30'},
{value:0.75,label:'45'},
{value:1,label:'60'},
{value:1.25,label:'75'},
                    {value:1.5,label:'90'},
{value:1.75,label:'105'},
{value:2.0,label:'120'}
]}
                    valueLabelDisplay="off"
                    onChange={(event, selected) => setInterval(selected)}/>
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