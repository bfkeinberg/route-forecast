export const routeLoadingModes = {
  RWGPS: 1,
  STRAVA: 2,
  RUSA_PERM: 3
}

export enum RouteLoadingModes {
  RWGPS = 1,
  STRAVA = 2,
  RUSA_PERM = 3
}

export const routeLoadingModeProps = [
  {},
  {name:"Ride with GPS", key:routeLoadingModes.RWGPS},
  {name:"Strava", key:routeLoadingModes.STRAVA},
  {name:"RUSA perm id", key:routeLoadingModes.RUSA_PERM}
]