import { configureStore } from '@reduxjs/toolkit'

import provider from './reducers/provider'
import tokens from './reducers/tokens'
import aggregator from './reducers/aggregator'

export const store = configureStore({
  reducer: {
    provider,
    tokens,
    aggregator
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false
    })
})
