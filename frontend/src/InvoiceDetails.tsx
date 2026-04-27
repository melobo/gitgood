import { useNavigate, useParams } from 'react-router-dom';
import { Invoice, invoiceStatusWorkflows, statusColors, ValidationError } from './types';
import { useEffect, useState } from 'react';
import { requestConvertInvoice, requestDownloadInvoice, requestFinaliseInvoice, requestGetInvoice, requestValidateInvoice } from './httpWrappers';
import { CreateInvoice } from './CreateInvoice';

export function InvoiceDetailsPage(): React.ReactElement {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [targetAction, setTargetAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  async function loadInvoice(): Promise<void> {
    if (!invoiceId) return;
    try {
      setError(null);
      const data: Invoice = await requestGetInvoice(invoiceId);
      setInvoice(data);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unexpected error occurred.');
      }
    }
  }

  useEffect(() => {
    (async () => {
      await loadInvoice();
    })();
  }, [invoiceId]);

  async function handleTransition(nextStatus: string): Promise<void> {
    if (!invoiceId) {
      return;
    }
    try {
      setError(null);
      setValidationErrors([]);
      setTargetAction(nextStatus);
      let response;
      if (nextStatus === 'Converted') {
        response = await requestConvertInvoice(invoiceId);
      }
      if (nextStatus === 'Validated') {
        response = await requestValidateInvoice(invoiceId);
      }
      if (nextStatus === 'Finalised') {
        response = await requestFinaliseInvoice(invoiceId);
      }
      if (!response.valid && response.errors) {
        setValidationErrors(response.errors);
        return;
      }
      await loadInvoice();
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Workflow transition failed.');
      }
    }
  }

  async function handleDownload(invoiceId: string, format: 'xml' | 'json'): Promise<void> {
    try {
      const { body } = await requestDownloadInvoice(invoiceId, format);

      let content: string;
      let contentType: string;
      let filename: string = `invoice-${invoiceId}.${format}`;

      if (format === 'xml') {
        content = body.content;
        contentType = 'application/xml';
      } else {
        content = JSON.stringify(body.content);
        contentType = 'application/json';
      }

      const blob = new Blob([content], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('Download failed.');
      }
    }
  }

  if (!invoice) return <div>Invalid Invoice ID</div>;

  return (
    <div className='invoices-page'>
      {error && (<div className='error-container'>
        <span className='error-message'> ⚠ {error} </span>
      </div>)}
      <div className='header-wrapper'>
        <header>
          <h1> Invoice Details </h1>
          <p> {invoiceId} </p>
        </header>
        <span className={`status-badge ${statusColors[invoice.status]}`}>{invoice.status}</span>
      </div>
      {validationErrors.length > 0 && (
        <div className='error-container'>
          {validationErrors.map((err, index) => (
            <p key={index} className='error-message'> 
              ⚠ This invoice cannot be {targetAction?.toLowerCase()}; {(err.message.split('.')[0]).charAt(0).toLowerCase() + (err.message.split('.')[0]).slice(1) + '.'}
            </p>
          ))}
        </div>
      )}
      <div className='workflow-container'>
        {invoiceStatusWorkflows.map((status, index) => {
          const currentIndex = invoiceStatusWorkflows.indexOf(invoice.status);
          const isEnabled = index === currentIndex + 1;
          const label = status.charAt(0).toUpperCase() + status.slice(1);
          const nextStatusArg = label;
          return (
            <button className='workflow-button' key={status} disabled={!isEnabled} onClick={() => handleTransition(nextStatusArg)}>
              {label}
            </button>
          );
        })}
      </div>
      <div className='download-actions'>
        <button
          className='download-button'
          disabled={invoice.status !== 'finalised'}
          onClick={() => handleDownload(invoiceId!, 'xml')}
        >
          Download XML
        </button>
        <button
          className='download-button'
          style={{backgroundColor: 'var(--input-bg)', color: 'var(--text)', borderColor: 'var(--input-border)'}}
          disabled={invoice.status !== 'finalised'}
          onClick={() => handleDownload(invoiceId!, 'json')}
        >
          Download JSON
        </button>
      </div>
      <div className='card-container'>
        <div className='invoice-form'>
          <h1> Supplier </h1>
          <p style={{color: 'var(--text)', marginBottom: '3px'}}>{invoice.supplierName}</p>
          <p style={{color: 'var(--text-muted2)'}}>ABN: {invoice.supplierAbn}</p>
        </div>
        <div className='invoice-form'>
          <h1> Buyer </h1>
          <p style={{color: 'var(--text)', marginBottom: '3px'}}>{invoice.buyerName}</p>
          <p style={{color: 'var(--text-muted2)', marginBottom: '2px'}}>ABN: {invoice.buyerAbn}</p>
          <p style={{color: 'var(--text-muted2)'}}>Email: {invoice.buyerEmail}</p>
        </div>
      </div>
      <div className='invoice-form'>
        <h1> Items </h1>
        <table className='items-table'>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.itemsList.map((item, index) => (
              <tr key={index}>
                <td>{item.itemName}</td>
                <td>{item.quantity} {item.unitCode}</td>
                <td>${item.unitPrice.toFixed(2)}</td>
                <td>${item.totalPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className='totals-container'>
          <div className='totals-row'>
            <span style={{color: 'var(--text-muted2)'}}>Subtotal:</span>
            <span>${(invoice.totalPayable - invoice.taxAmount).toFixed(2)}</span>
          </div>
          <div className='totals-row'>
            <span style={{color: 'var(--text-muted2)'}}>Tax ({invoice.taxRate * 100}%):</span>
            <span>${invoice.taxAmount.toFixed(2)}</span>
          </div>
          <div className='totals-row grand-total'>
            <span>Total:</span>
            <span>${invoice.totalPayable.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className='invoice-form'>
        <h1> Payment Details </h1>
        <p style={{color: 'var(--text)', marginBottom: '3px'}}>Bank: {invoice.paymentDetails[0].bankName}</p>
        <p style={{color: 'var(--text-muted2)', marginBottom: '2px'}}>Account: {invoice.paymentDetails[0].accountNumber}</p>
        <p style={{color: 'var(--text-muted2)'}}>BSB: {invoice.paymentDetails[0].bsbAbnNumber}</p>
      </div>
      <div className='card-container'>
        <div className='invoice-form'>
          <h1> Additional Notes </h1>
          <p style={{color: 'var(--text)'}}>'{invoice.additionalNotes}'</p>
        </div>
        <div className='invoice-form'>
          <h1> Extra details </h1>
          <p> Created at: {new Date(invoice.createdAt).toLocaleString()}</p>
          <p> Updated at: {new Date(invoice.updatedAt).toLocaleString()}</p>
          {invoice.finalisedAt && (<p> Finalised at: {new Date(invoice.finalisedAt).toLocaleString()}</p>)}
        </div>
      </div>
    </div>
  );
}

export function EditInvoicePage(): React.ReactElement {
  const navigate = useNavigate();
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (invoiceId) {
      requestGetInvoice(invoiceId).then(setInvoice);
    }
  }, [invoiceId]);

  if (!invoice) return <div>Invalid Invoice ID</div>;

  return (
    <CreateInvoice
      initialData={invoice} 
      title = 'Edit Invoice'
      description='Update the details below to modify your invoice.'
      onSuccess={() => navigate('/invoices')}
    />
  );
}
