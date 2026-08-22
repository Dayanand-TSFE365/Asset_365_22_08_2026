import { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "../components/common/DataTable";
import { API } from "../../../config/api";

export default function DeletedUsers() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchDeleted = async () => {
      try {
        const token = sessionStorage.getItem("access_token");

        const res = await axios.get(
          API.GET_DELETED_EMPLOYEES,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const formatted = res.data.map((item) => ({
          id: item.id,
          employee_code: item.employee_code,
          full_name: item.full_name,
          email: item.email,
          phone: item.phone || "-",
          department: item.department || "-",
          designation: item.designation || "-",
          status: item.status || "-",
          role: item.role || "-",
          login_enabled: item.login_enabled,
          created_at: item.created_at
            ? new Date(item.created_at).toLocaleDateString("en-GB")
            : "-",
        }));

        setData(formatted);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDeleted();
  }, []);

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-semibold mb-2">
        Deleted Users
      </h1>

      <div className="flex-1 min-h-0">
        <DataTable
          columns={[
            { header: "Employee Code", accessor: "employee_code" },
            { header: "Full Name", accessor: "full_name" },
            { header: "Email", accessor: "email" },
            { header: "Phone", accessor: "phone" },
            { header: "Department", accessor: "department" },
            { header: "Designation", accessor: "designation" },
            { header: "Status", accessor: "status" },
            { header: "Role", accessor: "role" },
            {
              header: "Created",
              accessor: "created_at",
            },
          ]}
          data={data}
        />
      </div>
    </div>
  );
}