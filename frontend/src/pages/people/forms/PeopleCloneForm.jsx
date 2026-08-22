import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { API } from "../../../config/api";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
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

export default function PeopleCloneForm({ data }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roles, setRoles] = useState([]);

  const [form, setForm] = useState({
    first_name: data?.full_name?.split(" ")[0] || "",
    last_name: data?.full_name?.split(" ")?.slice(1)?.join(" ") || "",
    email: "",
    employee_code: "",
    department: data?.department || "",
    designation: data?.designation || "",
    phone: data?.phone || "",
    login_enabled: data?.login_enabled || false,
    password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.employee_code.trim() === data?.employee_code) {
      toast.error("Employee Code should not be same");
      return;
    }

    if (form.password !== form.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const token = sessionStorage.getItem("access_token");
      await axios.post(API.CREATE_EMPLOYEE, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("Employee cloned successfully");
      navigate("/people");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Clone failed");
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
            <Typography variant="h6" fontWeight={800}>Clone Employee</Typography>
            <Typography variant="body2" color="text.secondary">Create a new employee based on selected record</Typography>
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
                <TextField label="First Name" name="first_name" value={form.first_name} onChange={handleChange} required size="small" fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Last Name" name="last_name" value={form.last_name} onChange={handleChange} required size="small" fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Email" type="email" name="email" value={form.email} onChange={handleChange} required size="small" fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Employee Code"
                  name="employee_code"
                  value={form.employee_code}
                  onChange={handleChange}
                  required
                  size="small"
                  fullWidth
                  helperText={form.employee_code === data?.employee_code ? "Employee Code should not be same" : `Previous: ${data?.employee_code || "-"}`}
                  error={form.employee_code === data?.employee_code}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
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
                <TextField label="Designation" name="designation" value={form.designation} onChange={handleChange} size="small" fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Phone" name="phone" value={form.phone} onChange={handleChange} size="small" fullWidth />
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
              Login Access
            </Typography>

            <FormControlLabel
              control={<Checkbox name="login_enabled" checked={form.login_enabled} onChange={handleChange} />}
              label="Enable Login"
              sx={{ mb: 1.5 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  type={showPassword ? "text" : "password"}
                  required
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
                  value={form.confirm_password}
                  onChange={handleChange}
                  type={showConfirmPassword ? "text" : "password"}
                  required
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
              <Button variant="outlined" onClick={() => navigate("/people")} disabled={loading}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={18} color="inherit" /> : "Clone Employee"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
