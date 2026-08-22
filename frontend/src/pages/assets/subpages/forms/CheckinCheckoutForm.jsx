import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from "react-hot-toast";
import { API } from '../../../../config/api';
import {
  Box,
  Paper,
  Grid,
  Stack,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";

export default function CheckinCheckout() {
  const { type } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const asset = state?.data || {};
  const isCheckin = type === 'checkin';
  const isCheckout = type === 'checkout';

  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    user_id: '',
    location_id: '',
    checkout_date: new Date().toISOString().split('T')[0],
    checkin_date: new Date().toISOString().split('T')[0],
    expected_checkin_date: '',
    notes: '',
  });

  useEffect(() => {
    if (!isCheckin && !isCheckout) return;

    const fetchMasterData = async () => {
      try {
        const token = sessionStorage.getItem('access_token');
        const headers = { Authorization: `Bearer ${token}` };

        const requests = [];
        if (isCheckout) requests.push(axios.get(API.GET_USERS, { headers }));
        if (isCheckin) requests.push(axios.get(API.GET_LOCATIONS, { headers }));

        const responses = await Promise.all(requests);

        if (isCheckout) {
          setUsers(Array.isArray(responses[0]?.data) ? responses[0].data : []);
        }

        if (isCheckin) {
          const locationResponse = responses[0];
          setLocations(Array.isArray(locationResponse?.data) ? locationResponse.data : []);
        }
      } catch (error) {
        console.error('Failed to fetch dropdown data:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchMasterData();
  }, [isCheckin, isCheckout]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = sessionStorage.getItem('access_token');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      if (!asset.id) {
        toast.error('Asset ID not found.');
        return;
      }

      if (isCheckout) {
        const payload = {
          user_id: Number(formData.user_id),
          checkout_date: formData.checkout_date,
          expected_checkin_date: formData.expected_checkin_date || null,
          notes: formData.notes || '',
        };

        await axios.put(API.ASSET_CHECKOUT(asset.id), payload, { headers });
        toast.success('Asset checked out successfully!');
      }

      if (isCheckin) {
        const payload = {
          location_id: Number(formData.location_id),
          checkin_date: formData.checkin_date,
          notes: formData.notes || '',
        };

        await axios.put(API.ASSET_CHECKIN(asset.id), payload, { headers });
        toast.success('Asset checked in successfully!');
      }

      navigate('/assets');
    } catch (error) {
      console.error('Action failed:', error?.response?.data || error);
      toast.error(
        error?.response?.data?.detail
          ? JSON.stringify(error.response.data.detail, null, 2)
          : `Failed to ${type} asset.`
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isCheckin && !isCheckout) {
    return (
      <div className="p-6 text-red-600 dark:text-red-400 font-semibold">
        Invalid action type.
      </div>
    );
  }

  return (
  <Box
    sx={{
      height: "100%",
      overflowY: "auto",
      p: 3,
      bgcolor: "background.default",
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
          py: 2.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="h5" fontWeight={700}>
          {isCheckin ? "Check In Asset" : "Check Out Asset"}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          {asset.tag} • {asset.name || "Unnamed Asset"}
        </Typography>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 3 }}
      >
        {/* Asset Details */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ReadOnlyField
              label="Asset Tag"
              value={asset.tag || "-"}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ReadOnlyField
              label="Asset Name"
              value={asset.name || "-"}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ReadOnlyField
              label="Model"
              value={asset.model || "-"}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ReadOnlyField
              label="Current Location"
              value={asset.location || "-"}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ReadOnlyField
              label="Current Status"
              value={asset.status || "-"}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ReadOnlyField
              label="Assigned To"
              value={asset.user || "Not Assigned"}
            />
          </Grid>
        </Grid>

        {/* Checkout Fields */}
        {isCheckout && (
          <Grid
            container
            spacing={3}
            sx={{ mt: 1 }}
          >
            <Grid item xs={12} md={6}>
              <SelectField
                label="Select User"
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                required
                disabled={fetching}
                options={users}
                placeholder="Choose a user"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <InputField
                label="Checkout Date"
                type="date"
                name="checkout_date"
                value={formData.checkout_date}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <InputField
                label="Expected Checkin Date"
                type="date"
                name="expected_checkin_date"
                value={formData.expected_checkin_date}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        )}

        {/* Checkin Fields */}
        {isCheckin && (
          <Grid
            container
            spacing={3}
            sx={{ mt: 1 }}
          >
            <Grid item xs={12} md={6}>
              <SelectField
                label="Checkin Location"
                name="location_id"
                value={formData.location_id}
                onChange={handleChange}
                required
                disabled={fetching}
                options={locations}
                placeholder="Choose a location"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <InputField
                label="Checkin Date"
                type="date"
                name="checkin_date"
                value={formData.checkin_date}
                onChange={handleChange}
                required
              />
            </Grid>
          </Grid>
        )}

        {/* Notes */}
        <Box sx={{ mt: 4 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder={`Add ${
              isCheckin ? "checkin" : "checkout"
            } notes...`}
          />
        </Box>

        {/* Buttons */}
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
            disabled={loading}
          >
            {loading
              ? isCheckin
                ? "Checking In..."
                : "Checking Out..."
              : isCheckin
              ? "Check In Asset"
              : "Check Out Asset"}
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate("/assets")}
          >
            Cancel
          </Button>
        </Stack>
      </Box>
    </Paper>
  </Box>
);
}

function ReadOnlyField({ label, value }) {
  return (
    <TextField
      fullWidth
      label={label}
      value={value}
      InputProps={{
        readOnly: true,
      }}
    />
  );
}

function InputField({ label, ...props }) {
  return (
    <TextField
      fullWidth
      label={label}
      {...props}
      InputLabelProps={
        props.type === "date"
          ? { shrink: true }
          : undefined
      }
    />
  );
}

function SelectField({
  label,
  options = [],
  placeholder,
  ...props
}) {
  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>

      <Select
        {...props}
        label={label}
        MenuProps={{
          disablePortal: true,
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "left",
          },
          transformOrigin: {
            vertical: "top",
            horizontal: "left",
          },
        }}
      >
        <MenuItem value="">
          {placeholder || "Select an option"}
        </MenuItem>

        {options.map((option) => (
          <MenuItem
            key={option.id}
            value={option.id}
          >
            {option.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
