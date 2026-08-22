//src/hooks/usePermission.js
import { useAuth } from "../auth/AuthContext";

export default function usePermission(
  permission
) {
  const { user } = useAuth();

  return (
    user?.permissions?.includes(
      permission
    ) || false
  );
}