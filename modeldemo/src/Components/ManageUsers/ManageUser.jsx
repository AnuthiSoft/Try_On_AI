import React, { useState, useEffect } from "react";
import "./ManageUser.css";
import api from "../../Services/api";
import { toast } from "react-toastify";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");

  //  CONFIRM MODAL STATE
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    action: null, // "approve" | "reject"
    userId: null
  });

  // ===============================
  // LOAD USERS
  // ===============================
  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        `/auth/super-admin/enterprise-requests?status=${statusFilter}`
      );
      setUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [statusFilter]);

  // ===============================
  // SEARCH
  // ===============================
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(
        users.filter(
          (u) =>
            u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.enterprise_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, users]);

  // ===============================
  // ACTION HANDLERS
  // ===============================
  const handleApproveUser = async (id) => {
    try {
      await api.put(`/auth/super-admin/approve-enterprise/${id}`);
      toast.success("Enterprise approved successfully");
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Approval failed");
    } finally {
      setConfirmModal({ open: false, action: null, userId: null });
    }
  };

  const handleRejectUser = async (id) => {
    try {
      await api.put(`/auth/super-admin/reject-enterprise/${id}`);
      toast.info("Enterprise rejected successfully");
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Rejection failed");
    } finally {
      setConfirmModal({ open: false, action: null, userId: null });
    }
  };
  const getStatusLabel = (status) => {
  switch (status) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
};


  return (
    <div className="manage-users-container">
      <div className="manage-users-header">
        <h1>User Management</h1>
      </div>

      {/* TOP BAR */}
      <div className="top-filter-bar">
        <div className="search-box compact">
          <i className="fa-solid fa-search"></i>
          <input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="status-filter-group">
          <button
            className={statusFilter === "pending" ? "filter-btn active" : "filter-btn"}
            onClick={() => setStatusFilter("pending")}
          >
            Requests
          </button>

          <button
            className={
              statusFilter === "approved"
                ? "filter-btn success active"
                : "filter-btn success"
            }
            onClick={() => setStatusFilter("approved")}
          >
            Approved
          </button>

          <button
            className={
              statusFilter === "rejected"
                ? "filter-btn danger active"
                : "filter-btn danger"
            }
            onClick={() => setStatusFilter("rejected")}
          >
            Rejected
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="users-management-content">
        <div className="users-table-container">
          {loading ? (
            <p style={{ padding: "20px" }}>Loading...</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Enterprise</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.enterprise_id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.enterprise_name}</td>
                    <td>
                      <span className={`status-badge ${u.approval_status}`}>
                        {getStatusLabel(u.approval_status)}
                      </span>

                    </td>
                    <td>
                      {u.approval_status === "pending" && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className="approve-btn"
                            onClick={() =>
                              setConfirmModal({
                                open: true,
                                action: "approve",
                                userId: u.enterprise_id
                              })
                            }
                          >
                            Approve
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() =>
                              setConfirmModal({
                                open: true,
                                action: "reject",
                                userId: u.enterprise_id
                              })
                            }
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {u.approval_status === "approved" && (
                        <button
                          className="reject-btn"
                          onClick={() =>
                            setConfirmModal({
                              open: true,
                              action: "reject",
                              userId: u.enterprise_id
                            })
                          }
                        >
                          Reject
                        </button>
                      )}

                      {u.approval_status === "rejected" && (
                        <button
                          className="approve-btn"
                          onClick={() =>
                            setConfirmModal({
                              open: true,
                              action: "approve",
                              userId: u.enterprise_id
                            })
                          }
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CONFIRM MODAL */}
      {confirmModal.open && (
        <div className="confirm-modal-backdrop">
          <div className="confirm-modal">
            <h3>
              {confirmModal.action === "approve"
                ? "Approve Enterprise?"
                : "Reject Enterprise?"}
            </h3>

            <p>
              Are you sure you want to{" "}
              <strong>{confirmModal.action}</strong> this enterprise user?
            </p>

            <div className="confirm-modal-actions">
              <button
                className="confirm-cancel-btn"
                onClick={() =>
                  setConfirmModal({ open: false, action: null, userId: null })
                }
              >
                Cancel
              </button>

              {confirmModal.action === "approve" ? (
                <button
                  className="confirm-approve-btn"
                  onClick={() => handleApproveUser(confirmModal.userId)}
                >
                  Approve
                </button>
              ) : (
                <button
                  className="confirm-reject-btn"
                  onClick={() => handleRejectUser(confirmModal.userId)}
                >
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;
