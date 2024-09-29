import { paceSet } from "./routeParamsSlice";
import { useAppDispatch } from "../utils/hooks";
import { forecastInvalidated } from "./forecastSlice";
const dispatch = useAppDispatch()
type DispatchType = typeof dispatch

type abmtype = (reason?:any) => void
type abortMethodType = abmtype | null
let fetchAbortMethod : abortMethodType = null

const cancelForecast = () => {
    return function(dispatch : DispatchType) {
        const cancel : abortMethodType = fetchAbortMethod
        if (cancel !== null) {
            const cancelMethod : abmtype = cancel
            cancelMethod()
        }
        dispatch(forecastInvalidated())
    }
};

export const setPace = function (pace : string) {
    return function(dispatch : DispatchType) {
        dispatch(paceSet(pace))
        dispatch(cancelForecast())
    }
};
