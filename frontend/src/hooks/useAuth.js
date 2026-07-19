import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useState } from 'react';
import { loginUser, logout, fetchProfile } from '../store/slices/authSlice';

export function useAuth() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error, token } = useSelector(state => state.auth);
  const [localLoading, setLocalLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLocalLoading(true);
    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();
      setLocalLoading(false);
      return result;
    } catch (err) {
      setLocalLoading(false);
      throw err;
    }
  }, [dispatch]);

  const doLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const checkAuth = useCallback(async () => {
    if (token) {
      try {
        await dispatch(fetchProfile()).unwrap();
      } catch (e) {
        dispatch(logout());
      }
    }
  }, [dispatch, token]);

  return {
    user,
    isAuthenticated,
    loading: loading || localLoading,
    error,
    token,
    login,
    logout: doLogout,
    checkAuth,
  };
}
