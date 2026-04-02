import { createContext, useReducer } from 'react';

export const AuthContext = createContext();

export const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_READY':
      return {
        user: action.payload,
        appLoading: false
      };

    case 'SIGNIN':
      return {
        user: action.payload,
        appLoading: false
      };

    case 'SIGNOUT':
      return {
        user: null,
        appLoading: false
      };

    default:
      return state;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    appLoading: true
  });

  return <AuthContext.Provider value={{ ...state, dispatch }}>{children}</AuthContext.Provider>;
};
