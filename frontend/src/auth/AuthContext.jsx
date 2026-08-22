import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import { API } from "../config/api";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true)

  // ================= SESSION TIMER =================
  const IDLE_LIMIT = 5 * 60 * 1000; // 10 sec for testing (change to 15 * 60 * 1000 later)

  const [timeLeft, setTimeLeft] = useState(IDLE_LIMIT);
  const [sessionExpired, setSessionExpired] = useState(false);

  const timerRef = useRef(null);
  const intervalRef = useRef(null);
  const tokenExpiryTimerRef = useRef(null);
  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

  const clearTokenExpiryTimer = () => {
    clearTimeout(tokenExpiryTimerRef.current);
    tokenExpiryTimerRef.current = null;
  };

  const scheduleTokenExpiryLogout = (token) => {
    clearTokenExpiryTimer();
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      const expMs = (decoded?.exp || 0) * 1000;
      const msLeft = Math.max(expMs - Date.now() - 30000, 0);

      if (msLeft <= 0) {
        logoutUser();
        return;
      }

      tokenExpiryTimerRef.current = setTimeout(async () => {
        await refreshAccessToken();
      }, msLeft);
    } catch {
      // If token cannot be decoded, fail safe by logging out.
      logoutUser();
    }
  };

  const fetchUserProfile = async (user_id, token) => {
    try {
      const res = await axios.get(API.GET_MY_PROFILE(user_id), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return res.data;
    } catch (err) {
      console.error("Profile fetch failed", err);
      return null;
    }
  };

  const refreshAccessToken = async () => {
  const refreshToken = sessionStorage.getItem("refresh_token");

    if (!refreshToken) {
      logoutUser();
      return false;
    }

    try {
      const res = await axios.post(API.REFRESH, null, {
        params: {
          token: refreshToken,
        },
      });

      const { access_token } = res.data;

      sessionStorage.setItem("access_token", access_token);

      // Schedule next refresh/logout based on new token
      scheduleTokenExpiryLogout(access_token);

      return true;
    } catch (err) {
      console.error("Refresh token failed", err);

      logoutUser();

      return false;
    }
  };

  // ================= LOAD TOKEN =================
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("access_token");

    if (token) {
      scheduleTokenExpiryLogout(token);
    }

    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);

      // optional refresh profile on reload
      if (parsed?.user_id && token) {
        fetchUserProfile(parsed.user_id, token).then((profile) => {
          if (profile) {
            const merged = { ...parsed, ...profile };
            setUser(merged);
            sessionStorage.setItem("user", JSON.stringify(merged));
          }
        });
      }
    }

    setLoading(false); //  VERY IMPORTANT
  }, []);

  // ================= LOGOUT HELPER =================
  const logoutUser = async () => {
    await logout();
    window.location.href = "/login";
  };

  // ================= RESET TIMER =================
  const resetTimer = () => {
    if (!user) return;

    //  Disable timer for admin
    if (user.email === ADMIN_EMAIL) return;

    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);

    setSessionExpired(false);
    setTimeLeft(IDLE_LIMIT);

    // logout timer
    timerRef.current = setTimeout(() => {
      setSessionExpired(true);

      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);

      // logout after 3 sec warning
      setTimeout(() => {
        logoutUser();
      }, 3000);
    }, IDLE_LIMIT);

    // countdown timer
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  };

  // ================= ACTIVITY DETECTOR =================
  useEffect(() => {
    if (!user) return;

    //  Skip timer completely for admin
    if (user.email === ADMIN_EMAIL) return;

    const events = ["mousemove", "keydown", "click", "scroll"];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => window.addEventListener(event, handleActivity));

    resetTimer();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      );

      clearTimeout(timerRef.current);
      clearInterval(intervalRef.current);
    };
  }, [user]);

  // ===================== SIGNUP =====================
  const signup = async (email, password, contact, company) => {
    try {
      const res = await axios.post(API.SIGNUP, {
        email,
        password,
        contact_number: contact,
        company_name: company,
      });

      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.detail || "Signup failed",
      };
    }
  };

  // ===================== LOGIN =====================
  const login = async (email, password) => {
    try {
      const res = await axios.post(API.LOGIN, { email, password });

      const {
        access_token,
        refresh_token,
        role,
        permissions = [],
      } = res.data;

      const decoded = jwtDecode(access_token);
      // console.log("DECODED TOKEN:", decoded);

      sessionStorage.setItem("access_token", access_token);
      sessionStorage.setItem("refresh_token", refresh_token);
      sessionStorage.setItem("permissions", JSON.stringify(permissions));

      const baseUser = {
        user_id: decoded.user_id,
        email: decoded.sub,
        role: role,
        permissions: permissions,
      };

      sessionStorage.setItem("user", JSON.stringify(baseUser));
      setUser(baseUser);

      //  FETCH FULL PROFILE
      const profile = await fetchUserProfile(decoded.user_id, access_token);

      const fullUser = {
        ...baseUser,
        ...profile, //  adds full_name, profile_image, etc.
      };

      sessionStorage.setItem("user", JSON.stringify(fullUser));
      setUser(fullUser);
      setSessionExpired(false);

      scheduleTokenExpiryLogout(access_token);

      resetTimer();

      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.detail || "Login failed",
      };
    }
  };

  // ===================== LOGOUT =====================
  const logout = async () => {
    const refresh = sessionStorage.getItem("refresh_token");

    try {
      if (refresh) {
        await axios.post(API.LOGOUT, null, { params: { token: refresh } });
      }
    } catch {}

    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("permissions");
    sessionStorage.removeItem("user");

    clearTimeout(timerRef.current);
    clearInterval(intervalRef.current);
    clearTokenExpiryTimer();

    setUser(null);
  };

  // ===================== FORGOT PASSWORD =====================
  const forgotPassword = async (email) => {
    try {
      const res = await axios.post(API.FORGOT_PASSWORD, null, {
        params: { email },
        headers: {
          "Content-Type": "application/json",
        },
      });

      return { success: true, message: res.data.message };
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to send OTP";

      return { success: false, message: msg };
    }
  };

  // ===================== VERIFY OTP =====================
  const verifyOtp = async (email, otp) => {
    try {
      const res = await axios.post(API.VERIFY_OTP, { email, otp });

      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.detail || "OTP verification failed",
      };
    }
  };

  // ===================== RESET PASSWORD via OTP =====================
  const resetPasswordOtp = async (email, newPassword, confirmPassword) => {
    try {
      const res = await axios.post(
        API.RESET_PASSWORD_OTP,
        {
          email,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      return { success: true, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.detail
        ? err.response.data.detail.map((d) => d.msg).join(", ")
        : "Password reset failed";

      return { success: false, message: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        logout,
        forgotPassword,
        verifyOtp,
        resetPasswordOtp,
        timeLeft,
        sessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);