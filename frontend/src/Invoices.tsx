import { Outlet, useNavigate } from 'react-router-dom';
import { Invoice } from './types';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { requestDeleteInvoice, requestListInvoice } from './httpWrappers';

const statusColors: Record<Invoice['status'], string> = {
  draft: 'status-draft',
  converted: 'status-converted',
  validated: 'status-validated',
  finalised: 'status-finalised',
};

export function InvoiceLayout(): React.ReactElement {
  return (
    <div className='invoices-page'>
      <header>
        <h1> Invoices </h1>
        <p> Take a look! </p>
      </header>
      <Outlet />
    </div>
  );
}

export function InvoicesTable(): React.ReactElement {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    async function retrieveInvoices() {
      try {
        const data = await requestListInvoice();
        setInvoices(data.invoices ?? []); 
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      }
    }
    retrieveInvoices();
  }, []);

  async function handleDelete(id: string): Promise<void> {
    if (!confirm('Delete this invoice?')) return;
    
    try {
      await requestDeleteInvoice(id);
      setInvoices(prev => prev.filter(i => i.invoiceId !== id));
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed');
    }
  }

  async function handleEdit(id: string): Promise<void> {
    navigate(`/invoices/${id}/edit`);
  }

  return (
    <div className="table-card">
      <table className="invoice-table">
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
          {invoices.map((i) => (
            <tr key={i.invoiceId}>
              <td>{i.invoiceId}</td>
              <td>{i.buyerName}</td>
              <td>{new Date(i.issueDate).toLocaleDateString()}</td>
              <td>{new Date(i.paymentDueDate).toLocaleDateString()}</td>
              <td>
                <span className={`status-badge ${statusColors[i.status]}`}>
                  {i.status}
                </span>
              </td>
              <td>${i.totalPayable.toFixed(2)}</td>
              <td className='actions'>
                <button className='icon-button' onClick={() => handleEdit(i.invoiceId)}>
                  <IconEdit size={16} />
                </button>
                <button className='icon-button' onClick={() => handleDelete(i.invoiceId)}>
                  <IconTrash size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}