import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { IconFile, IconFileDescription, IconListCheckFilled, IconPencil, IconRefresh } from '@tabler/icons-react';
import { requestDashboardStats } from './httpWrappers';

export function DashboardLayout(): React.ReactElement {
  return (
    <div className='dashboard-page'>
      <header>
        <h1> Dashboard </h1>
        <p> Welcome back! Glad to see you. </p>
      </header>
      <Outlet />
    </div>
  );
}

export function DashboardHome(): React.ReactElement {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    converted: 0,
    validated: 0,
    finalised: 0,
  });

  async function loadStats(): Promise<void> {
    const session = localStorage.getItem('session');
    if (!session) {
      navigate('/login');
      return;
    }
    try {
      const res = await requestDashboardStats();
      setStats(res.body);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className='dashboard-stats'>
      <div className='invoice-stat-card'>
        <div className='stat-header'>Total Invoices</div> 
        <div className='stat-value'>{stats.total}</div>
        <div className='stat-icon'><IconFileDescription size={36} /></div>
      </div>
      <div className='invoice-stat-card'>
        <div className='stat-header'>Drafts</div> 
        <div className='stat-value'>{stats.draft}</div>
        <div className='stat-icon'><IconPencil size={36} /></div>
      </div>
      <div className='invoice-stat-card'>
        <div className='stat-header'>Converted</div> 
        <div className='stat-value'>{stats.converted}</div>
        <div className='stat-icon'><IconRefresh size={36} /></div>
      </div>
      <div className='invoice-stat-card'>
        <div className='stat-header'>Validated</div> 
        <div className='stat-value'>{stats.validated}</div>
        <div className='stat-icon'><IconListCheckFilled size={36} /></div>
      </div>
      <div className='invoice-stat-card'>
        <div className='stat-header'>Finalised</div> 
        <div className='stat-value'>{stats.finalised}</div>
        <div className='stat-icon'><IconFile size={36} /></div>
      </div>
    </div>
  )
}