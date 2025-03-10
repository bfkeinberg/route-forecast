import React from 'react';
import { AdvancedMarker, CollisionBehavior, useApiIsLoaded } from '@vis.gl/react-google-maps';

interface SafeAdvancedMarkerProps {
    children?: React.ReactNode;
    position: google.maps.LatLngLiteral;
    title?: string;
    zIndex?: number;
    collisionBehavior?: CollisionBehavior;
    onMouseEnter?: (event: google.maps.MapMouseEvent['domEvent']) => void;
    onMouseLeave?: (event: google.maps.MapMouseEvent['domEvent']) => void;
    onClick?: (event: google.maps.MapMouseEvent) => void;
}

const SafeAdvancedMarker = (props : SafeAdvancedMarkerProps) => {
  const apiIsLoaded = useApiIsLoaded();
  if (!apiIsLoaded) {
    return null;
  }
  return <AdvancedMarker {...props} />;
};

export default SafeAdvancedMarker;