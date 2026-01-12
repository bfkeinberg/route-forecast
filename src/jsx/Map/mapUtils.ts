import { Forecast } from '../../redux/forecastSlice';
import { milesToMeters } from '../../utils/util';

export const findMarkerInfo = (forecast: Array<Forecast> | null | undefined, subrange: [number, number] | []) => {
  if (!forecast || !forecast.length || !subrange || subrange.length !== 2) {
    return [] as Array<Forecast>;
  }
  return forecast.filter((point: any) => point && typeof point.distance === 'number' && Math.round(point.distance * milesToMeters) >= subrange[0] && Math.round(point.distance * milesToMeters) <= subrange[1]);
};

export const matchesSegment = (point: any, range: Array<number>) => {
  return ((point.dist === undefined) || (point.dist >= range[0] && point.dist <= range[1]));
}

export const getMapBounds = (points: Array<any>, bounds: {min_latitude:number, min_longitude:number, max_latitude:number, max_longitude:number}, zoomToRange: boolean, subrange: [number,number] | [], userSubrange: [number,number]) => {
  const defaultBounds = {north: bounds.max_latitude, south: bounds.min_latitude, east: bounds.max_longitude, west: bounds.min_longitude};
  const preferDefault = userSubrange[0] === userSubrange[1];
  if (preferDefault && subrange.length !== 2) {
    return defaultBounds;
  }
  const userBounds: any = new (global as any).google.maps.LatLngBounds();
  points.filter(point => matchesSegment(point, userSubrange)).forEach(point => (userBounds.extend(point)));
  if (zoomToRange && subrange.length === 2) {
    const segmentBounds: any = new (global as any).google.maps.LatLngBounds();
    points.filter(point => matchesSegment(point, subrange)).forEach(point => segmentBounds.extend(point));
    if (segmentBounds.isEmpty()) {
      return preferDefault ? defaultBounds : userBounds;
    }
    return segmentBounds;
  }
  return preferDefault ? defaultBounds : userBounds;
}

export const cvtDistance = (distanceStr: string, metric: boolean) => {
  const distance = Number.parseInt(distanceStr);
  return (metric ? ((distance * milesToMeters) / 1000).toFixed(0) : distanceStr);
}
