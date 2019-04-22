import {Button, Checkbox, Alignment} from "@blueprintjs/core";
import {UncontrolledTooltip} from "reactstrap";
import FinishTime from "./finishTime";
import PropTypes from "prop-types";
import React from "react";
import {connect} from 'react-redux';
import {addControl, toggleDisplayBanked, toggleMetric} from "../actions/actions";

function MobileControls(props) {
    return <div className="controls-container">
        <div className="controls-item">
            <Button class={"pt-minimal"} tabIndex='10' onClick={props.addControl} id='addButton' icon={"add"}>Add</Button>
            <UncontrolledTooltip target={"addButton"}>Add a control point</UncontrolledTooltip>
        </div>
        <div className="controls-item">
            <FinishTime/>
        </div>
        <div className="controls-item">
            <Checkbox alignIndicator={Alignment.RIGHT} inline checked={props.metric} label="Metric" onChange={props.toggleMetric} />
{/*
            <div id="metric" className="controls-item-contents">

                <span className="controls-checkbox-label">Metric</span>
                <input type='checkbox' checked={props.metric} onChange={props.toggleMetric}/>

                <UncontrolledTooltip target={"metric"}>Control distances in km, other units displayed in km or degrees
                    C</UncontrolledTooltip>
            </div>
*/}
        </div>
        <div id="banked" className="controls-item">
            <Checkbox alignIndicator={Alignment.RIGHT} inline checked={props.displayBanked} label="Display banked time" onChange={props.toggleDisplayBanked} />
{/*
            <div id="metric" className="controls-item-contents">
                <span className="controls-checkbox-label">Display banked time</span>
                <input type='checkbox' checked={props.displayBanked} onChange={props.toggleDisplayBanked}/>
                <UncontrolledTooltip target={"banked"}>Show how many minutes remain to be within ACP/RUSA brevet
                    finishing times</UncontrolledTooltip>
            </div>
*/}
        </div>
    </div>;
}

MobileControls.propTypes = {
    addControl: PropTypes.func,
    metric: PropTypes.bool.isRequired,
    toggleMetric: PropTypes.func.isRequired,
    displayBanked: PropTypes.bool.isRequired,
    toggleDisplayBanked: PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        metric: state.controls.metric,
        displayBanked: state.controls.displayBanked
    });

const mapDispatchToProps = {
    toggleMetric, toggleDisplayBanked, addControl
};

export default connect(mapStateToProps, mapDispatchToProps)(MobileControls);