import { useAppSelector } from "./hooks";
import { calculateWindResult } from "./routeHooks";

export const useForecastDependentValues = () => {
  const routeInfo = useAppSelector(state => state.routeInfo);
  const routeParams = useAppSelector(state => state.uiInfo.routeParams);
  const controls = useAppSelector(state => state.controls);
  const timeZoneId = routeParams.zone;
  const forecast = useAppSelector(state => state.forecast.forecast);
  const segment = useAppSelector(state => state.uiInfo.routeParams.segment);

  const windAdjustmentResult = calculateWindResult({ routeInfo, routeParams, controls, timeZoneId, forecast, segment });
  return windAdjustmentResult;
};
