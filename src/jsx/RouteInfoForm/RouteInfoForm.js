import {Spinner} from '@blueprintjs/core';
import {Alert, Form, Card, CardBody, CardTitle, Col, Row, Container} from 'reactstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect } from 'react';
import ShortUrl from '../ShortUrl';
import MediaQuery from 'react-responsive';
import PropTypes from 'prop-types';
import {loadFromRideWithGps, saveCookie} from '../actions/actions';
import {connect} from 'react-redux';
import RideWithGpsId from './RideWithGpsId';
import RwGpsTypeSelector from './RwGpsTypeSelector';
import ForecastButton from './ForecastButton';
import AnalysisButton from './AnalysisButton';
import StravaDialog from './StravaDialog';
import WeatherProvider from '../ui/providerSelector';
import PinnedRouteLoader from './PinnedRouteLoader.jsx';
import ErrorBoundary from "../errorBoundary";
import { formatControlsForUrl } from '../../util';

const RouteInfoForm = ({ rwgpsRoute, rwgpsRouteIsTrip, controlPoints, fetchingRoute, errorDetails, routeInfo, loadFromRideWithGps, firstUse, routeSelected, needToViewTable, showProvider, routeProps }) => {
    const [showPinnedRoutes, setShowPinnedRoutes] = useState(false)

    useEffect(() => {
        if (rwgpsRoute !== '') {
            loadFromRideWithGps(rwgpsRoute, rwgpsRouteIsTrip);
        }
    }, [])

    useEffect(() => {
        if (rwgpsRoute !== '' && !routeSelected) {
            loadFromRideWithGps(rwgpsRoute,rwgpsRouteIsTrip);
        }
    }, [rwgpsRoute, routeSelected, rwgpsRouteIsTrip])
    
    useEffect(() => {
        if (routeProps != null && routeProps.history != null && needToViewTable) {
            routeProps.history.replace('/table/')
        }
    }, [routeProps, needToViewTable])

    useEffect(() => {
        if (routeInfo.name !== '') {
            document.title = `Forecast for ${routeInfo.name}`;
            if (!firstUse && controlPoints !== '' && controlPoints.length !== 0) {
                saveCookie(routeInfo.name, formatControlsForUrl(controlPoints));
            }
        }
    }, [routeInfo.name, firstUse, controlPoints])

    const header = (<div style={{textAlign:"center",'fontSize':'90%'}}>Load Route</div>);
    const providerButton = showProvider ? <Col sm={{ size: "auto" }}><WeatherProvider /></Col> : null;

    return (
        <div>
            <Card style={{borderTop: "none"}}>
                <CardBody>
                    <CardTitle className='dlgTitle' tag='h6'>{header}</CardTitle>
                    <Form inline id="forecast_form">
                        <Row>
                            <Col>
                                <div style={{display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    {showPinnedRoutes ? null : 
                                        <>
                                            <div style={{flex: 1, padding: "5px"}}><RideWithGpsId /></div>
                                            <div className="or-divider" style={{flex: 0.3, fontSize: "13px", textAlign: "center"}}>- OR -</div>
                                        </>
                                    }
                                    <ErrorBoundary>
                                        <div style={{flex: 1, padding: "5px"}}>
                                            <PinnedRouteLoader
                                                showPinnedRoutes={showPinnedRoutes}
                                                setShowPinnedRoutes={setShowPinnedRoutes}
                                            />
                                        </div>
                                    </ErrorBoundary>
                                    <RwGpsTypeSelector visible={false}/>
                                    {providerButton}
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <ForecastButton/>
                        </Row>
                        {errorDetails !== null && <Alert style={{ padding: '10px' }} color="danger">{errorDetails}</Alert>}
                        {fetchingRoute && <Spinner/>}
                    </Form>
                    <MediaQuery maxDeviceWidth={500}>
                        <div style={{marginTop: "10px", textAlign: "center"}}>
                            <ShortUrl/>
                        </div>
                    </MediaQuery>
                </CardBody>
            </Card>
            <MediaQuery minDeviceWidth={501}>
                <Container fluid={true}>
                    <Row className="justify-content-sm-between">
                        <Col>
                            <AnalysisButton/>
                            <StravaDialog/>
                        </Col>
                    </Row>
                </Container>
            </MediaQuery>
        </div>
    );
}

const mapStateToProps = (state) =>
    ({
        rwgpsRoute: state.uiInfo.routeParams.rwgpsRoute,
        rwgpsRouteIsTrip: state.uiInfo.routeParams.rwgpsRouteIsTrip,
        fetchingRoute: state.uiInfo.dialogParams.fetchingRoute,
        errorDetails:state.uiInfo.dialogParams.errorDetails,
        routeInfo:state.routeInfo,
        controlPoints:state.controls.userControlPoints,
        firstUse: state.params.newUserMode,
        routeSelected: state.uiInfo.dialogParams.loadingSource !== null,
        needToViewTable:state.forecast.valid && !state.forecast.tableViewed,
        showProvider:state.controls.showWeatherProvider,
    });

const mapDispatchToProps = {
    loadFromRideWithGps
};

RouteInfoForm.propTypes = {
    rwgpsRoute:PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.oneOf([''])
    ]),
    rwgpsRouteIsTrip: PropTypes.bool.isRequired,
    controlPoints:PropTypes.arrayOf(PropTypes.object).isRequired,
    fetchingRoute:PropTypes.bool,
    errorDetails:PropTypes.string,
    routeInfo:PropTypes.shape({name:PropTypes.string}),
    loadFromRideWithGps:PropTypes.func.isRequired,
    firstUse:PropTypes.bool.isRequired,
    routeSelected:PropTypes.bool.isRequired,
    needToViewTable: PropTypes.bool.isRequired,
    showProvider: PropTypes.bool.isRequired,
    routeProps:PropTypes.object
};

export default connect(mapStateToProps, mapDispatchToProps, null, {pure:true})(RouteInfoForm);
