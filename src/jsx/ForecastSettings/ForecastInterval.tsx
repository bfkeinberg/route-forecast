import { FormGroup } from "@blueprintjs/core";
import { Slider, Tooltip } from "@mui/material"
import {connect, ConnectedProps} from 'react-redux';
import { RootState } from "../app/topLevel";
import {setInterval} from "../../redux/actions";
import {useTranslation} from 'react-i18next'

type PropsFromRedux = ConnectedProps<typeof connector>

const ForecastInterval = (props: PropsFromRedux) => {
    const { t } = useTranslation()
    return (
        <FormGroup style={{flex: 1}} label={t('labels.interval')} labelFor="intervalRange">
            <Tooltip arrow placement='bottom' title={t('tooltips.interval')}>
                <Slider
                    value={props.interval}
                    step={0.25}
                    min={props.min_interval}
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
                    // TODO: GA event for interval here
                    onChange={(event, selected) => {props.setInterval(selected)}} />
            </Tooltip>
        </FormGroup>
    );
};

const mapStateToProps = (state : RootState) =>
    ({
        min_interval: state.uiInfo.routeParams.min_interval,
        interval: state.uiInfo.routeParams.interval
    });

const mapDispatchToProps = {
    setInterval
}

const connector = connect(mapStateToProps,mapDispatchToProps)
export default connector(ForecastInterval)