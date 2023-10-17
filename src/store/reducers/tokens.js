import { createSlice } from '@reduxjs/toolkit'

export const tokens = createSlice({
  name: 'tokens',
  initialState: {
    contracts: [],
    symbols: [],
    balances: [0, 0]
  },
  reducers: {
    setSymbols: (state, action) => {
      state.symbols = action.payload
    },
    balancesLoaded: (state, action) => {
      state.balances = action.payload
    }
  }
})

export const { setSymbols, balancesLoaded } = tokens.actions;

export default tokens.reducer;
