import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { API } from "../../../../config/api";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";

const safeArray = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.items)) return d.items;
  return [];
};

export default function AuditForm() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const asset = state?.data || {};

  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    location_id: asset.location_id || "",
    update_location: false,
    next_audit_date: asset.next_audit_date || "",
    notes: "",
    file: null,
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = sessionStorage.getItem("access_token");
        const res = await axios.get(API.GET_LOCATIONS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLocations(safeArray(res));
      } catch (error) {
        console.error("Failed to load locations:", error);
      }
    };

    fetchLocations();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox"
        ? checked
        : type === "file"
        ? files[0]
        : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = new FormData();
      payload.append("location_id", formData.location_id);
      payload.append("update_location", formData.update_location);
      payload.append("next_audit_date", formData.next_audit_date || "");
      payload.append("notes", formData.notes || "");

      if (formData.file) {
        payload.append("file", formData.file);
      }

      await axios.post(API.ASSET_AUDIT(asset.id), payload, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Asset audited successfully!");
      navigate("/assets");
    } catch (error) {
      console.error("Audit failed:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to audit asset.");
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        overflowY: "auto",
        bgcolor: "background.default",
        p: 3,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          maxWidth: 1000,
          mx: "auto",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h5" fontWeight={700}>
            Audit Asset
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {asset.asset_tag || asset.tag || "Unknown Asset"} •{" "}
            {asset.asset_name || asset.name || "Unnamed Asset"}
          </Typography>
        </Box>

        {/* Form */}
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Location */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Current Location</InputLabel>

                <Select
                  name="location_id"
                  value={formData.location_id}
                  label="Current Location"
                  onChange={handleChange}
                  MenuProps={{
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="">
                    Select Location
                  </MenuItem>

                  {locations.map((location) => (
                    <MenuItem
                      key={location.id}
                      value={String(location.id)}
                    >
                      {location.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Next Audit Date */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Next Audit Date"
                type="date"
                name="next_audit_date"
                value={formData.next_audit_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Checkbox */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="update_location"
                    checked={formData.update_location}
                    onChange={handleChange}
                  />
                }
                label="Update Asset Location"
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </Grid>

            {/* File Upload */}
            <Grid item xs={12}>
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{ mb: 1 }}
              >
                Upload Audit Image (Optional)
              </Typography>

              <Button
                variant="outlined"
                component="label"
              >
                Choose File
                <input
                  hidden
                  type="file"
                  name="file"
                  onChange={handleChange}
                />
              </Button>

              {formData.file && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {formData.file.name}
                </Typography>
              )}

              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 1 }}
              >
                Accepted: jpg, png, webp, gif, svg, avif
              </Typography>
            </Grid>
          </Grid>

          {/* Footer Buttons */}
          <Stack
            direction="row"
            spacing={2}
            sx={{
              mt: 4,
              pt: 3,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <Button
              type="submit"
              variant="contained"
              color="warning"
            >
              Submit Audit
            </Button>

            <Button
              variant="outlined"
              onClick={() => navigate("/assets")}
            >
              Return to All Assets
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
