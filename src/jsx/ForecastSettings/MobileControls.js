import { Button } from "@blueprintjs/core";
import { Col, Row, UncontrolledTooltip } from "reactstrap";
import FinishTime from "./FinishTime";
import PropTypes from "prop-types";
import React, { Suspense } from "react";
import { connect } from 'react-redux';
import { addControl, toggleDisplayBanked, toggleMetric } from "../actions/actions";
import Recalculate from "./Recalculate";
import ForecastInterval from "./ForecastInterval";
import RidingPace from "./RidingPace";
import {lazy} from '@loadable/component';
import {componentLoader} from "../actions/actions.js";
import StravaAnalysisIntervalInput from "./StravaAnalysisIntervalInput";

const LoadableDatePicker = lazy(() => componentLoader(import(/* webpackChunkName: "DateSelect" */ /* webpackPrefetch: true */ './DateSelect'), 5));

const DatePickerLoader = (props) => {
     return <Suspense fallback={<div>Loading date-time picker...</div>}>
        <LoadableDatePicker {...props}/>
     </Suspense>
};

const MobileControls = (props) => {
    return (
        <div className="mobile-controls-container">
            <Row>
                <Col>
                    <DatePickerLoader/>
                    <Recalculate/>
                </Col>
            </Row>
            <Row>
                <div style={{display: "flex"}}>
                    <div style={{flex: 1, padding: "5px"}}>
                        <ForecastInterval/>
                    </div>
                    <div style={{flex: 1, padding: "5px"}}>
                        <RidingPace/>
                    </div>
                </div>
            </Row>
            <div className="controls-item">
                <FinishTime />
            </div>
            <div className="controls-item">
                <div id="metric" className="controls-item-contents">

                    <span className="controls-checkbox-label">Metric</span>
                    <input type='checkbox' checked={props.metric} onChange={props.toggleMetric} />

                    <UncontrolledTooltip target={"metric"}>Control distances in km, other units displayed in km or degrees
                    </UncontrolledTooltip>
                </div>

            </div>
            <div id="banked" className="controls-item">
                <div id="metric" className="controls-item-contents">
                    <span className="controls-checkbox-label">Display banked time</span>
                    <input type='checkbox' checked={props.displayBanked} onChange={props.toggleDisplayBanked} />
                    <UncontrolledTooltip target={"banked"}>Show how many minutes remain to be within ACP/RUSA brevet
                        finishing times</UncontrolledTooltip>
                </div>

            </div>
            <div className="controls-item">
                <Button minimal={true} tabIndex='10' onClick={props.addControl} id='addButton' icon={"add"}>Add</Button>
                <UncontrolledTooltip target={"addButton"}>Add a control point</UncontrolledTooltip>
            </div>
            <StravaAnalysisIntervalInput/>
        </div>
    );
};

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
