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
  {name:"Ride with GPS route or trip", key:routeLoadingModes.RWGPS},
  {name:"Strava route or activity", key:routeLoadingModes.STRAVA},
  {name:"RUSA permanent id", key:routeLoadingModes.RUSA_PERM}
]