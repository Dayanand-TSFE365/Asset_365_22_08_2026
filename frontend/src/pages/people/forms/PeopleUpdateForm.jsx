import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { API } from "../../../config/api";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function PeopleUpdateForm({ data }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const userId = data?.user_id;

  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);

  const [formData, setFormData] = useState({
    first_name: data?.full_name?.split(" ")[0] || "",
    last_name: data?.full_name?.split(" ").slice(1).join(" ") || "",
    employee_code: data?.employee_code || "",
    email: data?.email || "",
    phone: data?.phone || "",
    department: data?.department || "",
    designation: data?.designation || "",
    status: data?.status || "",
    login_enabled: data?.login_enabled ?? false,
    password: "",
    confirm_password: "",
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = sessionStorage.getItem("access_token");
        const res = await axios.get(API.GET_ROLES, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRoles(Array.isArray(res.data) ? res.data : res.data.results || []);
      } catch (err) {
        console.error("Failed to fetch roles:", err?.response?.data || err);
      }
    };

    fetchRoles();
  }, []);

  useEffect(() => {
    if (!data) {
      navigate("/people");
    }
  }, [data, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Employee ID not found");
      return;
    }

    if (formData.password && formData.password !== formData.confirm_password) {
      toast.error("Password and Confirm Password do not match");
      return;
    }

    try {
      setLoading(true);

      const token = sessionStorage.getItem("access_token");
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        employee_code: formData.employee_code,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        designation: formData.designation,
        status: formData.status,
        login_enabled: formData.login_enabled,
        password: formData.password || undefined,
        confirm_password: formData.confirm_password || undefined,
      };

      await axios.put(API.UPDATE_EMPLOYEE(userId), payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("Employee updated successfully!");
      navigate("/people");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to update employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, md: 3 }, bgcolor: "#f8fafc" }}>
        <Paper
          elevation={0}
          sx={{
            maxWidth: 980,
            mx: "auto",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <Box sx={{ px: 3, py: 2.25 }}>
            <Typography variant="h6" fontWeight={800}>Update Employee</Typography>
            <Typography variant="body2" color="text.secondary">
              Editing {formData.employee_code || "employee"}
            </Typography>
          </Box>

          <Divider />

          <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 1.5,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 700,
                color: "text.secondary",
              }}
            >
              Basic Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="First Name" name="first_name" value={formData.first_name} onChange={handleChange} required size="small" fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Last Name" name="last_name" value={formData.last_name} onChange={handleChange} required size="small" fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Employee Code" name="employee_code" value={formData.employee_code} onChange={handleChange} required size="small" fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Email" type="email" name="email" value={formData.email} onChange={handleChange} required size="small" fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Phone" name="phone" value={formData.phone} onChange={handleChange} size="small" fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  size="small"
                  select
                  fullWidth
                >
                  <MenuItem value=""><em>Select Department</em></MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.role_name || role.name}>
                      {role.role_name || role.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Designation" name="designation" value={formData.designation} onChange={handleChange} size="small" fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  size="small"
                  select
                  fullWidth
                >
                  <MenuItem value=""><em>Select Status</em></MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Login Enabled"
                  name="login_enabled"
                  value={String(formData.login_enabled)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, login_enabled: e.target.value === "true" }))}
                  size="small"
                  select
                  fullWidth
                >
                  <MenuItem value="true">Enabled</MenuItem>
                  <MenuItem value="false">Disabled</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 1.5,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 700,
                color: "text.secondary",
              }}
            >
              Update Password (Optional)
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  size="small"
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton edge="end" onClick={() => setShowPassword((v) => !v)}>
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Confirm Password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  type={showConfirmPassword ? "text" : "password"}
                  size="small"
                  fullWidth
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton edge="end" onClick={() => setShowConfirmPassword((v) => !v)}>
                          {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="outlined" onClick={() => navigate(-1)} disabled={loading}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={18} color="inherit" /> : "Update Employee"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
