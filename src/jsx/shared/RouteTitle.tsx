import { useMediaQuery } from "react-responsive";
import { useAppSelector } from "../../utils/hooks";

interface RouteTitleProps {
  style?: {}
  className? : string
}

export const RouteTitle = ({style, className}: RouteTitleProps) => {
  const titleFont = useMediaQuery({ query: '(min-width: 1300px)' }) ? "20px" : "15px"
  const routeName = useAppSelector(state => state.routeInfo.name || (state.strava.activityData && state.strava.activityData.name))

  return (
    <div className={className} style={{fontStyle: "oblique", color: "rgba(64, 111, 140, 0.87)", fontSize: titleFont, height: "60px", textAlign: "center", ...style}}>{routeName}</div>
  )
}
