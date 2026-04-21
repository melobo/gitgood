import { useState } from 'react';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { InvoiceStatus, InvoiceListFilters } from './types';

interface SearchBarProperties {
  onSearch: (filters: InvoiceListFilters) => void;
}

export function SearchBar({ onSearch }: SearchBarProperties): React.ReactElement {
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

  function handleSearch() {
    onSearch(filters);
    setIsFiltering(false);
  }

  return (
    <div className='search-wrapper'>
      <header className='layout-header'>
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
          <button className='icon-button' onClick={() => setIsFiltering(prev => !prev)}>
            <IconFilter size={20}/>
          </button>
        </div>
      </header>
        
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
            <div className='select-wrapper'>
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
            <div className='price-inputs'>
              <div className='input-group'>
                <span className='currency'>$</span>
                <input
                  type='number'
                  placeholder='0'
                  className='input-min'
                  min={0}
                  max={10000}
                  step={100}
                  value={filters.minAmount ?? 0}
                  onChange={e => { setFilters(prev => ({...prev, minAmount: Math.min(Number(e.target.value), prev.maxAmount ?? 10000)})); }}
                />
              </div>
              <span className='range-separator'>-</span>
              <div className='input-group'>
                <span className='currency'>$</span>
                <input
                  type='number'
                  placeholder='10000'
                  className='input-max'
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
            <button className='normal-button' onClick={handleSearch}>
              Apply
            </button>
            <button className='normal-button' onClick={() => setIsFiltering(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}