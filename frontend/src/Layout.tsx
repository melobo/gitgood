import logo from './assets/logo.png';
import { IconLayoutDashboard, IconListFilled, IconPlus, IconSettings, IconSearch, IconFilter } from '@tabler/icons-react';
import React, { useState } from 'react';
import { Link, Outlet, /*useNavigate,*/ useLocation } from 'react-router-dom';
import { requestListInvoice } from './httpWrappers';
import { InvoiceStatus } from './types';

export function Layout(): React.ReactElement {
  //const navigate = useNavigate();
  const location = useLocation();
  const showSearch = !location.pathname.includes('settings');

  /*function handleLogout(): void {
    localStorage.removeItem('session');
    navigate('/login');
  }*/

  const [isFiltering, setIsFiltering] = useState(false);

  const [filters, setFilters] = useState({
    fromDate: undefined as string | undefined,
    toDate: undefined as string | undefined,
    page: 1,
    limitPerPage: 20,
    filter: undefined as string | undefined,
    status: undefined as InvoiceStatus | undefined,
    buyerName: undefined as string | undefined,
    supplierName: undefined as string | undefined,
    minAmount: undefined as number | undefined,
    maxAmount: undefined as number | undefined,
  });

  async function handleSearch() {
    await requestListInvoice(filters.fromDate, filters.toDate, filters.page, filters.limitPerPage, filters.filter, filters.status, filters.buyerName, filters.supplierName, filters.minAmount, filters.maxAmount);
  }

  return (
    <div className='layout'>
      <aside className='sidebar'>
        <nav className='sidenav'>
          <header>
            <img src={logo} alt='Site Logo' width='65' height='65'></img>
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
      </aside>

      <div className='layout-content'>
        <div className='search-wrapper'>
          {showSearch && (<header className='layout-header'>
            <div className='search-bar'>
              <IconSearch size={20} />
              <input
                type='text'
                placeholder='Find invoices, clients, and more'
                value={filters.filter || ''}
                onChange={e => {
                  setFilters(prev => ({...prev, filter: e.target.value || undefined, page: 1}))
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <button className='icon-button' onClick={() => setIsFiltering(true)}>
                <IconFilter size={20}/>
              </button>
            </div>
          </header>
          )}
          {isFiltering && (<div className='filter-panel'>
            <div className='filter-header'>Filters</div>
            <div className='filter-section'>
              <label>From Date</label>
              <input
                type='date'
                value={filters.fromDate || ''}
                onChange={e => setFilters(prev => ({...prev, fromDate: e.target.value || undefined}))}
              />
            </div>

            <div className='filter-section'>
              <label>To Date</label>
              <input
                type='date'
                value={filters.toDate || ''}
                onChange={e => setFilters(prev => ({...prev, toDate: e.target.value || undefined}))}
              />
            </div>

            <div className='filter-section'>
              <label>Limit Per Page</label>
              <input
                type='number'
                min={1}
                value={filters.limitPerPage}
                onChange={e => setFilters(prev => ({...prev, limitPerPage: Number(e.target.value)}))}
              />
            </div>

            <div className='filter-section'>
              <label>Status</label>
              <div className="select-wrapper">
                <select
                  value={filters.status || ''}
                  onChange={e => setFilters(prev => ({...prev, status: (e.target.value as InvoiceStatus) || undefined}))}
                >
                  <option value=''>All</option>
                  <option value='draft'>Draft</option>
                  <option value='converted'>Converted</option>
                  <option value='validated'>Validated</option>
                  <option value='finalised'>Finalised</option>
                </select>
              </div>
            </div>

            <div className='filter-section'>
              <label>Buyer name</label>
              <input
                type='text'
                value={filters.buyerName || ''}
                onChange={e => setFilters(prev => ({...prev, buyerName: e.target.value || undefined}))}
              />
            </div>

            <div className='filter-section'>
              <label>Supplier name</label>
              <input
                type='text'
                value={filters.supplierName || ''}
                onChange={e => setFilters(prev => ({...prev, supplierName: e.target.value || undefined}))}
              />
            </div>

            <div className='filter-section'>
              <label>Price Range</label>
              <div className="price-inputs">
                <div className="input-group">
                  <span className="currency">$</span>
                  <input
                    type='number'
                    placeholder="0"
                    className="input-min"
                    min={0}
                    max={10000}
                    step={100}
                    value={filters.minAmount ?? 0}
                    onChange={e => { setFilters(prev => ({...prev, minAmount: Math.min(Number(e.target.value), prev.maxAmount ?? 10000)})); }}
                  />
                </div>
                <span className="range-separator">-</span>
                <div className="input-group">
                  <span className="currency">$</span>
                  <input
                    type='number'
                    placeholder="10000"
                    className="input-max"
                    min={0}
                    max={10000}
                    step={100}
                    value={filters.maxAmount ?? 10000}
                    onChange={e => setFilters(prev => ({...prev, maxAmount: Math.max(Number(e.target.value), prev.minAmount ?? 0)}))}
                  />
                </div>
              </div>
            </div>

            <div className='filter-actions'>
              <button className='normal-button' onClick={() => {
                handleSearch();
                setIsFiltering(false);
              }}>
                Apply
              </button>
              <button className='normal-button' onClick={() => setIsFiltering(false)}>
                Cancel
              </button>
            </div>
          </div>)}
        </div>
      </div>

      <main className='layout-main'>
        <Outlet />
      </main>
    </div>
  );
}
