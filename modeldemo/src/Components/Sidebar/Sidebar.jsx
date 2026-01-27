import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from "../../Services/api";
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get user role from localStorage
  const userRole = localStorage.getItem("role") || "";
  const isSuperAdmin = userRole.toLowerCase() === "super_admin";

  /* ===============================
     MENU CONFIG
  =============================== */

  const baseMenuItems = [
    {
      id: 'products',
      icon: 'fa-solid fa-box',
      label: 'Products',
      path: '/home',
    },
    {
      id: 'models',
      icon: 'fa-solid fa-user-group',
      label: 'Models',
      path: '/models',
    },
    {
      id: 'generated',
      icon: 'fa-solid fa-wand-magic-sparkles',
      label: 'Generated Image',
      path: '/generate-image',
    },
    {
      id: 'wallet',
      icon: 'fa-solid fa-wallet',
      label: 'Wallet',
      path: '/wallet',
    },
    {
      id: 'configuration',
      icon: 'fa-solid fa-gear',
      label: 'Config',
      path: '/configuration',
    },
    {
      id: 'configuration',
      icon: 'fa-solid fa-gear',
      label: 'Image Resize',
      path: '/image-resize',
    },
  ];

  const adminMenuItems = isSuperAdmin
    ? [
        {
          id: 'users',
          icon: 'fa-solid fa-user-plus',
          label: 'Add Users',
          path: '/manage-users',
        },
      ]
    : [];

  const menuItems = [...baseMenuItems, ...adminMenuItems];

  const logoutItem = {
    id: 'logout',
    icon: 'fa-solid fa-right-from-bracket',
    label: 'Logout',
  };

  /* ===============================
     ACTIVE ITEM LOGIC
  =============================== */

  const getActiveItem = () => {
    debugger;
    const path = location.pathname;
    if (path.startsWith('/generate-image')) return 'generated';
    if (path.startsWith('/models')) return 'models';
    if (path.startsWith('/manage-users')) return 'users';
    if (path.startsWith('/wallet')) return 'wallet';
    if (path.startsWith('/configuration')) return 'configuration';
    if (path.startsWith('/image-resize')) return 'image-resize';
    return 'products';
  };

  const activeItem = getActiveItem();

  /* ===============================
     HANDLERS
  =============================== */

  const handleItemClick = (item) => {
    if (item.id === 'logout') {
      handleLogout();
    } else {
      navigate(item.path);
    }
  };

  const handleLogout = async () => {
    try {
      // 🔐 Backend logout (token blacklist)
      try {
        await api.post("/auth/logout");
      } catch (err) {
        console.warn("Logout API failed, continuing client-side:", err.message);
      }

      // 🧹 Clear local/session storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userData");
      localStorage.removeItem("refreshToken");

      sessionStorage.clear();

      // 🍪 Clear cookies (if any)
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie =
          name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });

      navigate('/login');
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.clear();
      sessionStorage.clear();
      navigate('/login');
    }
  };

  /* ===============================
     RENDER
  =============================== */

  return (
    <div className="sidebar">
      <ul>
        {/* Super Admin Badge */}
        {isSuperAdmin && (
          <div className="admin-badge">
            <i className="fa-solid fa-crown"></i>
            <span>Super Admin</span>
          </div>
        )}

        {/* Menu Items */}
        {menuItems.map((item) => (
          <li
            key={item.id}
            className={activeItem === item.id ? 'active' : ''}
            onClick={() => handleItemClick(item)}
          >
            {activeItem === item.id && <div className="active-indicator"></div>}
            <i className={item.icon}></i>
            <span>{item.label}</span>

            {item.id === 'users' && (
              <span className="admin-item-badge">Admin</span>
            )}
          </li>
        ))}

        {/* Logout */}
        <div className="sidebar-logout">
          <div
            className="logout-item"
            onClick={() => handleItemClick(logoutItem)}
          >
            <i className={logoutItem.icon}></i>
            <span>{logoutItem.label}</span>
          </div>
        </div>
      </ul>
    </div>
  );
}

export default Sidebar;
