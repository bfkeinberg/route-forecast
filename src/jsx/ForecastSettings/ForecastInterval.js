import { FormGroup } from "@blueprintjs/core";
import { Slider, Tooltip } from "@mui/material"
import PropTypes from 'prop-types';
import * as React from 'react';
import {connect} from 'react-redux';

import {setInterval} from "../../redux/actions";
import {useTranslation} from 'react-i18next'
import * as Sentry from "@sentry/react"

const ForecastInterval = ({min_interval,interval,setInterval}) => {
    const { t } = useTranslation()
    return (
        <FormGroup style={{flex: 1}} label={t('labels.interval')} labelFor="intervalRange">
            <Tooltip arrow placement='bottom' title={t('tooltips.interval')}>
                <Slider
                    value={interval}
                    step={0.25}
                    min={min_interval}
                    max={2.0}
                    id={'intervalRange'}
                    marks={[
                        { value: 0.25, label: '15' },
                        { value: 0.5, label: '30' },
                        { value: 0.75, label: '45' },
                        { value: 1, label: '60' },
                        { value: 1.25, label: '75' },
                        { value: 1.5, label: '90' },
                        { value: 1.75, label: '105' },
                        { value: 2.0, label: '120' }
                    ]}
                    valueLabelDisplay="off"
                    onChange={(event, selected) => {Sentry.metrics.gauge("interval", selected, {unit:"hour"}); setInterval(selected)}} />
            </Tooltip>
        </FormGroup>
    );
};

ForecastInterval.propTypes = {
    min_interval:PropTypes.number.isRequired,
    interval:PropTypes.number.isRequired,
    setInterval:PropTypes.func.isRequired
};

const mapStateToProps = (state) =>
    ({
        min_interval: state.uiInfo.routeParams.min_interval,
        interval: state.uiInfo.routeParams.interval
    });

const mapDispatchToProps = {
    setInterval
};

export default connect(mapStateToProps,mapDispatchToProps)(ForecastInterval);