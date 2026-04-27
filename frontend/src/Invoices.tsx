import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Invoice, InvoiceListFilters, statusColors } from './types';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { requestDeleteInvoice, requestListInvoice } from './httpWrappers';

export function InvoiceLayout(): React.ReactElement {
  return (
    <div className='invoices-page'>
      <header>
        <h1> Invoices </h1>
        <p> View invoice details and monitor progress from draft to finalised. </p>
      </header>
      <Outlet />
    </div>
  );
}

export function InvoicesTable(): React.ReactElement {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  async function loadInvoices(filters?: InvoiceListFilters) {
    try {
      const data: Invoice[] = await requestListInvoice(filters);
      setInvoices(data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }
  }
  useEffect(() => {
    (async () => {
      await loadInvoices();
    })();
  }, []);

  async function handleDelete(id: string): Promise<void> {
    if (!confirm('Delete this invoice?')) return;
    
    try {
      await requestDeleteInvoice(id);
      setInvoices(prev => prev.filter(i => i.invoiceId !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  async function handleEdit(id: string): Promise<void> {
    navigate(`/invoices/${id}/edit`);
  }

  return (
    <div className='table-card'>
      <table className='invoice-table'>
        <thead>
          <tr>
            <th>Invoice ID</th>
            <th>Buyer</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(i => (
            <tr key={i.invoiceId}>
              <td>
                <Link to={`/invoices/${i.invoiceId}`} className='navigate'>
                  {i.invoiceId.slice(0, 8)}{i.invoiceId.length > 8 ? '...' : ''}
                </Link>
              </td>
              <td>{i.buyerName}</td>
              <td>{i.issueDate}</td>
              <td>{i.paymentDueDate}</td>
              <td>
                <span className={`status-badge ${statusColors[i.status]}`}>
                  {i.status}
                </span>
              </td>
              <td>${i.totalPayable.toFixed(2)}</td>
              <td>
                <div className='actions'>
                  <button className='edit-icon-button' onClick={() => handleEdit(i.invoiceId)}>
                    <IconEdit size={12} />
                  </button>
                  <button className='delete-icon-button' onClick={() => handleDelete(i.invoiceId)}>
                    <IconTrash size={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}