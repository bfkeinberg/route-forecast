import SplitPane from "react-split-pane";
import ErrorBoundary from "./errorBoundary";
import RouteInfoForm from "./routeInfoEntry";
import ControlPoints from "./controls";
import PaceTable from "./paceTable";
import ForecastTable from "./forecastTable";
import RouteForecastMap from "./map";
import PropTypes from "prop-types";
import React from "react";

const DesktopUI = (props) => {
    return <SplitPane defaultSize={320} minSize={150} maxSize={530} split="horizontal">
        <SplitPane defaultSize={550} minSize={150} split='vertical' pane2Style={{"overflow": "scroll"}}>
            <ErrorBoundary>
                <RouteInfoForm formatControlsForUrl={props.formatControlsForUrl}/>
            </ErrorBoundary>
            <ErrorBoundary>
                <ControlPoints/>
            </ErrorBoundary>
        </SplitPane>
        <SplitPane defaultSize={545} minSize={150} split="vertical" paneStyle={{"overflow": "scroll"}}>
            {props.showPacePerTme ? <PaceTable/> : <ForecastTable/>}
            <RouteForecastMap maps_api_key={props.mapsApiKey}/>
        </SplitPane>
    </SplitPane>;
};

DesktopUI.propTypes = {
    formatControlsForUrl: PropTypes.func,
    showPacePerTme: PropTypes.bool,
    mapsApiKey: PropTypes.string
};

export default DesktopUI;