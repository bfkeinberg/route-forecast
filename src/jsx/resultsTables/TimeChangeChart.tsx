// @ts-ignore 
import { largestTriangleThreeBucket } from 'd3fc-sample';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Tooltip, Legend, Line, CartesianGrid } from 'recharts';
import type { ChartDataType, ChartData } from 'utils/gpxParser';

export const TimeChangeChart = (chartData: ChartDataType, metric: boolean) => {
    const desiredDataSize = 250;
    const sampler = largestTriangleThreeBucket();
    sampler.x((d: ChartData) => d.distanceInKm)
        .y((d: ChartData) => d.totalMinutesLost);
    sampler.bucketSize(Math.max(chartData.length / desiredDataSize, 5));

    const sampledData = sampler(chartData);
    const kmToMiles = 0.62137;

    const formatDistance = (value: number, isMetric: boolean) => isMetric ? value.toFixed(0): (value * kmToMiles).toFixed(0);
    const formatTipDistance = (value: number, isMetric: boolean) => isMetric ? value.toFixed(0) + " km": (value * kmToMiles).toFixed(0) + " miles";
    const formatWindSpeed = (speed: number, isMetric: boolean) => isMetric ? (speed/kmToMiles).toFixed(0) : speed.toFixed(0)
    const formatTooltipValue = (value: number, name: string, isMetric: boolean) => 
        (name === 'totalMinutesLost') ? value.toFixed(0) : isMetric ? [(value / kmToMiles).toFixed(0), "windSpeedKph"] : [value.toFixed(0), "windSpeedMph"]

    return <ResponsiveContainer width="100%" height={"100%"} minWidth={550} minHeight={250} /* maxHeight={400} */>
        <LineChart
            width={550} height={250} data={sampledData}
            margin={{
                top: 30,
                right: 35,
                left: 30,
                bottom: 30,
            }}
        >
            <XAxis dataKey="distanceInKm" type={'number'} unit={metric ? " km" : " miles"} tickFormatter={(value: number) => formatDistance(value, metric)} domain={[0, 'dataMax']} />
            <YAxis dataKey="totalMinutesLost" unit=" mins" />
            <YAxis dataKey="windSpeedMph" type="number" unit={metric?" kph":" mph"} yAxisId="right" orientation="right" 
                domain={['dataMin', 'dataMax']} tickFormatter={(value:number) => `${value > 0 ? '+':''}${formatWindSpeed(value, metric)}`}/>
            <Tooltip labelFormatter={(value: number) => formatTipDistance(value, metric)} formatter={(value: number, name: string) => formatTooltipValue(value, name, metric)} />
            <Legend />
            <Line type="monotone" dataKey="totalMinutesLost" dot={false} />
            <Line type="monotone" yAxisId={'right'} dataKey="windSpeedMph" stroke={"#32a852"} dot={false} name={metric?"windSpeedKph":"windSpeedMph"}/>
            <CartesianGrid strokeDasharray="2 2" />
        </LineChart>
    </ResponsiveContainer>
}
