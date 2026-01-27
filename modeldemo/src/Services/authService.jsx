import api from "./api";

const AuthService = {
  /* ===============================
     LOGIN
     Backend: POST /api/auth/login
     =============================== */
  async login(email, password) {
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const response = await api.post("/api/auth/login", formData);

      if (!response.data?.access_token) {
        return { success: false, error: "No token received from server" };
      }

      // ✅ SINGLE SOURCE OF TRUTH
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("role", response.data.role || "");

      return {
        success: true,
        token: response.data.access_token,
        role: response.data.role
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          "Login failed"
      };
    }
  },

  /* ===============================
     SIGNUP
     Backend: POST /api/auth/signup
     =============================== */
  async signup(payload) {
    try {
      const response = await api.post("/api/auth/signup", payload);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error:
          error.response?.data?.detail ||
          error.response?.data?.message ||
          error.message ||
          "Signup failed"
      };
    }
  },

  /* ===============================
     LOGOUT
     Backend: POST /auth/logout
     =============================== */
  async logout() {
    try {
      // Token auto-attached via interceptor
      await api.post("/auth/logout");
    } catch {
      console.warn("Logout API failed, clearing local session");
    } finally {
      this.clearSession();
    }

    return { success: true };
  },

  /* ===============================
     AUTH HELPERS
     =============================== */
  isAuthenticated() {
    return !!localStorage.getItem("token");
  },

  getUserRole() {
    return localStorage.getItem("role");
  },

  getToken() {
    return localStorage.getItem("token");
  },

  clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userData");
    localStorage.removeItem("refreshToken");
  }
};

export default AuthService;
