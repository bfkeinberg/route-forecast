import { paceSet } from "./routeParamsSlice";
import { forecastInvalidated } from "./forecastSlice";
import { initialStartTimeSet } from "./routeParamsSlice";
import type { Dispatch, Action } from "redux";

type abmtype = (reason?:any) => void
type abortMethodType = abmtype | null
let fetchAbortMethod : abortMethodType = null

const cancelForecast = () => {
    return function(dispatch : Dispatch<Action<"forecast/forecastInvalidated">>) {
        const cancel : abortMethodType = fetchAbortMethod
        if (cancel !== null) {
            const cancelMethod : abmtype = cancel
            cancelMethod()
        }
        dispatch(forecastInvalidated())
    }
}

export const setPace = function (pace : string) {
    return function(dispatch : Dispatch<Action<string>>) {
        dispatch(paceSet(pace));
        cancelForecast()(dispatch)
    }
}

export const setTimeFromIso = (startAsIso : string, zone : string) => {
    return function(dispatch : Dispatch<Action<string>>) {
        dispatch(initialStartTimeSet({start:startAsIso,zone:zone}))
        dispatch(forecastInvalidated())
    }
}

