# route-forecast
Web app to show forecasts and do general ride planning, using provided route data

[![Publish to Google app Engine](https://github.com/bfkeinberg/route-forecast/actions/workflows/main.yml/badge.svg)](https://github.com/bfkeinberg/route-forecast/actions/workflows/main.yml)

The flow is that you provide a route in Ride with GPS, either by pasting in the route id, dragging the url from the Ride with GPS page, or
using one of the routes that you have pinned on their site. 
Then you click on the happy blue forecast button and get the forecast for each hour (by default) for the location that 
you will be in at the time, determined by a combination of your hill adjusted speed and the terrain, and also by the effects of wind.
