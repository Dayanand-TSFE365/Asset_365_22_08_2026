import toast from "react-hot-toast";
import { hasPermission } from "../../utils/permissions";

export default function PermissionButton({
  permission,
  onClick,
  children,
  className = "",
  disabledClass = "",
}) {
  const allowed =
    hasPermission(permission);

  const handleClick = () => {
    if (!allowed) {
      toast.error(
        "You don't have permission"
      );

      return;
    }

    onClick?.();
  };

  return (
    <button
    type="button"
      onClick={handleClick}
      className={
        allowed
          ? className
          : `${className} opacity-50 cursor-not-allowed ${disabledClass}`
      }
    >
      {children}
    </button>
  );
}