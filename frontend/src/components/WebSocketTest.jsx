import { useEffect, useState } from "react";

const panelStyle = {
  height: "100%",
  boxSizing: "border-box",
  overflowY: "auto",
  padding: "24px",
  color: "#172033",
};

const contentStyle = {
  maxWidth: "900px",
  margin: "0 auto",
};

function WebSocketTest() {
  const [status, setStatus] = useState("Connecting...");
  const [logs, setLogs] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  const [diagnosticsError, setDiagnosticsError] = useState("");

  useEffect(() => {
    const addLog = (message) => {
      setLogs((previousLogs) => [
        ...previousLogs,
        `${new Date().toLocaleTimeString()} - ${message}`,
      ]);
    };

    const wsUrl = "ws://192.168.1.48:8000/ws/test";
    const socket = new WebSocket(wsUrl);

    addLog(`Connecting to: ${wsUrl}`);

    socket.onopen = () => {
      setStatus("Connected");
      addLog("WebSocket connected successfully");
      socket.send("hello");
      addLog("Sent: hello");
    };

    socket.onmessage = (event) => {
      addLog(`Server: ${event.data}`);
    };

    socket.onerror = () => {
      setStatus("Error");
      addLog("WebSocket error occurred");
    };

    socket.onclose = (event) => {
      setStatus("Disconnected");
      addLog(
        `WebSocket disconnected. Code: ${event.code}, Reason: ${
          event.reason || "No reason"
        }`
      );
    };

    return () => {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetch("http://192.168.1.48:8000/system/diagnostics", {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setDiagnostics(data))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setDiagnosticsError(error.message || "Unable to load diagnostics");
        }
      });

    return () => controller.abort();
  }, []);

  const statusColor = status === "Connected" ? "#15803d" : "#b45309";
  const diagnosticEntries = diagnostics
    ? Object.entries(diagnostics)
    : [];

  return (
    <main style={panelStyle}>
      <div style={contentStyle}>
      <h1 style={{ margin: "0 0 8px", fontSize: "28px" }}>WebSocket Test</h1>
      <p style={{ margin: "0 0 24px", color: "#526078" }}>
        Connection diagnostics for the test WebSocket endpoint.
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px",
          fontWeight: 600,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: statusColor,
          }}
        />
        Status: {status}
      </div>
      <pre
        aria-label="WebSocket event log"
        style={{
          minHeight: "240px",
          margin: 0,
          padding: "18px",
          overflowX: "auto",
          borderRadius: "8px",
          background: "#111827",
          color: "#d1fae5",
          fontFamily: "monospace",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
        }}
      >
        {logs.length ? logs.join("\n") : "Waiting for WebSocket events..."}
      </pre>

      <section style={{ marginTop: "32px" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "22px" }}>
          Redis and Celery System Diagnostics
        </h2>
        <p style={{ margin: "0 0 16px", color: "#526078" }}>
          Live status from the backend services.
        </p>
        {diagnosticsError && (
          <p style={{ color: "#b91c1c" }}>
            Unable to load diagnostics: {diagnosticsError}
          </p>
        )}
        {!diagnostics && !diagnosticsError && <p>Loading diagnostics...</p>}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          {diagnosticEntries.map(([service, details]) => {
            const isOnline = details.status === "online";

            return (
              <article
                key={service}
                style={{
                  padding: "16px",
                  border: "1px solid #d7deea",
                  borderRadius: "8px",
                  background: "#fff",
                }}
              >
                <strong style={{ textTransform: "capitalize" }}>
                  {service}
                </strong>
                <div
                  style={{
                    marginTop: "8px",
                    color: isOnline ? "#15803d" : "#b91c1c",
                    fontWeight: 600,
                  }}
                >
                  {details.status}
                </div>
                {details.message && (
                  <p style={{ margin: "8px 0 0", color: "#526078" }}>
                    {details.message}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>
      </div>
    </main>
  );
}

export default WebSocketTest;