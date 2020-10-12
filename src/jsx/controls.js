import {Card, CardBody, CardTitle} from 'reactstrap';
import React, {Component} from 'react';
import ErrorBoundary from './errorBoundary';
import PropTypes from 'prop-types';
import {addControl, toggleDisplayBanked, toggleMetric} from './actions/actions';
import {connect} from 'react-redux';
import loadable from '@loadable/component';
import '../static/controlsStyles.css';
import MediaQuery from 'react-responsive';
import DesktopControls from "./ui/desktopControls";
import MobileControls from "./ui/mobileControls";

const LoadableControlTable = loadable(() => import('./controlTable'),{
    fallback: <div>Failed to load ControlTable...</div>,
});

class ControlPoints extends Component {

    static propTypes = {
        metric: PropTypes.bool.isRequired,
        hasStravaData:PropTypes.bool.isRequired,
        name:PropTypes.string,
        addControl:PropTypes.func.isRequired,
        toggleMetric:PropTypes.func.isRequired,
        displayBanked:PropTypes.bool.isRequired,
        fetchingFromStrava:PropTypes.bool,
        toggleDisplayBanked:PropTypes.func.isRequired,
        stravaAnalysis: PropTypes.bool.isRequired,
        hasControls:PropTypes.bool.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {};
    }

    render () {
        let title;
        let table = (<div/>);
        if (this.props.name === '') {
            title = (<div id={'controlListTitle'}>Control point list</div>);
        } else {
            title = (<div id={'controlListTitle'}>Control point list for <i>{this.props.name}</i></div>);
        }
        if (this.props.name !== '' || this.props.hasControls) {
            table = (<LoadableControlTable/>);
        }
        return (
            <div className="controlPoints">
                <MediaQuery minDeviceWidth={1000}>
                    <DesktopControls/>
                </MediaQuery>
                <MediaQuery maxDeviceWidth={800}>
                    <MobileControls/>
                </MediaQuery>
                <ErrorBoundary>
                    <Card style={{margin: '10px'}}>
                        <CardBody>
                            <CardTitle className="cpListTitle" tag='h6'>{title}</CardTitle>
                            <ErrorBoundary>
                                {table}
                            </ErrorBoundary>
                        </CardBody>
                    </Card>
                </ErrorBoundary>
                <div tabIndex="98" onFocus={() => {
                    document.getElementById('addButton').focus()
                }}/>
            </div>
        );
    }
}

const mapStateToProps = (state) =>
    ({
        metric: state.controls.metric,
        hasControls: state.controls.count !== 0,
        calculatedValues: state.controls.calculatedValues,
        name: state.routeInfo.name,
        displayBanked: state.controls.displayBanked,
        stravaAnalysis: state.controls.stravaAnalysis,
        fetchingFromStrava: state.strava.fetching,
        hasStravaData: state.strava.activityData !== null
    });

const mapDispatchToProps = {
    toggleMetric, toggleDisplayBanked, addControl
};

export default connect(mapStateToProps, mapDispatchToProps)(ControlPoints);
