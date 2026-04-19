import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export function Layout(): React.ReactElement {
  const navigate = useNavigate();

  function handleLogout(): void {
    localStorage.removeItem("session");
    navigate("/login");
  }

  function getNavClass({ isActive }: { isActive: boolean }): string {
    if (isActive) {
      return "nav-item active";
    }
    return "nav-item";
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">inv<span>ō</span>is</div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={getNavClass}>
            Dashboard
          </NavLink>
          <NavLink to="/invoices" className={getNavClass}>
            Invoices
          </NavLink>
          <NavLink to="/invoices/create" className={getNavClass}>
            Create invoice
          </NavLink>
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}
