import React, {Component} from 'react';
import ControlPoints from './controls';
import RouteInfoForm from './routeInfoEntry';
import RouteForecastMap from './map';
import ForecastTable from './forecastTable';
import SplitPane from 'react-split-pane';
import MediaQuery from 'react-responsive';
// for react-splitter
import 'normalize.css/normalize.css';
import Promise from 'promise-polyfill';
import '@blueprintjs/core/lib/css/blueprint.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';
import 'flatpickr/dist/themes/confetti.css';
import 'Images/style.css';
import cookie from 'react-cookies';
import {Button} from 'reactstrap';
import queryString from 'query-string';
import ErrorBoundary from './errorBoundary';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {
    setActionUrl,
    setApiKeys,
    setFetchAfterLoad,
    setInterval,
    setMetric,
    setPace,
    setRwgpsRoute,
    setStart,
    setStravaActivity,
    setStravaError,
    setStravaToken,
    showForm,
    updateUserControls
} from "./actions/actions";
import QueryString from './queryString';
import PaceTable from './paceTable';

/*
TODO:
immutable.js

 */

class RouteWeatherUI extends Component {
    static propTypes = {
        setActionUrl:PropTypes.func.isRequired,
        setApiKeys:PropTypes.func.isRequired,
        updateControls:PropTypes.func.isRequired,
        formVisible:PropTypes.bool.isRequired,
        showForm:PropTypes.func.isRequired,
        showPacePerTme:PropTypes.bool.isRequired,
        setFetchAfterLoad:PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.formatControlsForUrl = this.formatControlsForUrl.bind(this);
        let queryParams = queryString.parse(location.search);
        RouteWeatherUI.updateFromQueryParams(this.props, queryParams);
        let script = document.getElementById( "routeui" );
        props.setActionUrl(script.getAttribute('action'));
        props.setApiKeys(script.getAttribute('maps_api_key'),script.getAttribute('timezone_api_key'));
        this.props.updateControls(queryParams.controlPoints===undefined?[]:this.parseControls(queryParams.controlPoints));
        // new control point url format - <name>,<distance>,<time-in-minutes>:<name>,<distance>,<time-in-minutes>:etc
        this.state = {};
    }

    static getStravaToken(queryParams) {
        if (queryParams.strava_token !== undefined) {
            cookie.save('strava_token', queryParams.strava_token);
            return queryParams.strava_token;
        } else {
            return cookie.load('strava_token');
        }
    }

    static formatOneControl(controlPoint) {
        if (typeof controlPoint === 'string') {
            return controlPoint;
        }
        return controlPoint.name + "," + controlPoint.distance + "," + controlPoint.duration;
    }

    formatControlsForUrl(controlPoints) {
        return controlPoints.reduce((queryParam,point) => {return RouteWeatherUI.formatOneControl(queryParam) + ':' + RouteWeatherUI.formatOneControl(point)},'');
    }

    parseControls(controlPointString) {
        let controlPointList = controlPointString.split(":");
        let controlPoints =
        controlPointList.map((point,index) => {
            let controlPointValues = point.split(",");
            return ({name:controlPointValues[0],distance:Number(controlPointValues[1]),duration:Number(controlPointValues[2]), id:index});
            });
        // delete dummy first element
        controlPoints.splice(0,1);
        return controlPoints;
    }

    static updateFromQueryParams(props, queryParams) {
        props.setRwgpsRoute(queryParams.rwgpsRoute);
        // force forecast fetch when our initial url contains a route number
        if (queryParams.rwgpsRoute !== undefined) {
            props.setFetchAfterLoad(true);
        }
        props.setStravaToken(RouteWeatherUI.getStravaToken(queryParams));
        props.setStart(queryParams.start);
        props.setPace(queryParams.pace);
        props.setInterval(queryParams.interval);
        props.setMetric(queryParams.metric==="true");
        props.setStravaActivity(queryParams.strava_activity);
        props.setStravaError(queryParams.strava_error);
    }

    render() {
        const inputForm = (
            <ErrorBoundary>
                <RouteInfoForm formatControlsForUrl={this.formatControlsForUrl}/>
            </ErrorBoundary>
        );
        const formButton = (
            <Button bsStyle="primary" onClick={() => this.props.showForm}>Show input</Button>
        );
        return (
        <div>
            <QueryString/>
            <MediaQuery minDeviceWidth={1000}>
                <SplitPane defaultSize={300} minSize={150} maxSize={530} split="horizontal">
                    <SplitPane defaultSize={550} minSize={150} split='vertical' pane2Style={{'overflow':'scroll'}}>
                        {inputForm}
                        <ErrorBoundary>
                            <ControlPoints/>
                        </ErrorBoundary>
                    </SplitPane>
                        <SplitPane defaultSize={500} minSize={150} split="vertical" paneStyle={{'overflow':'scroll'}}>
                            {this.props.showPacePerTme?<PaceTable/>:<ForecastTable/>}
                            <RouteForecastMap/>
                        </SplitPane>
                </SplitPane>
            </MediaQuery>
            <MediaQuery maxDeviceWidth={800}>
                <SplitPane defaultSize={this.props.formVisible?500:250} minSize={120} maxSize={600} split="horizontal" pane2Style={{'overflow':'scroll'}}>
                    <SplitPane defaultSize={this.props.formVisible?319:33} minSize={30} split="horizontal" pane2Style={{'overflow':'scroll'}}>
                        {this.props.formVisible ? inputForm : formButton}
                        <ControlPoints/>
                    </SplitPane>
                    {!this.props.formVisible? <ForecastTable/>: <div/>}
                </SplitPane>
            </MediaQuery>
        </div>
      );
    }
}

const mapDispatchToProps = {
    setStravaToken, setActionUrl, setRwgpsRoute, setApiKeys, setStravaError, setStart, setPace, setInterval, setMetric,
    setStravaActivity, updateControls:updateUserControls, showForm, setFetchAfterLoad
};

const mapStateToProps = (state) =>
    ({
        controlPoints: state.controls.controlPoints,
        formVisible: state.uiInfo.dialogParams.formVisible,
        showPacePerTme:state.controls.stravaAnalysis && state.strava.calculatedPaces !== null
    });

export default connect(mapStateToProps, mapDispatchToProps)(RouteWeatherUI);