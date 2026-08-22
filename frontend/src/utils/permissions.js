//utils/permission.js
export const getPermissions = () => {
  return JSON.parse(
    sessionStorage.getItem("permissions") || "[]"
  );
};

export const getUser = () => {
  return JSON.parse(
    sessionStorage.getItem("user") || "{}"
  );
};

export const hasPermission = (permission) => {
  const user = getUser();

  // Superadmin bypass
  if (user?.role === "superadmin") {
    return true;
  }

  const permissions = getPermissions();

  return permissions.includes(permission);
};