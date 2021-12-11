const formatOneControl = (controlPoint) => {
  if (typeof controlPoint === 'string') {
      return controlPoint;
  }
  return controlPoint.name + "," + controlPoint.distance + "," + controlPoint.duration;
}

export const formatControlsForUrl = (controlPoints) => {
  return controlPoints.reduce((queryParam,point) => {return formatOneControl(queryParam) + ':' + formatOneControl(point)},'');
};