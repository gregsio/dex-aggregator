import { createSlice } from "@reduxjs/toolkit";

export const aggregator = createSlice({
  name: "aggregator",
  initialState: {
    contract: null,
    swaps: [],
    swapping: {
      isSwapping: false,
      isSuccess: false,
      transactionHash: null,
    },
  },
  reducers: {
    // setSwapsLoaded: (state, action) => {
    //   state.swaps = action.payload
    // },
    setIsSwapping: (state, action) => {
      state.swapping.isSwapping = true;
      state.swapping.isSuccess = false;
      state.swapping.transactionHash = null;
    },
    setSwapSuccess: (state, action) => {
      state.swapping.isSwapping = false;
      state.swapping.isSuccess = true;
      state.swapping.transactionHash = action.payload;
    },
    setSwapFail: (state, action) => {
      state.swapping.isSwapping = false;
      state.swapping.isSuccess = false;
      state.swapping.transactionHash = null;
    },
  },
});

export const {
  // setswapsLoaded,
  setIsSwapping,
  setSwapSuccess,
  setSwapFail,
} = aggregator.actions;

export default aggregator.reducer;
