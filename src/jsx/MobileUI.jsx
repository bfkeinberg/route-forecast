import ErrorBoundary from "./errorBoundary";
import RouteInfoForm from "./routeInfoEntry";
import ControlPoints from "./controls";
import PaceTable from "./paceTable";
import ForecastTable from "./forecastTable";
import RouteForecastMap from "./map";
import PropTypes from "prop-types";
import React from "react";
import { Router, Route, Link, MemoryRouter } from "react-router-dom";
import {createMemoryHistory} from 'history';
import {Nav, NavItem, NavbarBrand} from "reactstrap";
import { Icon, Intent } from "@blueprintjs/core";
import {IconNames} from "@blueprintjs/icons";
import {connect} from 'react-redux';

const DataTable = (props) => {
    return (props.showPacePerTme ? <PaceTable/> : <ForecastTable/>);
};

const MobileUI = (props) => {
    return <MemoryRouter>
        <Nav tabs>
            <NavbarBrand>Route plan</NavbarBrand>
            <NavItem>
                <ErrorBoundary>
                    <Link to={"/"} class={'nav-link'}>
                        <Icon icon={IconNames.HOME} iconSize={Icon.SIZE_STANDARD} intent={Intent.PRIMARY} />
                    </Link>
                </ErrorBoundary>
            </NavItem>
            <NavItem>
            <ErrorBoundary>
                <Link to={"/controlPoints/"} class={'nav-link'}>
                    <Icon icon={IconNames.SHOP} iconSize={Icon.SIZE_STANDARD} intent={Intent.NONE} />
                </Link>
            </ErrorBoundary>
            </NavItem>
            <NavItem>
                <Link to={"/map/"} class={'nav-link'}>
                    <Icon icon={IconNames.GLOBE} iconSize={Icon.SIZE_STANDARD} intent={props.needToViewMap?Intent.DANGER:Intent.NONE} />
                </Link>
            </NavItem>
            <NavItem>
                <Link to={"/table/"} class={'nav-link'}>
                    <Icon icon={IconNames.TH} iconSize={Icon.SIZE_STANDARD} intent={props.needToViewTable?Intent.DANGER:Intent.NONE} />
                </Link>
            </NavItem>
        </Nav>

        <Route path="/" exact render={(routeProps) => <RouteInfoForm routeProps={routeProps} formatControlsForUrl={props.formatControlsForUrl}/>}/>
        <Route path="/controlPoints/" exact component={ControlPoints} />
        <Route path="/map/" exact render={(routeProps) => <RouteForecastMap maps_api_key={props.mapsApiKey} />} />
        <Route path="/table/" exact component={DataTable} />

    </MemoryRouter>;
};

MobileUI.propTypes = {
    formatControlsForUrl: PropTypes.func.isRequired,
    showPacePerTme: PropTypes.bool,
    mapsApiKey: PropTypes.string.isRequired,
    needToViewTable: PropTypes.bool.isRequired,
    needToViewMap: PropTypes.bool.isRequired
};

const mapStateToProps = (state) =>
    ({
        showPacePerTme:state.controls.stravaAnalysis && state.strava.calculatedPaces !== null,
        needToViewTable:state.forecast.valid && !state.forecast.tableViewed,
        needToViewMap:state.forecast.valid && !state.forecast.mapViewed
    });

export default connect(mapStateToProps)(MobileUI);