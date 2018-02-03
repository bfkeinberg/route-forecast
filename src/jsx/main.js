import React, {Component} from 'react';
import ControlPoints from './controls';
import RouteInfoForm from './routeInfoEntry';
import RouteForecastMap from './map';
import ForecastTable from './forecastTable';
import SplitPane from 'react-split-pane';
import {Button} from 'react-bootstrap';
import MediaQuery from 'react-responsive';
// for react-splitter
import 'normalize.css/normalize.css';
import Promise from 'promise-polyfill';
import '@blueprintjs/core/dist/blueprint.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';
import 'flatpickr/dist/themes/confetti.css';
import 'Images/style.css';

import queryString from 'query-string';
import cookie from 'react-cookies';
import ErrorBoundary from './errorBoundary';
import {connect} from 'react-redux';
import {
    setActionUrl,
    setApiKeys,
    setInterval,
    setMetric,
    setPace,
    setRwgpsRoute,
    setStart,
    setStravaActivity,
    setStravaError,
    setStravaToken
} from "./actions/actions";

/*
TODO:
integrate with jsErrLog
immutable.js
Simplify gpxParser to have one method that analyzes, using destructuring to simplify

feature requests:
show controls on map
show both wind arrows and rain cloud
fix bug involving control with 0 valued time or distance

 */
// To add to window
if (!window.Promise) {
    window.Promise = Promise;
}

class RouteWeatherUI extends Component {

    constructor(props) {
        super(props);
        this.updateControls = this.updateControls.bind(this);
        this.updateRouteInfo = this.updateRouteInfo.bind(this);
        this.formatControlsForUrl = this.formatControlsForUrl.bind(this);
        this.setActualPace = this.setActualPace.bind(this);
        let queryParams = queryString.parse(location.search);
        this.updateFromQueryParams(this.props, queryParams);
        let script = document.getElementById( "routeui" );
        props.setActionUrl(script.getAttribute('action'));
        props.setApiKeys(script.getAttribute('maps_api_key'),script.getAttribute('timezone_api_key'));
        // new control point url format - <name>,<distance>,<time-in-minutes>:<name>,<distance>,<time-in-minutes>:etc
        this.state = {controlPoints: queryParams.controlPoints===undefined?[]:this.parseControls(queryParams.controlPoints),
            routeInfo:{bounds:{},points:[], name:'',finishTime:''},
            formVisible:true};
    }

    static getStravaToken(queryParams) {
        if (queryParams.strava_token !== undefined) {
            cookie.save('strava_token', queryParams.strava_token);
            return queryParams.strava_token;
        } else {
            return cookie.load('strava_token');
        }
    }

    static doControlsMatch(newControl,oldControl) {
        return newControl.distance===oldControl.distance &&
            newControl.name===oldControl.name &&
            newControl.duration===oldControl.duration &&
            newControl.arrival===oldControl.arrival &&
            newControl.actual===oldControl.actual &&
            newControl.banked===oldControl.banked;
    }

/*    shouldComponentUpdate(newProps,newState) {
        let controlPoints = this.state.controlPoints;
        if (this.state.routeInfo.name !== newState['routeInfo'].name) {
            return true;
        }
        if (newState.controlPoints.length!==this.state.controlPoints.length) {
            return true;
        }
        if (!newState['controlPoints'].every((v,i)=> RouteWeatherUI.doControlsMatch(v,controlPoints[i]))) {
            return true;
        }
        if (newState.routeInfo.finishTime!==this.state.routeInfo.finishTime) {
            return true;
        }
        if (newState.forecast.length!==this.state.forecast.length) {
            return true;
        }
        if (newState.actualFinishTime !== this.state.actualFinishTime) {
            return true;
        }
        if (newState.actualPace !== this.state.actualPace) {
            return true;
        }
        if (newState.forecastValid !== this.state.forecastValid) {
            return true;
        }
        return false;
    }*/

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
        controlPointList.map(point => {
            let controlPointValues = point.split(",");
            return ({name:controlPointValues[0],distance:Number(controlPointValues[1]),duration:Number(controlPointValues[2])});
            });
        // delete dummy first element
        controlPoints.splice(0,1);
        return controlPoints;
    }

    componentWillReceiveProps(newProps) {
        if (newProps.name !== '') {
            cookie.save(newProps.name,this.formatControlsForUrl(newProps.controlPoints));
        }
    }

    componentWillMount() {
        // let queryParams = queryString.parse(location.search);
        // this.updateFromQueryParams(this.props, queryParams);
    }

    updateControls(controlPoints) {
        this.setState({controlPoints: controlPoints});
        if (this.state.routeInfo.name !== '') {
            cookie.save(this.state.routeInfo.name,this.formatControlsForUrl(controlPoints));
        }
    }

    setActualPace(actualPace) {
        this.setState({actualPace:actualPace});
    }

    updateRouteInfo(routeInfo,controlPoints) {
        if (this.state.routeInfo.name !== routeInfo.name) {
            let savedControlPoints = cookie.load(routeInfo.name);
            if (savedControlPoints !== undefined && savedControlPoints.length > 0) {
                controlPoints = this.parseControls(savedControlPoints);
            }
        }
        if (routeInfo.name !== '') {
            cookie.save(routeInfo.name,this.formatControlsForUrl(controlPoints));
        }
        this.setState({'routeInfo':routeInfo, 'controlPoints':controlPoints});
    }

    updateFromQueryParams(props,queryParams) {
        props.setRwgpsRoute(parseInt(queryParams.rwgpsRoute));
        props.setStravaToken(RouteWeatherUI.getStravaToken(queryParams));
        props.setStart(new Date(queryParams.start));
        props.setPace(queryParams.pace);
        props.setInterval(parseFloat(queryParams.interval));
        props.setMetric(queryParams.metric);
        props.setStravaActivity(queryParams.strava_activity);
        props.setStravaError(queryParams.strava_error);
    }

    render() {
        const inputForm = (
            <ErrorBoundary>
            <RouteInfoForm updateRouteInfo={this.updateRouteInfo}
                           formVisible={this.state.formVisible}
                           actualPace={this.state.actualPace}
                           formatControlsForUrl={this.formatControlsForUrl}
            />
            </ErrorBoundary>
        );
        const formButton = (
            <Button bsStyle="primary" onClick={() => this.setState({formVisible:true})}>Show input</Button>
        );
        return (
        <div>
            <MediaQuery minDeviceWidth={1000}>
                <SplitPane defaultSize={300} minSize={150} maxSize={530} split="horizontal">
                    <SplitPane defaultSize={550} minSize={150} split='vertical' pane2Style={{'overflow':'scroll'}}>
                        {inputForm}
                        <ErrorBoundary>
                        <ControlPoints
                                          updateControls={this.updateControls}
                                          actualFinishTime={this.state.actualFinishTime}
                                          setActualPace={this.setActualPace}
                                          invalidateForecast={this.invalidateForecast}
                                          name={this.props.name}/>
                        </ErrorBoundary>
                    </SplitPane>
                        <SplitPane defaultSize={500} minSize={150} split="vertical" paneStyle={{'overflow':'scroll'}}>
                            <ForecastTable forecast={this.state.forecast} weatherCorrectionMinutes={this.state.weatherCorrectionMinutes}/>
                            <RouteForecastMap maps_api_key={this.state.maps_key}
                                              forecast={this.state.forecast} routeInfo={this.state.routeInfo}/>
                        </SplitPane>
                </SplitPane>
            </MediaQuery>
            <MediaQuery maxDeviceWidth={800}>
                <SplitPane defaultSize={this.state.formVisible?500:250} minSize={120} maxSize={600} split="horizontal" pane2Style={{'overflow':'scroll'}}>
                    <SplitPane defaultSize={this.state.formVisible?319:33} minSize={30} split="horizontal" pane2Style={{'overflow':'scroll'}}>
                        {this.state.formVisible ? inputForm : formButton}
                        <ControlPoints controlPoints={this.state.controlPoints}
                                          updateControls={this.updateControls}
                                          finishTime={this.state.routeInfo['finishTime']}
                                          actualFinishTime={this.state.actualFinishTime}
                                          setActualPace={this.setActualPace}
                                          name={this.props.name}/>
                    </SplitPane>
                    {!this.state.formVisible?
                        <ForecastTable/>:
                        <div/>}
                </SplitPane>
            </MediaQuery>
        </div>
      );
    }
}

const mapDispatchToProps = {
    setStravaToken, setActionUrl, setRwgpsRoute, setApiKeys, setStravaError, setStart, setPace, setInterval, setMetric,
    setStravaActivity
};

const mapStateToProps = (state, ownProps) =>
    ({
        controlPoints: state.controls.controlPoints,
        name: state.routeInfo.name
    });

export default connect(mapStateToProps, mapDispatchToProps)(RouteWeatherUI);