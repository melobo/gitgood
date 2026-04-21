import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { IconFile, IconFileDescription, IconListCheckFilled, IconPencil, IconRefresh } from '@tabler/icons-react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { requestDashboardStats } from './httpWrappers';

/* function buildActivityTimeline(invoices: Invoice[]) {
  return invoices.flatMap(i => i.statusHistory.map((entry) => ({
    invoiceId: i.invoiceId,
    status: entry.status,
    changedAt: entry.changedAt,
    buyerName: i.buyerName,
  }))).sort((a,b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()).slice(0, 5);
} */

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

  useEffect(() => {
    const session = localStorage.getItem('session');
    if (!session) {
      navigate('/login');
      return;
    }

    requestDashboardStats()
      .then(setStats)
      .catch(console.error);
  }, [navigate]);

  const barData = [
    { name: 'Draft', value: stats.draft, fill: 'var(--data1)' },
    { name: 'Converted', value: stats.converted, fill: 'var(--data2)' },
    { name: 'Validated', value: stats.validated, fill: 'var(--data3)' },
    { name: 'Finalised', value: stats.finalised, fill: 'var(--data4)' },
  ]

  /* const [items, setItems] = useState<ActivityTimelineItem[]>([]);
  useEffect(() => {
    const loadInvoices = async () => {
      const invoices = await requestListInvoice();
      setItems(buildActivityTimeline(invoices));
    };

    loadInvoices().catch(console.error);
  }, []); */

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
      <div className='large-stat-card' style={{padding: 0}}>
        <div className='chart-wrapper'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={barData} margin={{ top: 15, right: 15, left: 10, bottom: 3 }} barCategoryGap="20%">
              <Bar dataKey="value" barSize={50} radius={[6, 6, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
              <CartesianGrid />
              <XAxis dataKey="name" />
              <YAxis tickLine={false} axisLine={false} width={20} />
              <Tooltip />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}