import {Button} from "@blueprintjs/core";
import {UncontrolledTooltip} from "reactstrap";
import FinishTime from "./finishTime";
import PropTypes from "prop-types";
import React from "react";
import {connect} from 'react-redux';
import {addControl, toggleDisplayBanked, toggleMetric} from "../actions/actions";
import { Tooltip2 } from "@blueprintjs/popover2";

const DesktopControls = (props) => {
    return <div className="controls-container">
        <div className="controls-item">
            <Button minimal={true} tabIndex='10' onClick={props.addControl} id='addButton' icon={"add"}>Add</Button>
            <UncontrolledTooltip target={"addButton"}>Add a control point</UncontrolledTooltip>
        </div>
        <div className="controls-item controls-item-finish-time">
            <FinishTime/>
        </div>
        <div className="controls-item">
            <div id="metric" className="controls-item-contents">
                <span className="controls-checkbox-label">Metric</span>
    <Tooltip2 usePortal={true} content='Control distances in km, other units displayed in km or degrees C'>
                    <input type='checkbox' checked={props.metric} onChange={props.toggleMetric}/>
                </Tooltip2>
            </div>
        </div>
        <div id="banked" className="controls-item">
            <div id="metric" className="controls-item-contents">
                <span className="controls-checkbox-label">Display banked time</span>
    <Tooltip2 usePortal={true} placement='bottom' content='Show how many minutes remain to be within ACP/RUSA brevet finishing times'>
                    <input type='checkbox' checked={props.displayBanked} onChange={props.toggleDisplayBanked}/>
                </Tooltip2>
            </div>
        </div>
    </div>;
};

DesktopControls.propTypes = {
    addControl: PropTypes.func.isRequired,
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

export default connect(mapStateToProps, mapDispatchToProps)(DesktopControls);
