import logo from './assets/logo.png';
import { IconLayoutDashboard, IconListFilled, IconPlus, IconSettings } from '@tabler/icons-react';
import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export function Layout(): React.ReactElement {
  const navigate = useNavigate();

  function handleLogout(): void {
    localStorage.removeItem('session');
    navigate('/login');
  }

  return (
    <div className='layout'>
      <aside className='sidebar'>
        <nav className='sidenav'>
          <header>
            <img src={logo} alt="Site Logo" width="65" height="65"></img>
            <h1> payMe </h1>
          </header>
          <ul>
            <li><Link to='/dashboard' className='nav-item'>
              <IconLayoutDashboard size={20}/>
              Dashboard
            </Link></li>
            <li><Link to='/invoices' className='nav-item'>
              <IconListFilled size={20}/>
              Invoices
            </Link></li>
            <li><Link to='/invoices/create' className='nav-item'>
              <IconPlus size={20}/>
              Create invoice
            </Link></li>
            <li><Link to='/user/settings' className='nav-item'>
              <IconSettings size={20}/>
              Settings
            </Link></li>
          </ul>
        </nav>

        <button className='sidebar-logout' onClick={handleLogout}>
          Log out
        </button>
      </aside>

      <main className='layout-main'>
        <Outlet />
      </main>
    </div>
  );
}
