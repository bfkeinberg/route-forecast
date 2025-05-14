import { Card, Elevation } from '@blueprintjs/core';
// @ts-ignore 
import { largestTriangleThreeBucket } from 'd3fc-sample';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, Legend, Line, CartesianGrid } from 'recharts';
import type { ChartDataType, ChartData } from 'utils/gpxParser';

export const TimeChangeChart = ({ chartData, metric }: { chartData: ChartDataType; metric: boolean; }) => {
  const desiredDataSize = 250;
  const sampler = largestTriangleThreeBucket();
  sampler.x((d: ChartData) => d.distanceInKm)
    .y((d: ChartData) => d.totalMinutesLost);
  sampler.bucketSize(Math.max(chartData.length / desiredDataSize, 5));

  const sampledData = sampler(chartData);
  const kmToMiles = 0.62137;

  const formatDistance = (value: number, isMetric: boolean) => isMetric ? value.toFixed(0) : (value * kmToMiles).toFixed(0);

  return (
    <Card interactive={true} elevation={Elevation.THREE}>
      <ResponsiveContainer width="100%" height={"100%"} minWidth={525} minHeight={250} maxHeight={400}>
        <LineChart
          width={525} height={250} data={sampledData}
        >
          <XAxis dataKey="distanceInKm" type={'number'} unit={metric ? " km" : " miles"} tickFormatter={(value: number) => formatDistance(value, metric)} domain={[0, 'dataMax']} />
          <YAxis dataKey="totalMinutesLost" unit=" mins" />
          <Tooltip labelFormatter={(value: number) => formatDistance(value, metric)} formatter={(value: number) => value.toFixed(0)} />
          <Legend />
          <Line type="monotone" dataKey="totalMinutesLost" dot={false} />
          <CartesianGrid strokeDasharray="2 2" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
