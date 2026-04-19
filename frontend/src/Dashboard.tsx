import React from 'react';
import { Outlet } from 'react-router-dom';
import { IconFile, IconFileDescription, IconListCheckFilled, IconPencil, IconRefresh } from '@tabler/icons-react';

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
  return (
    <div className='dashboard-stats'>
      <div className='invoice-stat-card'>
        <div className='stat-header'>Total Invoices</div> 
        <div className='stat-value'>0</div>
        <div className='stat-icon'><IconFileDescription size={36} /></div>
      </div>
      <div className='invoice-stat-card'>
        <div className='stat-header'>Drafts</div> 
        <div className='stat-value'>0</div>
        <div className='stat-icon'><IconPencil size={36} /></div>
      </div>
      <div className='invoice-stat-card'>
        <div className='stat-header'>Converted</div> 
        <div className='stat-value'>0</div>
        <div className='stat-icon'><IconRefresh size={36} /></div>
      </div>
      <div className='invoice-stat-card'>
        <div className='stat-header'>Validated</div> 
        <div className='stat-value'>0</div>
        <div className='stat-icon'><IconListCheckFilled size={36} /></div>
      </div>
      <div className='invoice-stat-card'>
        <div className='stat-header'>Finalised</div> 
        <div className='stat-value'>0</div>
        <div className='stat-icon'><IconFile size={36} /></div>
      </div>
    </div>
  )
}