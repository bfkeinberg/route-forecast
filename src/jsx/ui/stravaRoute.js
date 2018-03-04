import React from 'react';
import PropTypes from 'prop-types';
import {Label, Input, FormGroup} from 'reactstrap';
import {connect} from 'react-redux';
import {setStravaActivity, updateExpectedTimes} from "../actions/actions";

const StravaRoute = ({stravaAnalysis,setStravaActivity,strava_activity,updateExpectedTimes}) => {
    return (
        <FormGroup style={{display:stravaAnalysis?'inline-flex':'none'}}>
            <Label style={{display:'inline-flex'}}>
`            <Input tabIndex='-1' type="text" style={{display:'inline-flex'}}
                         onDrop={event => {
                             let dt = event.dataTransfer;
                             if (dt.items) {
                                 for (let i=0;i < dt.items.length;i++) {
                                     if (dt.items[i].kind === 'string') {
                                         event.preventDefault();
                                         dt.items[i].getAsString(value => {
                                             setStravaActivity(value);
                                             if (strava_activity !== ' ') {
                                                 updateExpectedTimes(strava_activity);
                                             }
                                         });
                                     } else {
                                         console.log('vetoing drop of',i,dt.items[i].kind);
                                         return false;
                                     }
                                 }
                             }
                         }}
                         onDragOver={event => {
                             event.preventDefault();
                             event.dataTransfer.dropEffect = 'move';
                         }}
                         onDragEnd={event => {
                             let dt = event.dataTransfer;
                             if (dt.items) {
                                 // Use DataTransferItemList interface to remove the drag data
                                 for (let i = 0;i < dt.items.length;i++) {
                                     dt.items.remove(i);
                                 }
                             }
                         }}
                         value={strava_activity} onChange={event => {setStravaActivity(event.target.value)}}
                         onBlur={() => {if (strava_activity !== ' ') {updateExpectedTimes(strava_activity)}}}/>`
                Strava</Label>
        </FormGroup>
    );
};

StravaRoute.propTypes = {
    stravaAnalysis:PropTypes.bool.isRequired,
    strava_activity:PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.oneOf([''])
    ]).isRequired,
    setStravaActivity:PropTypes.func.isRequired,
    updateExpectedTimes:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        stravaAnalysis: state.controls.stravaAnalysis,
        strava_activity: state.strava.activity
    });

const mapDispatchToProps = {
    setStravaActivity, updateExpectedTimes
};

export default connect(mapStateToProps,mapDispatchToProps)(StravaRoute);
