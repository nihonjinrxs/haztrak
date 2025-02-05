/**
 * A user's RcraProfile slice encapsulates our logic related what actions and data a user
 * has access to for each EPA site ID.
 */
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { ProfileEpaSite, RcraProfileState } from 'types/store';
import { RootState } from 'store';

/**
 * initial, empty, state of a user's RcraProfile.
 */
const initialState: RcraProfileState = {
  user: undefined,
  rcraAPIID: undefined,
  rcraUsername: undefined,
  epaSites: {},
  phoneNumber: undefined,
  apiUser: false,
  loading: false,
  error: undefined,
};

/**
 * Interface of the haztrak server response,
 *
 * Notice we convert the array of site objects to an object where each key is ID number of the
 * site. This avoids looping through the array every time we need site information.
 */
interface RcraProfileResponse {
  user: undefined;
  rcraAPIID: undefined;
  rcraUsername: undefined;
  epaSites?: Array<ProfileEpaSite>;
  phoneNumber: undefined;
  apiUser: boolean;
  loading: false;
  error: undefined;
}

/**
 * Retrieves a user's RcraProfile from the server.
 */
export const getProfile = createAsyncThunk<RcraProfileState>(
  'rcraProfile/getProfile',
  async (arg, thunkAPI) => {
    const state = thunkAPI.getState() as RootState;
    const username = state.user.user;
    const response = await axios.get(
      `${process.env.REACT_APP_HT_API_URL}/api/trak/profile/${username}`
    );
    const { epaSites, ...rest } = response.data as RcraProfileResponse;
    let profile: RcraProfileState = { ...rest };
    profile.epaSites = epaSites?.reduce(
      (obj, site) => ({
        ...obj,
        [site.epaId]: site,
      }),
      {}
    );
    return profile;
  }
);

const rcraProfileSlice = createSlice({
  name: 'rcraProfile',
  initialState,
  reducers: {
    updateProfile: (state: RcraProfileState, action: PayloadAction<RcraProfileState>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getProfile.pending, (state) => {
        return {
          ...state,
          loading: true,
          error: undefined,
        };
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        return {
          ...state,
          ...action.payload,
          loading: false,
          error: undefined,
        };
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        // Todo: remove ts-ignore
        // @ts-ignore
        state.error = action.payload.error;
        return state;
      });
  },
});

export default rcraProfileSlice.reducer;
export const { updateProfile } = rcraProfileSlice.actions;
