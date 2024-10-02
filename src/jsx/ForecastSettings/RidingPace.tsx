import "./RidingPace.css"

import { Button, FormGroup, MenuItem } from "@blueprintjs/core";
import { Select, ItemRenderer } from "@blueprintjs/select";
import {connect, ConnectedProps} from 'react-redux';

import { saveCookie } from "../../utils/util";
import { setPace } from "../../redux/actions_";
import { useActualPace, useFormatSpeed } from '../../utils/hooks';
import { inputPaceToSpeed, metricPaceToSpeed, paceToSpeed } from '../../utils/util';
import { DesktopTooltip } from '../shared/DesktopTooltip';
import {useTranslation} from 'react-i18next'
import { milesToMeters } from '../../utils/util'
import { RootState } from "../app/topLevel";

type PropsFromRedux = ConnectedProps<typeof connector>

type PaceValue = {
    name:string
    number:number
}
interface PaceTable {
    imperialLikeAPenguin: {values:Array<PaceValue>, label:string}
}
interface PaceTable {
    metric: {values:Array<PaceValue>, label:string}
}
const paceValues : PaceTable = {
    imperialLikeAPenguin: {
        values: [
            {name: "Q", number: 3},
            {name: "R", number: 4},
            {name: "S", number: 5},
            {name: "T", number: 6},
            {name: "A", number: 10},
            {name: "A+", number: 11},
            {name: "B", number: 12},
            {name: "B+", number: 13},
            {name: "C", number: 14},
            {name: "C+", number: 15},
            {name: "D", number: 16},
            {name: "D+", number: 17},
            {name: "E", number: 18},
            {name: "E+", number: 19},
            {name: "F", number: 20},
            {name: "F+", number: 21}
        ],
        label: "mph"
    },
    metric: {
        values: [
            {name: "Q", number: 5},
            {name: "R", number: 6},
            {name: "S", number: 8},
            {name: "T", number: 10},
            {name: "A", number: 16},
            {name: "A+", number: 18},
            {name: "B", number: 19},
            {name: "B+", number: 21},
            {name: "C", number: 22},
            {name: "C+", number: 24},
            {name: "D", number: 26},
            {name: "D+", number: 27},
            {name: "E", number: 29},
            {name: "E+", number: 31},
            {name: "F", number: 32},
            {name: "F+", number: 34}

        ],
        label: "kph"
    }
}

const getAlphaPace = function(pace : number) {
    let alpha : string | undefined = 'A';     // default
    alpha = Object.keys(paceToSpeed).reverse().find(value => {
        return (pace >= paceToSpeed[value])});
    return alpha?alpha:'A';
};

const getPaceTooltipId = function(realPace : number, predictedPace : number) {
    if (realPace < predictedPace) {
        return 'red-tooltip';
    } else {
        return 'green-tooltip';
    }
};

const correctPaceValue = (paceAlpha : string, setPace : (pace:string) => void) : string => {
    let paceNumeric = paceToSpeed[paceAlpha];
    if (paceNumeric === undefined) {
        paceNumeric = inputPaceToSpeed[paceAlpha];
        let pace = getAlphaPace(paceNumeric);
        setPace(pace);
        return pace;
    } else {
        return paceAlpha;
    }
}

interface Pace {
    name: string
    number: number
}

const renderPaceImperial : ItemRenderer<Pace> = (pace, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
        return null;
    }
    return (
        <MenuItem
            active={modifiers.active}
            key={pace.number}
            onClick={handleClick}
            text={`${pace.number} mph`}
        />
    );
};

const renderPaceMetric : ItemRenderer<Pace> = (pace, { handleClick, modifiers }) => {
    if (!modifiers.matchesPredicate) {
        return null;
    }
    return (
        <MenuItem
            active={modifiers.active}
            key={pace.number}
            onClick={handleClick}
            text={`${pace.number} kph`}
        />
    );
};

const RidingPace = ({ pace, setPace, metric } : PropsFromRedux) => {
    const { t } = useTranslation()
    const actualPace = useActualPace()
    
    // convert mph to kph if we are using metric
    const cvtMilesToKm = (distance : number) => {
        return metric ? ((distance * milesToMeters) / 1000) : distance;
    };

    const formatSpeed = useFormatSpeed()

    pace = correctPaceValue(pace, setPace);
    let pace_text;
    let pace_tooltip_class = 'pace_tooltip';
    const selectedSpeed = metric ? metricPaceToSpeed[pace] : paceToSpeed[pace];
    if (actualPace === null || actualPace === 0) {
        pace_text = t('tooltips.ridingPace')
    } else {

        pace_tooltip_class = getPaceTooltipId(cvtMilesToKm(actualPace),selectedSpeed);
        pace_text = `${t('tooltips.actualPace')} ${getAlphaPace(Math.round(actualPace))} (${formatSpeed(actualPace)})`;
    }

    const dropdownValues = metric ? paceValues.metric : paceValues.imperialLikeAPenguin
    return (
        <DesktopTooltip content={pace_text} className={pace_tooltip_class}>
            <FormGroup style={{ flex: 3, fontSize: "90%" }} label={<span><b>{t('labels.ridingPace')}</b></span>} labelFor={'paceInput'}>
                <Select
                    items={dropdownValues.values}
                    itemsEqual={"number"}
                    itemRenderer={metric ? renderPaceMetric : renderPaceImperial}
                    filterable={false}
                    fill={true}
                    activeItem={{ name: pace, number: selectedSpeed }}
                    onItemSelect={(selected) => { saveCookie("pace", selected.name); setPace(selected.name) }}
                >
                    <Button id={'paceInput'} text={selectedSpeed + " " + dropdownValues.label} rightIcon="symbol-triangle-down" />
                </Select>
            </FormGroup>
        </DesktopTooltip>
    );
};

const mapStateToProps = (state : RootState) =>
    ({
        pace: state.uiInfo.routeParams.pace,
        metric: state.controls.metric
    });

const mapDispatchToProps = {
    setPace
};

const connector = connect(mapStateToProps,mapDispatchToProps)
export default connector(RidingPace);
