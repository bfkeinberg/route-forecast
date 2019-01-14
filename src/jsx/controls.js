import {Row, Col, Container, Input, Label, Card, CardBody, CardTitle} from 'reactstrap';
import {Button} from '@blueprintjs/core';
import React, {Component} from 'react';
import ErrorBoundary from './errorBoundary';
import PropTypes from 'prop-types';
import {addControl, toggleDisplayBanked, toggleMetric} from './actions/actions';
import {connect} from 'react-redux';
import FinishTime from './ui/finishTime';
import loadable from 'react-loadable';

const LoadableControlTable = loadable({
    loader: () => import(/* webpackChunkName: "ControlTable" */'./controlTable'),
    loading(props) {
        if (props.error) {
            return <div>Error loading control table!</div>;
        } else if (props.pastDelay) {
            return <div>Loading control table...</div>;
        } else {
            return null;
        }
    }
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
        this.addControl = this.addControl.bind(this);
        this.state = {};
    }

    addControl( ) {
        this.props.addControl();
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
                <Container fluid={true}>
                    <Row noGutters className="justify-content-sm-around">
                        <Col sm={{size:'auto'}}>
                            {/*<button type='button' class='pt-button pt-small pt-minimal pt-icon-add' tabIndex='10' onClick={this.addControl} id='addButton'><Icon icon="add"/>Add control point</button>*/}
                            <Button class={'pt-minimal'} tabIndex='10' onClick={this.addControl} id='addButton' icon={"add"}>Add control point</Button>
                            {/*<Button size='sm' tabIndex='10' onClick={this.addControl} id='addButton'><Icon icon="add"/>Add control point</Button>*/}
                        </Col>
                        <Col sm={{size:"auto"}}>
                            <FinishTime/>
                        </Col>
                        <Col sm={{size:"auto"}}>
                            <Label size='sm' for='metric' check>metric</Label>
                        </Col>
                        <Col sm={{size:"auto"}}>
                            <Input size='1' id='metric' type='checkbox' tabIndex='12' checked={this.props.metric} onChange={this.props.toggleMetric}/>
                        </Col>
                        <Col sm={{size:"auto"}}>
                            <Label for='banked' size="sm">Display banked time</Label>
                        </Col>
                        <Col sm={{size:"auto"}}>
                            <Input id='banked' type='checkbox' tabIndex='11' checked={this.props.displayBanked}
                                      onChange={this.props.toggleDisplayBanked}/>
                        </Col>
                    </Row>
                </Container>
                <ErrorBoundary>
                    <Card style={{margin:'10px'}}>
                        <CardBody>
                            <CardTitle className="cpListTitle" tag='h6'>{title}</CardTitle>
                            <ErrorBoundary>
                                {table}
                            </ErrorBoundary>
                        </CardBody>
                    </Card>
                </ErrorBoundary>
                <div tabIndex="98" onFocus={() => {document.getElementById('addButton').focus()}}/>
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
