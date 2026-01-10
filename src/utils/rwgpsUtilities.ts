import { RwgpsRoute, RwgpsTrip } from "../redux/routeInfoSlice";

export const loadRwgpsRoute = (route : string, isTrip : boolean, token? : string|null) => {
  return new Promise<RwgpsRoute|RwgpsTrip >((resolve, reject) => {
      let url = '/rwgps_route?route=' + route + '&trip=' + isTrip;
      if (token) {
        url += `&token=${token}`;
      }
      fetch(url).then(response => {
              if (response.status === 200) {
                  return response.json();
              }
          }
      ).then(response => {
          if (response === undefined) {
              reject(new Error("Private or non-existent Ride with GPS route"));
              return;
          }
          let rwgpsRouteDatum = response[response['trip'] === undefined ? 'route' : 'trip'];
          if (rwgpsRouteDatum === undefined) {
              reject(new Error('RWGPS route info unavailable'));
              return;
          }
          resolve(response);
      },
      error => {
          reject(error.message);
      });
  });
}