import React from 'react';
import ControlPoints from './controls';
import ReactDOM from 'react-dom';
import RouteInfoForm from './routeInfoEntry';
import RouteForecastMap from './map';
import ForecastTable from './forecastTable';
import moment from 'moment';
import SplitPane from 'react-split-pane';
import {Button} from 'react-bootstrap';
import MediaQuery from 'react-responsive';
// for react-splitter
import 'normalize.css/normalize.css';

import '@blueprintjs/core/dist/blueprint.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'ag-grid/dist/styles/ag-grid.css';
import 'ag-grid/dist/styles/ag-theme-fresh.css';
import 'flatpickr/dist/themes/confetti.css';

import queryString from 'query-string';
import cookie from 'react-cookies';

class RouteWeatherUI extends React.Component {

    constructor(props) {
        super(props);
        this.updateControls = this.updateControls.bind(this);
        this.updateRouteInfo = this.updateRouteInfo.bind(this);
        this.updateForecast = this.updateForecast.bind(this);
        this.updateFinishTime = this.updateFinishTime.bind(this);
        this.formatControlsForUrl = this.formatControlsForUrl.bind(this);
        this.setActualFinishTime = this.setActualFinishTime.bind(this);
        let script = document.getElementById( "routeui" );
        let queryParams = queryString.parse(location.search);
        this.strava_token = RouteWeatherUI.getStravaToken(queryParams);
        // new control point url format - <name>,<distance>,<time-in-minutes>:<name>,<distance>,<time-in-minutes>:etc
        this.state = {controlPoints: queryParams.controlPoints===undefined?[]:this.parseControls(queryParams.controlPoints),
            routeInfo:{bounds:{},points:[], name:'',finishTime:''}, forecast:[], action:script.getAttribute('action'),
            maps_key:script.getAttribute('maps_api_key'), timezone_key:script.getAttribute('timezone_api_key'),
            formVisible:true, weatherCorrectionMinutes:null, metric:false};
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

    shouldComponentUpdate(newProps,newState) {
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
        if (newState.metric !== this.state.metric) {
            return true;
        }
        if (newState.actualFinishTime !== this.state.actualFinishTime) {
            return true;
        }
        return false;
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
        controlPointList.map(point => {
            let controlPointValues = point.split(",");
            return ({name:controlPointValues[0],distance:Number(controlPointValues[1]),duration:Number(controlPointValues[2])});
            });
        // delete dummy first element
        controlPoints.splice(0,1);
        return controlPoints;
    }

    updateControls(controlPoints,metric) {
        this.setState({controlPoints: controlPoints, metric:metric});
        if (this.state.routeInfo.name !== '') {
            cookie.save(this.state.routeInfo.name,this.formatControlsForUrl(controlPoints));
        }
    }

    setActualFinishTime(actualFinishTime) {
        this.setState({actualFinishTime:actualFinishTime});
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

    updateFinishTime(weatherCorrectionMinutes) {
        let routeInfoCopy = Object.assign({}, this.state.routeInfo);
        routeInfoCopy.finishTime =
            moment(routeInfoCopy.finishTime,'ddd, MMM DD h:mma').add(weatherCorrectionMinutes, 'minutes').format('ddd, MMM DD h:mma');
        this.setState({'routeInfo':routeInfoCopy,weatherCorrectionMinutes:weatherCorrectionMinutes});
    }

    updateForecast(forecast) {
        this.setState({forecast:forecast['forecast'],formVisible:false});
    }

    render() {
        let queryParams = queryString.parse(location.search);
        const inputForm = (
            <RouteInfoForm action={this.state.action}
                           updateRouteInfo={this.updateRouteInfo}
                           updateForecast={this.updateForecast}
                           updateControls={this.updateControls}
                           controlPoints={this.state.controlPoints}
                           formVisible={this.state.formVisible}
                           metric={this.state.metric}
                           updateFinishTime={this.updateFinishTime}
                           start={queryParams.start}
                           pace={queryParams.pace}
                           interval={queryParams.interval}
                           rwgpsRoute={queryParams.rwgpsRoute}
                           maps_api_key={this.state.maps_key}
                           timezone_api_key={this.state.timezone_key}
                           formatControlsForUrl={this.formatControlsForUrl}
            />
        );
        const formButton = (
            <Button bsStyle="primary" onClick={event => this.setState({formVisible:true})}>Show input</Button>
        );
        return (
        <div>
            <MediaQuery minDeviceWidth={1000}>
                <SplitPane defaultSize={300} minSize={150} maxSize={530} split="horizontal">
                    <SplitPane defaultSize={550} minSize={150} split='vertical' pane2Style={{'overflow':'scroll'}}>
                        {inputForm}
                        <ControlPoints controlPoints={this.state.controlPoints}
                                          updateControls={this.updateControls}
                                          finishTime={this.state.routeInfo['finishTime']}
                                          actualFinishTime={this.state.actualFinishTime}
                                          setActualFinishTime={this.setActualFinishTime}
                                          strava_token={this.strava_token}
                                          strava_activity={queryParams.strava_activity}
                                          strava_error={queryParams.strava_error}
                                          metric={queryParams.metric===null?this.state.metric:queryParams.metric==='true'}
                                          name={this.state.routeInfo['name']}/>
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
                    <SplitPane defaultSize={this.state.formVisible?308:33} minSize={30} split="horizontal" pane2Style={{'overflow':'scroll'}}>
                        {this.state.formVisible ? inputForm : formButton}
                        <ControlPoints controlPoints={this.state.controlPoints}
                                          updateControls={this.updateControls}
                                          metric={queryParams.metric===null?this.state.metric:queryParams.metric}
                                          strava_activity={queryParams.strava_activity}
                                          finishTime={this.state.routeInfo['finishTime']}
                                          actualFinishTime={this.state.actualFinishTime}
                                          setActualFinishTime={this.setActualFinishTime}
                                          strava_error={queryParams.strava_error}
                                          strava_token={this.strava_token}
                                          name={this.state.routeInfo['name']}/>
                    </SplitPane>
                    <ForecastTable forecast={this.state.forecast} weatherCorrectionMinutes={this.state.weatherCorrectionMinutes}/>
                </SplitPane>
            </MediaQuery>
        </div>
      );
    }
}

ReactDOM.render(
  <RouteWeatherUI />,
  document.getElementById('content')
);
