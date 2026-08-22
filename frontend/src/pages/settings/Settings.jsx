//src\pages\settings\Setting.jsx — MUI version (all functionality preserved)
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  User, Pencil, Package, Lock, Camera,
  Phone, Building2, BadgeCheck, Briefcase,
  CalendarDays, ShieldCheck, Eye, EyeOff,
  Save, KeyRound, Layers, Cpu, FlaskConical,
  FileKey, CheckCircle2, XCircle, Loader2,
  Tag, Hash,
} from "lucide-react";
import { API } from "../../config/api";
import { useAuth } from "../../auth/AuthContext";

import {
  Box, Typography, Avatar, Chip, Divider,
  Grid, Paper, Button, IconButton, TextField,
  InputAdornment, CircularProgress,
  List, ListItemButton, ListItemIcon, ListItemText,
} from "@mui/material";

import {
  PersonOutlined as PersonIcon,
  EditOutlined as EditIcon,
  InventoryOutlined as InventoryIcon,
  LockOutlined as LockIcon,
  VisibilityOutlined as EyeOnIcon,
  VisibilityOffOutlined as EyeOffIcon,
  SaveOutlined as SaveIcon,
  CheckCircleOutlined as CheckCircleIcon,
  CancelOutlined as CancelIcon,
  CameraAltOutlined as CameraIcon,
  ShieldOutlined as ShieldIcon,
  VpnKeyOutlined as KeyIcon,
  MemoryOutlined as MemIcon,
  LayersOutlined as LayersIcon,
  ScienceOutlined as ScienceIcon,
  StyleOutlined as StyleIcon,
  TagOutlined as TagIcon,
} from "@mui/icons-material";

// ─── CONFIG ───────────────────────────────────────────────────

const TABS = [
  { key: "profile",  label: "Profile Info",    LIcon: PersonIcon   },
  { key: "edit",     label: "Edit Profile",    LIcon: EditIcon     },
  // { key: "assets",   label: "Assigned Items",  LIcon: InventoryIcon},
  { key: "password", label: "Change Password", LIcon: LockIcon     },
];

const ITEM_CATEGORIES = ["assets", "accessories", "components", "consumables", "licenses"];

const categoryConfig = {
  assets:      { label: "Assets",      color: "#6366f1", bg: "#eef2ff",  Icon: Package    },
  accessories: { label: "Accessories", color: "#0891b2", bg: "#ecfeff",  Icon: Layers     },
  components:  { label: "Components",  color: "#7c3aed", bg: "#f5f3ff",  Icon: Cpu        },
  consumables: { label: "Consumables", color: "#d97706", bg: "#fffbeb",  Icon: FlaskConical},
  licenses:    { label: "Licenses",    color: "#059669", bg: "#ecfdf5",  Icon: FileKey    },
};

const PW_RULES = [
  { id: "len",     label: "Minimum 8 characters",            test: (v) => v.length >= 8 },
  { id: "letter",  label: "At least one letter",             test: (v) => /[a-zA-Z]/.test(v) },
  { id: "number",  label: "At least one number",             test: (v) => /[0-9]/.test(v) },
  { id: "special", label: "One special character (@$!%*?&)", test: (v) => /[@$!%*?&]/.test(v) },
];

function getInitials(name) {
  if (!name) return "U";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────

export default function Setting() {
  const { user } = useAuth();
  const token   = sessionStorage.getItem("access_token");
  const headers = { Authorization: `Bearer ${token}` };

  const location = useLocation();
  const navigate = useNavigate();

  const getTabFromURL = () => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "profile";
  };

  const [tab,     setTab]     = useState(getTabFromURL());
  const [profile, setProfile] = useState({});
  const [assigned,setAssigned]= useState({});
  const [loading, setLoading] = useState(true);

  const [editForm,    setEditForm]    = useState({ full_name: "", phone: "" });
  const [editImage,   setEditImage]   = useState(null);
  const [editPreview, setEditPreview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [pwForm,    setPwForm]    = useState({ old_password: "", new_password: "", confirm_password: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [showPw,    setShowPw]    = useState({ old: false, new: false, confirm: false });

  const [activeCat, setActiveCat] = useState("assets");

  useEffect(() => { setTab(getTabFromURL()); }, [location.search]);

  useEffect(() => {
    if (!user?.user_id) return;
    (async () => {
      try {
        const [profileRes, assignedRes] = await Promise.all([
          axios.get(API.GET_MY_PROFILE(user.user_id), { headers }),
          axios.get(API.GET_MY_ASSIGNED_ITEMS(user.user_id), { headers }),
        ]);
        setProfile(profileRes.data);
        setEditForm({ full_name: profileRes.data.full_name || "", phone: profileRes.data.phone || "" });
        setAssigned(assignedRes.data || {});
      } catch (err) {
        toast.error("Failed to load profile data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleEditSubmit = async () => {
    if (!editForm.full_name.trim()) { toast.error("Full name is required."); return; }
    setEditLoading(true);
    const toastId = toast.loading("Saving changes…");
    try {
      const formData = new FormData();
      formData.append("full_name", editForm.full_name);
      formData.append("phone",     editForm.phone);
      if (editImage) formData.append("image", editImage);
      const res = await axios.put(API.UPDATE_MY_PROFILE(user.user_id), formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      console.log("Update Response:", res.data);
      setProfile((prev) => ({ ...prev, ...res.data }));
      setEditImage(null);
      setEditPreview(null);
      toast.success("Profile updated successfully!", { id: toastId });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to update profile.", { id: toastId });
    } finally {
      setEditLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (pwForm.new_password !== pwForm.confirm_password) { toast.error("New passwords do not match."); return; }
    const allPass = PW_RULES.every((r) => r.test(pwForm.new_password));
    if (!allPass) { toast.error("Password does not meet the requirements."); return; }
    setPwLoading(true);
    const toastId = toast.loading("Changing password…");
    try {
      await axios.put(`${API.CHANGE_PASSWORD}?auth_user_id=${user.user_id}`, pwForm, { headers });
      setPwForm({ old_password: "", new_password: "", confirm_password: "" });
      toast.success("Password changed successfully!", { id: toastId });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to change password.", { id: toastId });
    } finally {
      setPwLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setEditImage(file);
    setEditPreview(URL.createObjectURL(file));
  };

  const totalItems      = ITEM_CATEGORIES.reduce((s, c) => s + (assigned[c]?.length || 0), 0);
  const filename = profile.profile_image
  ? profile.profile_image.split(/[\\/]/).pop()
  : null;

const profileImageSrc = filename
  ? `${import.meta.env.VITE_AUTH_BASE}/profile/image/${encodeURIComponent(filename)}`
  : null;

  return (
    <Box sx={{ display: "flex", gap: 3, p: 3, height: "100%", overflow: "hidden", bgcolor: "#f8fafc" }}>

      {/* ── SIDEBAR ───────────────────────────────────────────────── */}
      <Box sx={{ width: 256, flexShrink: 0, display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>

        {/* Avatar card */}
        <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: "1px solid #f1f5f9", textAlign: "center" }}>
          <Box sx={{ position: "relative", display: "inline-block", mb: 1.5 }}>
            <Avatar
              src={profileImageSrc || undefined}
              sx={{
                width: 80, height: 80, fontSize: 28, fontWeight: 700,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "3px solid #ede9fe",
              }}
            >
              {!profileImageSrc && getInitials(profile.full_name)}
            </Avatar>
          </Box>
          <Typography fontWeight={700} fontSize={15} color="#0f172a" sx={{ textTransform: "capitalize", mb: 0.25 }}>
            {profile.full_name || "User"}
          </Typography>
          <Typography fontSize={12} color="text.secondary" mb={1}>
            {profile.designation || "—"}
          </Typography>
          <Chip
            label={profile.department || "—"}
            size="small"
            sx={{ bgcolor: "#ede9fe", color: "#6d28d9", fontWeight: 600, fontSize: 11, mb: 2 }}
          />
          <Divider sx={{ mb: 1.5 }} />
          <Box sx={{ display: "flex", justifyContent: "center", gap: 3 }}>
            <Box sx={{ textAlign: "center" }}>
              <Typography fontWeight={700} fontSize={18} color="#0f172a" lineHeight={1.2}>{totalItems}</Typography>
              <Typography fontSize={10} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>Items</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ textAlign: "center" }}>
              <Typography fontWeight={700} fontSize={18} color="#0f172a" lineHeight={1.2}>{profile.employee_code || "—"}</Typography>
              <Typography fontSize={10} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>Emp. Code</Typography>
            </Box>
          </Box>
        </Paper>

        {/* Nav */}
        <Paper elevation={0} sx={{ borderRadius: 3, overflow: "hidden", border: "1px solid #f1f5f9" }}>
          <List disablePadding>
            {TABS.map(({ key, label, LIcon }, idx) => {
              const active = tab === key;
              return (
                <ListItemButton
                  key={key}
                  onClick={() => { setTab(key); navigate(`/settings?tab=${key}`); }}
                  divider={idx < TABS.length - 1}
                  sx={{
                    py: 1.25,
                    px: 2,
                    borderLeft: active ? "3px solid #6d28d9" : "3px solid transparent",
                    bgcolor: active ? "#f5f3ff" : "transparent",
                    "&:hover": { bgcolor: active ? "#f5f3ff" : "#fafafa" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: active ? "#6d28d9" : "text.secondary" }}>
                    <LIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "#6d28d9" : "#475569" }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Paper>
      </Box>

      {/* ── MAIN ──────────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{ flex: 1, borderRadius: 3, p: "28px 32px", border: "1px solid #f1f5f9", overflowY: "auto" }}
      >
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 2 }}>
            <CircularProgress size={36} sx={{ color: "#6366f1" }} />
            <Typography fontSize={13} color="text.secondary">Loading your data…</Typography>
          </Box>
        ) : (
          <>
            {/* ─ PROFILE INFO ─ */}
            {tab === "profile" && (
              <Box>
                <SectionHeader title="Profile Information" subtitle="Your account details at a glance" />
                <Grid container spacing={2}>
                  <InfoField label="Full Name"     value={profile.full_name}     Icon={User}       />
                  <InfoField label="Email"         value={profile.email}         Icon={BadgeCheck}  />
                  <InfoField label="Phone"         value={profile.phone}         Icon={Phone}       />
                  <InfoField label="Department"    value={profile.department}    Icon={Building2}   />
                  <InfoField label="Employee Code" value={profile.employee_code} Icon={Hash}        />
                  <InfoField label="Designation"   value={profile.designation}   Icon={Briefcase}   />
                  <InfoField label="Status"        value={profile.status}        Icon={ShieldCheck} valueColor="#059669" />
                  <InfoField
                    label="Member Since"
                    value={profile.created_at
                      ? new Date(profile.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                      : "—"}
                    Icon={CalendarDays}
                  />
                </Grid>
              </Box>
            )}

            {/* ─ EDIT PROFILE ─ */}
            {tab === "edit" && (
              <Box>
                <SectionHeader title="Edit Profile" subtitle="Update your personal information" />

                {/* Avatar upload */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3, p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #f1f5f9" }}>
                  <Avatar
                    src={editPreview || profileImageSrc || undefined}
                    sx={{ width: 72, height: 72, fontSize: 24, fontWeight: 700, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "3px solid #ede9fe", flexShrink: 0 }}
                  >
                    {!(editPreview || profileImageSrc) && getInitials(profile.full_name)}
                  </Avatar>
                  <Box>
                    <Button
                      size="small"
                      startIcon={<CameraIcon fontSize="small" />}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ bgcolor: "#f5f3ff", color: "#6d28d9", border: "1px solid #ddd6fe", textTransform: "none", fontWeight: 600, mb: 0.5, "&:hover": { bgcolor: "#ede9fe" } }}
                    >
                      Change Photo
                    </Button>
                    <Typography fontSize={11} color="text.secondary">JPG, PNG · Max 5 MB</Typography>
                    <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
                  </Box>
                </Box>

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2, mb: 2.5 }}>
                  <MuiFormField
                    label="Full Name"
                    value={editForm.full_name}
                    onChange={(v) => setEditForm((p) => ({ ...p, full_name: v }))}
                    placeholder="Enter your full name"
                    icon={<User size={15} />}
                  />
                  <MuiFormField
                    label="Phone Number"
                    value={editForm.phone}
                    onChange={(v) => setEditForm((p) => ({ ...p, phone: v }))}
                    placeholder="Enter your phone number"
                    icon={<Phone size={15} />}
                  />
                </Box>

                <GradientButton onClick={handleEditSubmit} loading={editLoading} icon={<Save size={15} />} loadingText="Saving…">
                  Save Changes
                </GradientButton>
              </Box>
            )}

            {/* ─ ASSIGNED ITEMS ─ */}
            {tab === "assets" && (
              <Box>
                <SectionHeader
                  title="Assigned Items"
                  subtitle={`${totalItems} item${totalItems !== 1 ? "s" : ""} currently assigned to you`}
                />

                {/* Category pills */}
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
                  {ITEM_CATEGORIES.map((cat) => {
                    const cfg   = categoryConfig[cat];
                    const count = assigned[cat]?.length || 0;
                    const active = activeCat === cat;
                    const CatIcon = cfg.Icon;
                    return (
                      <Chip
                        key={cat}
                        icon={<Box sx={{ display: "flex", color: "inherit", ml: 0.5 }}><CatIcon size={13} /></Box>}
                        label={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            {cfg.label}
                            <Box sx={{ bgcolor: active ? "rgba(255,255,255,0.3)" : cfg.color, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {count}
                            </Box>
                          </Box>
                        }
                        onClick={() => setActiveCat(cat)}
                        sx={{
                          bgcolor: active ? cfg.color : cfg.bg,
                          color: active ? "#fff" : cfg.color,
                          border: `1.5px solid ${cfg.color}`,
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: "pointer",
                          height: 32,
                          "& .MuiChip-icon": { color: "inherit" },
                          "&:hover": { opacity: 0.9 },
                        }}
                      />
                    );
                  })}
                </Box>

                {/* Items */}
                {(assigned[activeCat] || []).length === 0 ? (
                  <Box sx={{ textAlign: "center", p: "48px 24px", bgcolor: "#f8fafc", borderRadius: 2, border: "1px dashed #cbd5e1" }}>
                    <Package size={40} color="#cbd5e1" />
                    <Typography fontWeight={600} fontSize={15} color="#334155" mt={1.5} mb={0.75}>
                      No {categoryConfig[activeCat].label}
                    </Typography>
                    <Typography fontSize={13} color="text.secondary">
                      No {categoryConfig[activeCat].label.toLowerCase()} have been assigned to you yet.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 1.25 }}>
                    {(assigned[activeCat] || []).map((item, idx) => {
                      const id       = item.asset_id ?? item.id ?? idx;
                      const name     = item.asset_name ?? item.name ?? "Item";
                      const tag      = item.asset_tag  ?? item.tag  ?? "—";
                      const serial   = item.serial_number ?? item.serial ?? null;
                      const imageUrl = item.image_url
                        ? item.image_url.startsWith("http") ? item.image_url : `${import.meta.env.VITE_AUTH_BASE}/${item.image_url}`
                        : null;
                      const cfg = categoryConfig[activeCat];
                      const CatIcon = cfg.Icon;
                      return (
                        <Box key={id} sx={{ display: "flex", alignItems: "center", gap: 1.75, p: "12px 16px", bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }}>
                          <Box sx={{ width: 52, height: 52, borderRadius: 1.5, overflow: "hidden", flexShrink: 0, bgcolor: "#e2e8f0" }}>
                            {imageUrl
                              ? <Box component="img" src={imageUrl} sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt={name} />
                              : <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: cfg.bg }}>
                                  <CatIcon size={22} color={cfg.color} strokeWidth={1.5} />
                                </Box>
                            }
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography fontWeight={600} fontSize={14} color="#0f172a" mb={0.25} noWrap>{name}</Typography>
                            <Typography fontSize={11} color="#64748b" sx={{ display: "flex", alignItems: "center", mb: 0.25 }}>
                              <Tag size={11} style={{ marginRight: 4 }} />{tag}
                            </Typography>
                            {serial && (
                              <Typography fontSize={11} color="#64748b" sx={{ display: "flex", alignItems: "center" }}>
                                <Hash size={11} style={{ marginRight: 4 }} />{serial}
                              </Typography>
                            )}
                          </Box>
                          <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: 11, flexShrink: 0 }} />
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            )}

            {/* ─ CHANGE PASSWORD ─ */}
            {tab === "password" && (
              <Box>
                <SectionHeader title="Change Password" subtitle="Keep your account secure with a strong password" />
                <Paper elevation={0} sx={{ bgcolor: "#f8fafc", borderRadius: 2, p: 2.5, border: "1px solid #f1f5f9", mb: 2.5 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2, mb: 2 }}>
                    <MuiPasswordField
                      label="Current Password"
                      value={pwForm.old_password}
                      show={showPw.old}
                      onToggle={() => setShowPw((p) => ({ ...p, old: !p.old }))}
                      onChange={(v) => setPwForm((p) => ({ ...p, old_password: v }))}
                      placeholder="Enter current password"
                    />
                    <MuiPasswordField
                      label="New Password"
                      value={pwForm.new_password}
                      show={showPw.new}
                      onToggle={() => setShowPw((p) => ({ ...p, new: !p.new }))}
                      onChange={(v) => setPwForm((p) => ({ ...p, new_password: v }))}
                      placeholder="Enter new password"
                    />
                    <MuiPasswordField
                      label="Confirm New Password"
                      value={pwForm.confirm_password}
                      show={showPw.confirm}
                      onToggle={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))}
                      onChange={(v) => setPwForm((p) => ({ ...p, confirm_password: v }))}
                      placeholder="Confirm new password"
                    />
                  </Box>

                  {/* Password rules */}
                  <Box sx={{ p: 2, bgcolor: "#f0fdf4", borderRadius: 1.5, border: "1px solid #bbf7d0" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
                      <ShieldCheck size={13} color="#15803d" />
                      <Typography fontSize={12} fontWeight={700} color="#15803d" textTransform="uppercase" letterSpacing={0.5}>
                        Password requirements
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                      {PW_RULES.map((rule) => {
                        const ok = rule.test(pwForm.new_password);
                        return (
                          <Box key={rule.id} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                            {ok
                              ? <CheckCircle2 size={13} color="#059669" />
                              : <XCircle      size={13} color="#cbd5e1" />
                            }
                            <Typography fontSize={12} fontWeight={500} color={ok ? "#059669" : "#94a3b8"} sx={{ transition: "color 0.2s" }}>
                              {rule.label}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </Paper>

                <GradientButton onClick={handlePasswordSubmit} loading={pwLoading} icon={<KeyRound size={15} />} loadingText="Changing…">
                  Change Password
                </GradientButton>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────

function SectionHeader({ title, subtitle }) {
  return (
    <Box mb={3}>
      <Typography fontWeight={700} fontSize={20} color="#0f172a" mb={0.5}>{title}</Typography>
      <Typography fontSize={13} color="text.secondary" mb={2}>{subtitle}</Typography>
      <Box sx={{ height: 1, background: "linear-gradient(to right, #e2e8f0, transparent)" }} />
    </Box>
  );
}

function InfoField({ label, value, Icon: FieldIcon, valueColor }) {
  return (
    <Grid item xs={12} sm={6}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, bgcolor: "#f8fafc", borderRadius: 1.5, p: "12px 16px", border: "1px solid #f1f5f9" }}>
        {FieldIcon && (
          <Box sx={{ width: 34, height: 34, borderRadius: 1, bgcolor: "#ede9fe", color: "#6d28d9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FieldIcon size={16} strokeWidth={1.8} />
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography fontSize={11} fontWeight={500} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} mb={0.25}>
            {label}
          </Typography>
          <Typography fontSize={14} fontWeight={500} color={valueColor || "#0f172a"} noWrap>
            {value || "—"}
          </Typography>
        </Box>
      </Box>
    </Grid>
  );
}

function MuiFormField({ label, value, onChange, placeholder, icon }) {
  return (
    <Box>
      <Typography fontSize={12} fontWeight={600} color="#475569" textTransform="uppercase" letterSpacing={0.4} mb={0.75}>
        {label}
      </Typography>
      <TextField
        fullWidth
        size="small"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        InputProps={{
          startAdornment: icon ? (
            <InputAdornment position="start" sx={{ color: "#94a3b8" }}>{icon}</InputAdornment>
          ) : undefined,
          sx: { bgcolor: "#f8fafc", fontSize: 14, borderRadius: 2 },
        }}
        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
      />
    </Box>
  );
}

function MuiPasswordField({ label, value, onChange, placeholder, show, onToggle }) {
  return (
    <Box>
      <Typography fontSize={12} fontWeight={600} color="#475569" textTransform="uppercase" letterSpacing={0.4} mb={0.75}>
        {label}
      </Typography>
      <TextField
        fullWidth
        size="small"
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ color: "#94a3b8" }}>
              <Lock size={15} strokeWidth={1.8} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={onToggle} edge="end">
                {show ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}
              </IconButton>
            </InputAdornment>
          ),
          sx: { bgcolor: "#f8fafc", fontSize: 14 },
        }}
        sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
      />
    </Box>
  );
}

function GradientButton({ onClick, loading, icon, loadingText, children }) {
  return (
    <Button
      variant="contained"
      onClick={onClick}
      disabled={loading}
      startIcon={loading ? <CircularProgress size={15} color="inherit" /> : icon}
      sx={{
        background: "linear-gradient(135deg, #6366f1, #7c3aed)",
        color: "#fff",
        fontWeight: 600,
        fontSize: 14,
        px: 3,
        py: 1.25,
        borderRadius: 2,
        textTransform: "none",
        letterSpacing: 0.2,
        boxShadow: "none",
        "&:hover": { background: "linear-gradient(135deg, #4f46e5, #6d28d9)", boxShadow: "none" },
        "&.Mui-disabled": { opacity: 0.7, color: "#fff" },
      }}
    >
      {loading ? loadingText : children}
    </Button>
  );
}