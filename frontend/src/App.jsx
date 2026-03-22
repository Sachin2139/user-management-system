import { useRef, useCallback, useEffect, useState } from "react";
import "./App.css";

function App() {
  const [updatePreviewUser, setUpdatePreviewUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [activePanel, setActivePanel] = useState(null); // 'search', 'filters', 'crud', or null

  const [filters, setFilters] = useState({
    name: "",
    username: "",
    email: "",
    role: ""
  });

  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  const [crud, setCrud] = useState({
    id: "",
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    status: "",
    password: ""
  });

  const [crudMode, setCrudMode] = useState(null);
  const [previewUser, setPreviewUser] = useState(null);
  const [searchId, setSearchId] = useState("");
  const [isIdSearchActive, setIsIdSearchActive] = useState(false);

  const resetCrudForm = () => {
    setCrud({
      id: "",
      name: "",
      username: "",
      email: "",
      phone: "",
      role: "",
      status: "",
      password: ""
    });
    setPreviewUser(null);
    setMessage("");
  };

  useEffect(() => {
    setPreviewUser(null);
    setUpdatePreviewUser(null);
    resetCrudForm();
  }, [crudMode]);

  const fetchUsers = async (pageNumber = 0) => {
    if (!hasMore && pageNumber !== 0) return;

    setLoading(true);
    setError("");

    const queryParams = Object.entries(filters)
      .filter(([_, v]) => v !== "")
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join("&");

    try {
      const res = await fetch(
        `http://localhost:8080/users/filter?page=${pageNumber}&size=${size}${queryParams ? `&${queryParams}` : ""}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await res.json();

      setUsers(prev =>
        pageNumber === 0 ? data.content : [...prev, ...data.content]
      );

      setHasMore(!data.last);
    } catch (err) {
      setError("Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleApplyFilters = () => {
    setUsers([]);
    setPage(0);
    setHasMore(true);
    setIsIdSearchActive(false);
    setMessage("");
    setError("");
    fetchUsers(0);
    setActivePanel(null); // optional: close panel after apply
  };

  const handleSearchById = async () => {
    if (!searchId.trim()) {
      setMessage("Please enter an ID");
      return;
    }
    setMessage("");
    setError("");
    try {
      const res = await fetch(`http://localhost:8080/users/${searchId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setMessage(`User with ID ${searchId} not found`);
        } else {
          throw new Error("Failed to fetch user");
        }
        return;
      }
      const data = await res.json();
      setUsers([data]);
      setHasMore(false);
      setPage(0);
      setIsIdSearchActive(true);
      setMessage(`Found user: ${data.name}`);
    } catch (err) {
      setError("Failed to fetch user");
    }
  };

  const lastUserRef = useCallback(
    node => {
      if (loading || isIdSearchActive) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prev => prev + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, isIdSearchActive]
  );

  const handleAdd = async () => {
    setMessage("");
    const payload = {
      name: crud.name,
      username: crud.username,
      email: crud.email,
      phone: crud.phone,
      role: crud.role,
      password: crud.password
    };

    try {
      const res = await fetch(`http://localhost:8080/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Create failed");
      }
      const data = await res.json();
      setUsers(prev => [data, ...prev]);
      setMessage(`User created with ID ${data.id}`);
      resetCrudForm();
    } catch (err) {
      setMessage(err.message || "Create failed");
    }
  };

  const handlePreviewUpdate = async () => {
    setMessage("");

    if (!crud.id) {
      setMessage("ID is required to preview update");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/users/${crud.id}`);

      if (!res.ok) {
        setMessage("User not found");
        return;
      }

      const data = await res.json();
      setUpdatePreviewUser(data);

      setCrud({
        id: data.id || "",
        name: data.name || "",
        username: data.username || "",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "",
        status: data.status ?? "",
        password: data.password || ""
      });
    } catch (err) {
      setMessage("Preview update failed");
    }
  };

  const confirmUpdate = async () => {
    if (!updatePreviewUser) return;

    try {
      const payload = {
        name: crud.name,
        username: crud.username,
        email: crud.email,
        phone: crud.phone,
        role: crud.role,
        status: crud.status === "" ? null : crud.status,
        password: crud.password
      };

      const res = await fetch(`http://localhost:8080/users/${updatePreviewUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Update failed");
      }

      const data = await res.json();

      setUsers(prev => prev.map(u => (u.id === data.id ? data : u)));
      setUpdatePreviewUser(data);
      setMessage(`Updated: ${data.name} (ID ${data.id})`);
    } catch (err) {
      setMessage(err.message || "Update failed");
    }
  };

  const handlePreview = async () => {
    setMessage("");
    if (!crud.id) {
      setMessage("ID is required to preview delete");
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/users/${crud.id}`);

      if (!res.ok) {
        setMessage("User not found");
        return;
      }

      const data = await res.json();
      setPreviewUser(data);
    } catch (err) {
      setMessage("Preview failed");
    }
  };

  const confirmDelete = async () => {
    if (!previewUser) return;

    try {
      const res = await fetch(`http://localhost:8080/users/${previewUser.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Delete failed");
      }

      setUsers(prev => prev.filter(u => u.id !== previewUser.id));
      setMessage(`Deleted: ${previewUser.name} (ID ${previewUser.id})`);
      setPreviewUser(null);
      resetCrudForm();
    } catch (err) {
      setMessage(err.message || "Delete failed");
    }
  };

  return (
    <div className="app-shell">
      <div className="container">
        <header className="hero">
          <h1>User Management System</h1>
        </header>

        <section className="toolbar-card">
          <div className="action-buttons">
            <button
              className={activePanel === "search" ? "primary-btn active" : "secondary-btn"}
              onClick={() => setActivePanel(activePanel === "search" ? null : "search")}
            >
              Search by ID
            </button>
            <button
              className={activePanel === "filters" ? "primary-btn active" : "secondary-btn"}
              onClick={() => setActivePanel(activePanel === "filters" ? null : "filters")}
            >
              Filters
            </button>
            <button
              className={activePanel === "crud" ? "primary-btn active" : "secondary-btn"}
              onClick={() => setActivePanel(activePanel === "crud" ? null : "crud")}
            >
              CRUD
            </button>
          </div>

          {activePanel === "search" && (
            <div className="panel-content">
              <div className="panel-header">
                <h3>Search by ID</h3>
                <button className="close-btn" onClick={() => setActivePanel(null)}>✕</button>
              </div>
              <div className="search-id-form">
                <input
                  placeholder="Enter user ID"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                />
                <button className="primary-btn" onClick={handleSearchById}>
                  Search
                </button>
              </div>
            </div>
          )}

          {activePanel === "filters" && (
            <div className="panel-content">
              <div className="panel-header">
                <h3>Filters</h3>
                <button className="close-btn" onClick={() => setActivePanel(null)}>✕</button>
              </div>
              <div className="filter-fields">
                <div className="field">
                  <label>Name</label>
                  <input
                    value={filters.name}
                    onChange={e => setFilters({ ...filters, name: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Username</label>
                  <input
                    value={filters.username}
                    onChange={e => setFilters({ ...filters, username: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input
                    value={filters.email}
                    onChange={e => setFilters({ ...filters, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Role</label>
                  <input
                    value={filters.role}
                    onChange={e => setFilters({ ...filters, role: e.target.value })}
                  />
                </div>
                <div className="button-row">
                  <button className="primary-btn" onClick={handleApplyFilters}>
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {activePanel === "crud" && (
            <div className="panel-content crud-panel">
              <div className="panel-header">
                <h3>CRUD Operations</h3>
                <button className="close-btn" onClick={() => setActivePanel(null)}>✕</button>
              </div>
              <div className="crud-tabs">
                <button
                  className={crudMode === "create" ? "tab active" : "tab"}
                  onClick={() => setCrudMode("create")}
                >
                  Create
                </button>
                <button
                  className={crudMode === "update" ? "tab active" : "tab"}
                  onClick={() => setCrudMode("update")}
                >
                  Update
                </button>
                <button
                  className={crudMode === "delete" ? "tab active" : "tab"}
                  onClick={() => setCrudMode("delete")}
                >
                  Delete
                </button>
              </div>

              {crudMode === "create" && (
                <div className="crud-form">
                  <div className="field-grid">
                    <div className="field"><label>Name</label><input value={crud.name} onChange={e => setCrud({ ...crud, name: e.target.value })} /></div>
                    <div className="field"><label>Username</label><input value={crud.username} onChange={e => setCrud({ ...crud, username: e.target.value })} /></div>
                    <div className="field"><label>Email</label><input value={crud.email} onChange={e => setCrud({ ...crud, email: e.target.value })} /></div>
                    <div className="field"><label>Phone</label><input value={crud.phone} onChange={e => setCrud({ ...crud, phone: e.target.value })} /></div>
                    <div className="field"><label>Role</label><input value={crud.role} onChange={e => setCrud({ ...crud, role: e.target.value })} /></div>
                    <div className="field full"><label>Password</label><input type="password" value={crud.password} onChange={e => setCrud({ ...crud, password: e.target.value })} /></div>
                  </div>
                  <button className="action-btn" onClick={handleAdd}>Create User</button>
                </div>
              )}

              {crudMode === "update" && (
                <div className="crud-form">
                  <div className="field-grid">
                    <div className="field full"><label>ID</label><input value={crud.id} onChange={e => setCrud({ ...crud, id: e.target.value })} /></div>
                  </div>
                  <div className="button-row">
                    <button className="action-btn outline" onClick={handlePreviewUpdate}>Preview Update</button>
                  </div>
                  {updatePreviewUser && (
                    <div className="preview-card">
                      <h3>Update Preview</h3>
                      <div className="field-grid">
                        <div className="field"><label>Name</label><input value={crud.name} onChange={e => setCrud({ ...crud, name: e.target.value })} /></div>
                        <div className="field"><label>Username</label><input value={crud.username} onChange={e => setCrud({ ...crud, username: e.target.value })} /></div>
                        <div className="field"><label>Email</label><input value={crud.email} onChange={e => setCrud({ ...crud, email: e.target.value })} /></div>
                        <div className="field"><label>Phone</label><input value={crud.phone} onChange={e => setCrud({ ...crud, phone: e.target.value })} /></div>
                        <div className="field"><label>Role</label><input value={crud.role} onChange={e => setCrud({ ...crud, role: e.target.value })} /></div>
                        <div className="field"><label>Status</label><input value={crud.status} onChange={e => setCrud({ ...crud, status: e.target.value })} /></div>
                      </div>
                      <div className="button-row" style={{ marginTop: "12px" }}>
                        <button className="primary-btn" onClick={confirmUpdate}>Confirm Update</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {crudMode === "delete" && (
                <div className="crud-form">
                  <div className="field-grid">
                    <div className="field full"><label>ID</label><input value={crud.id} onChange={e => setCrud({ ...crud, id: e.target.value })} /></div>
                  </div>
                  <div className="button-row">
                    <button className="action-btn outline" onClick={handlePreview}>Preview Delete</button>
                    <button className="danger-btn" onClick={confirmDelete} disabled={!previewUser}>Confirm Delete</button>
                  </div>
                  {previewUser && (
                    <div className="preview-card">
                      <h3>Delete Preview</h3>
                      <p><b>Name:</b> {previewUser.name}</p>
                      <p><b>Username:</b> {previewUser.username}</p>
                      <p><b>Email:</b> {previewUser.email}</p>
                      <p><b>Phone:</b> {previewUser.phone}</p>
                      <p><b>Role:</b> {previewUser.role}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {message && <div className="message-bar">{message}</div>}
        {error && <div className="error-bar">{error}</div>}

        <section className="table-card">
          <div className="table-wrap">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Username</th><th>Email</th><th>Phone</th><th>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user, index) => {
                    const isLast = users.length === index + 1;
                    return (
                      <tr ref={isLast ? lastUserRef : null} key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td>{user.role}</td>
                      </tr>
                    );
                  })
                ) : (
                  !loading && (
                    <tr>
                      <td colSpan="6" className="empty-cell">No users found</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          {loading && <p className="loading-text">Loading...</p>}
        </section>
      </div>
    </div>
  );
}

export default App;