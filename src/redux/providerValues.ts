type ProviderValues = {
    [index:string]:any
}
export const providerValues : ProviderValues = {
    nws:{min_interval:1, max_days:7, canForecastPast:false, daysInPast:0, name:"National Weather Service", enabled:true},
    oneCall:{min_interval:0.25, max_days:5, canForecastPast:true, daysInPast:14, name:"OneCall", enabled:true},
    visualcrossing:{min_interval:0.25, max_days:14, canForecastPast:true, daysInPast:4, name:"Visual Crossing", enabled:true},
    weatherapi:{min_interval:1, max_days:10, canForecastPast:false, daysInPast:4, name:"WeatherAPI", enabled:true},
    weatherKit:{min_interval:0.25, max_days:8, canForecastPast:true, name:"Apple WeatherKit", enabled:true},
    climacell:{min_interval:0.25, max_days:4, canForecastPast:false, daysInPast:1, name:"Tomorrow.io", maxCallsPerHour:25, enabled:true},
    // meteomatics:{min_interval:1, max_days:10,canForecastPast:true, daysInPast:1, name:"Meteomatics"}
    }
export const defaultProvider = 'nws'
