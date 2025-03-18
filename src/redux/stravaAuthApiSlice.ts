import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const stravaAuthApiSlice = createApi({
    reducerPath:'stravaAuth',
    baseQuery: fetchBaseQuery({
        baseUrl: '/',
    }),
    endpoints: build => ({
        stravaAuth: build.query({
            query: (state) => ({
                url: `stravaAuthReq?state=${state}`
            }
            )
        }),
        refreshStravaToken: build.query({
            query: (refreshToken) => ({
                url: `refreshStravaToken?refreshToken=${refreshToken}`
            }
            )
        })
    })
})

export const {useStravaAuthQuery, useRefreshStravaTokenQuery} = stravaAuthApiSlice