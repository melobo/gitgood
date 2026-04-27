import { useRef, useState } from 'react';
import { IconTrash, IconSparkles, IconUpload, IconPencil, IconArrowLeft, IconPlusFilled, IconFile, IconFileX } from '@tabler/icons-react';
import { validBanks, InvoiceItem, PaymentDetails, CreateInvoiceProperties, InvoiceFormInput, InvoiceItemErrors, PaymentDetailsErrors,AutofillResponse, PartialInvoice, CreateInvoiceInput } from './types';
import { requestCreateInvoice, requestAiAutofill, requestBulkCreateInvoice } from './httpWrappers';
import { useNavigate, useLocation } from 'react-router-dom';

export function CreateLayout(): React.ReactElement {
  const navigate = useNavigate();
  return (
    <div className='create-page'>
      <header>
        <h1> Create Invoice </h1>
        <p> How would you like to create your invoice? </p>
      </header>
      <div className='mode-cards'>
        <button className='mode-card' type='button' onClick={() => navigate('/invoices/create/manual')}>
          <IconPencil size={64} />
          <div className='mode-card-header'>Manual</div>
          <div className='mode-card-text'>Fill in the invoice details yourself</div>
        </button>
        <button className='mode-card' type='button' onClick={() => navigate('/invoices/create/autofill')}>
          <IconSparkles size={64} />
          <div className='mode-card-header'>AI Autofill</div>
          <div className='mode-card-text'>Describe invoice or upload JSON file to autofill</div>
        </button>
        <button className='mode-card' type='button' onClick={() => navigate('/invoices/create/bulk')}>
          <IconUpload size={64} />
          <div className='mode-card-header'>Bulk Upload</div>
          <div className='mode-card-text'>Upload multiple invoices at once via file</div>
        </button>
      </div>
    </div>
  );
}

export function CreateInvoice({ onSuccess }: CreateInvoiceProperties) {
  const navigate = useNavigate();
  const location = useLocation();
  const autofill = location.state?.autofill as AutofillResponse | undefined;;
  const [formInput, setFormInput] = useState<InvoiceFormInput>({
    buyerName: autofill?.invoice.buyerName ?? '',
    buyerAbn: autofill?.invoice.buyerAbn ?? '',
    buyerEmail: '',
    supplierName: autofill?.invoice.supplierName ?? '',
    supplierAbn: autofill?.invoice.supplierAbn ?? '',
    issueDate: autofill?.invoice.issueDate ?? '',
    paymentDueDate: autofill?.invoice.paymentDueDate ?? '',
    taxRate: autofill?.invoice.taxRate ?? 0.10,
    additionalNotes: autofill?.invoice.additionalNotes ?? '',
  });
  const [items, setItems] = useState<InvoiceItem[]>(autofill?.invoice.itemsList ?? []);
  const [payment, setPayment] = useState<PaymentDetails>(autofill?.invoice.paymentDetails?.[0] ?? {
    bankName: validBanks[0],
    accountNumber: '',
    bsbAbnNumber: '',
    paymentMethod: 'bank_transfer',
  });
  const [formTouched, setFormTouched] = useState<Partial<Record<keyof InvoiceFormInput, boolean>>>({});
  const [itemTouched, setItemTouched] = useState<Record<number, Partial<Record<keyof InvoiceItem, boolean>>>>({});
  const [paymentTouched, setPaymentTouched] = useState<Partial<Record<keyof PaymentDetails, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  function markFormTouched(field: keyof InvoiceFormInput) {
    setFormTouched(prev => ({ ...prev, [field]: true }));
  }

  function markItemTouched(index: number, field: keyof InvoiceItem) {
    setItemTouched(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: true,
      },
    }));
  }

  function markPaymentTouched(field: keyof PaymentDetails) {
    setPaymentTouched(prev => ({ ...prev, [field]: true }));
  }

  function showFormError(field: keyof InvoiceFormInput) {
    return submitted || formTouched[field];
  }

  function showItemError(index: number, field: keyof InvoiceItem) {
    return submitted || itemTouched[index]?.[field];
  }

  function showPaymentError(field: keyof PaymentDetails) {
    return submitted || paymentTouched[field];
  }

  function addItem() {
    setItems([...items, {
      itemName: '', quantity: 1, unitPrice: 0, unitCode: '', totalPrice: 0
    }]);
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    const updates = [...items];
    updates[index] = { ...updates[index], [field]: value };
    updates[index].totalPrice = updates[index].quantity * updates[index].unitPrice;
    setItems(updates);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function validateFormInput(input: InvoiceFormInput): Partial<InvoiceFormInput> {
    const errors: Partial<InvoiceFormInput> = {};

    if (!input.buyerName) {
      errors.buyerName = 'Buyer name is required.';
    }
    if (!input.buyerAbn || input.buyerAbn.length !== 11) {
      errors.buyerAbn = 'Invalid buyer ABN.';
    }
    if (!input.buyerEmail) {
      errors.buyerEmail = 'Buyer email is required.';
    } else if (!input.buyerEmail.includes('@')) {
      errors.buyerEmail = 'Invalid email format.';
    }
    if (!input.supplierName) {
      errors.supplierName = 'Supplier name is required.';
    }
    if (!input.supplierAbn || input.supplierAbn.length !== 11) {
      errors.supplierAbn = 'Invalid supplier ABN.';
    }
    if (!input.issueDate) {
      errors.issueDate = 'Issue date is required.';
    }
    if (!input.paymentDueDate) {
      errors.paymentDueDate = 'Due date is required.';
    }

    const issueDate = new Date(input.issueDate);
    const paymentDueDate = new Date(input.paymentDueDate);
    const today = new Date();
    if (input.issueDate && issueDate > today) {
      errors.issueDate = 'Issue date cannot be in the future.';
    }
    if (input.paymentDueDate && paymentDueDate < issueDate) {
      errors.paymentDueDate = 'Due date must be after issue date.';
    }
    return errors;
  }

  function validateItems(items: InvoiceItem[]): InvoiceItemErrors[] {
    return items.map(i => {
      const errors: InvoiceItemErrors = {};
      if (!i.itemName) {
        errors.itemName = 'Item name is required.';
      }
      if (i.quantity <= 0) {
        errors.quantity = 'Item quantity must be > 0.';
      }
      if (i.unitPrice < 0) {
        errors.unitPrice = 'Item price cannot be negative.';
      }
      return errors;
    });
  }

  function validatePayment(payment: PaymentDetails): PaymentDetailsErrors {
    const errors: PaymentDetailsErrors = {};
    if (!payment.accountNumber || !/^\d+$/.test(payment.accountNumber)) {
      errors.accountNumber = 'Invalid account number.';
    }
    if (!payment.bsbAbnNumber || !/^\d{3}-\d{3}$/.test(payment.bsbAbnNumber)) {
      errors.bsbAbnNumber = 'Invalid BSB format.';
    }
    return errors;
  }

  const liveFormErrors = validateFormInput(formInput);
  const liveItemErrors = validateItems(items);
  const livePaymentErrors = validatePayment(payment);

  const hasItemErrors = liveItemErrors.some(e => Object.keys(e).length > 0);

  const canSubmit = items.length > 0 && Object.keys(liveFormErrors).length === 0 &&
    !hasItemErrors && Object.keys(livePaymentErrors).length === 0;

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitted(true);

    if (!canSubmit) {
      return;
    }

    await requestCreateInvoice(
      formInput.buyerName,
      formInput.buyerAbn,
      formInput.supplierName,
      formInput.supplierAbn,
      new Date(formInput.issueDate).toISOString().split('T')[0],
      new Date(formInput.paymentDueDate).toISOString().split('T')[0],
      items.map(i => ({
        ...i,
        totalPrice: i.quantity * i.unitPrice,
      })),
      formInput.taxRate,
      [payment],
      formInput.additionalNotes
    );
    onSuccess();
  }

  return (
    <form className='create-page' onSubmit={handleSubmit}>
      <header>
        <h1> New Invoice </h1>
        <p> Fill in the details below to create your invoice. </p>
      </header>
      <button className='back-button' type='button' onClick={() => navigate('/invoices/create')}>
        <IconArrowLeft size={14}/>
        <span> Back</span>
      </button>
      {autofill && (
        <div className={`confidence-banner confidence-${autofill.confidence}`}>
          {autofill.confidence === 'high' && '✓ Most fields filled – review and submit.'}
          {autofill.confidence === 'medium' && '⚠ Some fields filled – check the form carefully.'}
          {autofill.confidence === 'low' && '⚠ Few fields found – you may need to fill most manually.'}
        </div>
      )}
      <div className='invoice-form'>
        <h1> Parties </h1>
        <div className='form-grid1'>
          <div className='field'>
            <label>Supplier Name</label>
            <div className={`input-container ${showFormError('supplierName') && liveFormErrors.supplierName ? 'input-error' : ''}`}>
              <input
                type='text'
                placeholder='Your Business Ltd'
                value={formInput.supplierName}
                onBlur={() => markFormTouched('supplierName')}
                onChange={e => setFormInput(prev => ({ ...prev, supplierName: e.target.value }))}
              />
            </div>
            {showFormError('supplierName') && liveFormErrors.supplierName && (
              <span className='error-message'> ⚠ {liveFormErrors.supplierName} </span>
            )}
          </div>
          <div className='field'>
            <label>Supplier ABN</label>
            <div className={`input-container ${showFormError('supplierAbn') && liveFormErrors.supplierAbn ? 'input-error' : ''}`}>
              <input
                placeholder='12 345 678 901'
                value={formInput.supplierAbn}
                onBlur={() => markFormTouched('supplierAbn')}
                onChange={e => setFormInput(prev => ({ ...prev, supplierAbn: e.target.value }))}
              />
            </div>
            {showFormError('supplierAbn') && liveFormErrors.supplierAbn && (
              <span className='error-message'> ⚠ {liveFormErrors.supplierAbn} </span>
            )}
          </div>
          <div className='field'>
            <label>Buyer Name</label>
            <div className={`input-container ${showFormError('buyerName') && liveFormErrors.buyerName ? 'input-error' : ''}`}>
              <input
                type='text'
                placeholder='Client Company'
                value={formInput.buyerName}
                onBlur={() => markFormTouched('buyerName')}
                onChange={e => setFormInput(prev => ({ ...prev, buyerName: e.target.value }))}
              />
            </div>
            {showFormError('buyerName') && liveFormErrors.buyerName && (
              <span className='error-message'> ⚠ {liveFormErrors.buyerName} </span>
            )}
          </div>
          <div className='field'>
            <label>Buyer ABN</label>
            <div className={`input-container ${showFormError('buyerAbn') && liveFormErrors.buyerAbn ? 'input-error' : ''}`}>
              <input
                placeholder='98 765 432 109'
                value={formInput.buyerAbn}
                onBlur={() => markFormTouched('buyerAbn')}
                onChange={e => setFormInput(prev => ({ ...prev, buyerAbn: e.target.value }))}
              />
            </div>
            {showFormError('buyerAbn') && liveFormErrors.buyerAbn && (
              <span className='error-message'> ⚠ {liveFormErrors.buyerAbn} </span>
            )}
          </div>
          <div className='field'>
            <label>Buyer Email</label>
            <div className={`input-container ${showFormError('buyerEmail') && liveFormErrors.buyerEmail ? 'input-error' : ''}`}>
              <input
                type='email'
                placeholder='client@gmail.com'
                value={formInput.buyerEmail}
                onBlur={() => markFormTouched('buyerEmail')}
                onChange={e => setFormInput(prev => ({ ...prev, buyerEmail: e.target.value }))}
              />
            </div>
            {showFormError('buyerEmail') && liveFormErrors.buyerEmail && (
              <span className='error-message'> ⚠ {liveFormErrors.buyerEmail} </span>
            )}
          </div>
        </div>
      </div>
      <div className='invoice-form'>
        <h1> Dates & Tax </h1>
        <div className='form-grid2'>
          <div className='field'>
            <label>Issue Date</label>
            <div className={`input-container ${showFormError('issueDate') && liveFormErrors.issueDate ? 'input-error' : ''}`}>
              <input
                type='date'
                value={formInput.issueDate}
                onBlur={() => markFormTouched('issueDate')}
                onChange={e => setFormInput(prev => ({ ...prev, issueDate: e.target.value }))}
              />
            </div>
            {showFormError('issueDate') && liveFormErrors.issueDate && (
              <span className='error-message'> ⚠ {liveFormErrors.issueDate} </span>
            )}
          </div>
          <div className='field'>
            <label>Due Date</label>
            <div className={`input-container ${showFormError('paymentDueDate') && liveFormErrors.paymentDueDate ? 'input-error' : ''}`}>
              <input
                type='date'
                value={formInput.paymentDueDate}
                onBlur={() => markFormTouched('paymentDueDate')}
                onChange={e => setFormInput(prev => ({ ...prev, paymentDueDate: e.target.value }))}
              />
            </div>
            {showFormError('paymentDueDate') && liveFormErrors.paymentDueDate && (
              <span className='error-message'> ⚠ {liveFormErrors.paymentDueDate} </span>
            )}
          </div>
          <div className='field'>
            <label>Tax Rate</label>
            <div className={`input-container ${showFormError('taxRate') && liveFormErrors.taxRate ? 'input-error' : ''}`}>
              <input
                type='number'
                placeholder='0.1'
                step={0.1}
                min='0'
                value={formInput.taxRate}
                onBlur={() => markFormTouched('taxRate')}
                onChange={e => {
                  const numValue = Number(e.target.value) || 0;
                  setFormInput(prev => ({ ...prev, taxRate: numValue }));
                }}
              />
            </div>
            {showFormError('taxRate') && liveFormErrors.taxRate && (
              <span className='error-message'> ⚠ {liveFormErrors.taxRate} </span>
            )}
          </div>
        </div>
      </div>
      <div className='invoice-form'>
        <div className='header-wrapper'>
          <h1> Line Items </h1>
          <button className='icon-button' type='button' onClick={addItem}>
            <IconPlusFilled size={12}/>Add
          </button>
        </div>
        <table className='line-items-table'>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Unit Code</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>
                  <input
                    type='text'
                    placeholder='Item name'
                    value={item.itemName}
                    onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                    onBlur={() => markItemTouched(index, 'itemName')}
                  />
                  {showItemError(index, 'itemName') && liveItemErrors[index]?.itemName && (
                    <span className='error-message'> ⚠ {liveItemErrors[index].itemName} </span>
                  )}
                </td>
                <td>
                  <input
                    type='number'
                    min='1'
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    onBlur={() => markItemTouched(index, 'quantity')}
                  />
                  {showItemError(index, 'quantity') && liveItemErrors[index]?.quantity && (
                    <span className='error-message'> ⚠ {liveItemErrors[index].quantity} </span>
                  )}
                </td>
                <td className='price-cell'>
                  <div className='input-group'>
                    <span className='currency'>$</span>
                    <input
                      className='amount'
                      type='number'
                      min='0'
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                      onBlur={() => markItemTouched(index, 'unitPrice')}
                    />
                  </div>
                  {showItemError(index, 'unitPrice') && liveItemErrors[index]?.unitPrice && (
                    <span className='error-message'> ⚠ {liveItemErrors[index].unitPrice} </span>
                  )}
                </td>
                <td>
                  <input
                    type='text'
                    placeholder='HR'
                    value={item.unitCode}
                    onChange={(e) => updateItem(index, 'unitCode', e.target.value)}
                    onBlur={() => markItemTouched(index, 'unitCode')}
                  />
                </td>
                <td className='price-cell'>
                  <div className='input-group'>
                    <span className='currency'>$</span>
                    <span className='amount'>{item.totalPrice.toFixed(2)}</span>
                  </div>
                </td>
                <td>
                  <button className='delete-icon-button' type='button' onClick={() => removeItem(index)}>
                    <IconTrash size={12}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {submitted && items.length === 0 && (
          <span className='error-message'>
            ⚠ Add at least one item to continue
          </span>
        )}
      </div>
      <div className='invoice-form'>
        <h1> Payment Details </h1>
        <div className='form-grid2'>
          <div className='field'>
            <label>Bank Name</label>
            <div className='input-container select-container'>
              <select
                value={payment.bankName || ''}
                onChange={e => setPayment(prev => ({...prev, bankName: e.target.value}))}
              >
                {validBanks.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
          </div>
          <div className='field'>
            <label>Account Number</label>
            <div className={`input-container ${submitted && livePaymentErrors.accountNumber ? 'input-error' : ''}`}>
              <input
                placeholder='123456789'
                value={payment.accountNumber}
                onChange={e => setPayment(prev => ({ ...prev, accountNumber: e.target.value }))}
                onBlur={() => markPaymentTouched('accountNumber')}
              />
            </div>
            {showPaymentError('accountNumber') && livePaymentErrors.accountNumber && (
              <span className='error-message'> ⚠ {livePaymentErrors.accountNumber} </span>
            )}
          </div>
          <div className='field'>
            <label>BSB</label>
            <div className={`input-container ${submitted && livePaymentErrors.bsbAbnNumber ? 'input-error' : ''}`}>
              <input
                placeholder='062-000'
                value={payment.bsbAbnNumber}
                onChange={e => setPayment(prev => ({ ...prev, bsbAbnNumber: e.target.value }))}
                onBlur={() => markPaymentTouched('bsbAbnNumber')}
              />
            </div>
            {showPaymentError('bsbAbnNumber') && livePaymentErrors.bsbAbnNumber && (
              <span className='error-message'> ⚠ {livePaymentErrors.bsbAbnNumber} </span>
            )}
          </div>
        </div>
      </div>
      <div className='invoice-form'>
        <h1> Additional Notes </h1>
        <div className='input-container'>
          <input
            value={formInput.additionalNotes}
            placeholder='Add any additional notes here (e.g. special instructions, reference details)'
            onChange={e => setFormInput(prev => ({ ...prev, additionalNotes: e.target.value }))}
          />
        </div>
      </div>
      <button className= 'submit-button' type='submit'>
        Create Invoice
      </button>
    </form>
  );
}

export function CreateInvoiceAutofill() {
  const navigate = useNavigate();

  const [rawText, setRawText] = useState('');
  const [partial, setPartial] = useState<PartialInvoice | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setFileError(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setPartial(parsed);
      setFilename(file.name);
    } catch {
      setFileError('Invalid JSON file – please check the format and try again.');
      setPartial(null);
      setFilename(null);
    }
  }

  function removeFile() {
    setPartial(null);
    setFilename(null);
    setFileError(null);
  }

  const canSubmit = rawText.trim().length > 0 || partial !== null;

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    const result = await requestAiAutofill({
      rawText: rawText.trim() || undefined,
      partial: partial ?? undefined,
    });
    navigate('/invoices/create/manual', { state: { autofill: result } });
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <form className='create-page' onSubmit={handleSubmit}>
      <header>
        <h1> AI Autofill </h1>
        <p> Describe your invoice or upload a JSON file – we'll prefill the form for you. </p>
      </header>
      <button className='back-button' type='button' onClick={() => navigate('/invoices/create')}>
        <IconArrowLeft size={14}/>
        <span> Back</span>
      </button>
      <div className='invoice-form'>
        <h1 style={{marginBottom:'3px'}}> Describe your invoice </h1>
        <p> Include details like party names, ABNs, items, amounts, and dates. </p>
        <div className='input-container'>
          <input
            type='text'
            placeholder='e.g. Invoice for web development to Acme Corp...'
            onChange={e => setRawText(e.target.value)}
          />
        </div>
      </div>
      <div className='invoice-form'>
        <h1 style={{marginBottom:'3px'}}> Upload a JSON file </h1>
        <p> Upload a partial invoice JSON to prefill specific fields. </p>
        <div className='input-container'>
          {filename ? (
            <div className='selected-file-item'>
              <IconFile size={18} />
              <span>{filename}</span>
              <button type='button' className='delete-icon-button' onClick={removeFile}>
                <IconFileX size={12} />
              </button>
            </div>
          ) : (
            <div className='upload-file-item' onClick={() => fileInputRef.current?.click()}>
              <IconUpload size={18} />
              <span>Choose file</span>
              <input
                ref={fileInputRef}
                type='file'
                accept='.json'
                onChange={handleFileUpload} 
                style={{display: 'none'}}
              />
            </div>
          )}
        </div>
        {fileError && (<span className='error-message'> ⚠ {fileError} </span>)}
      </div>
      <button className= 'submit-button' type='submit' disabled={!canSubmit}>
        ✦ Autofill invoice
      </button>
    </form>
  )
}

export function CreateInvoiceBulk() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<CreateInvoiceInput[]>([]);
  const [filenames, setFilenames] = useState<string[]>([]);
  const [fileErrors, setFileErrors] = useState<(string | null)[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validateInvoice(invoice: CreateInvoiceInput): string | null {
    if (!invoice.buyerName) {
      return 'buyer name';
    }
    if (!invoice.buyerAbn || invoice.buyerAbn.length !== 11) {
      return 'a valid buyer ABN';
    }
    if (!invoice.supplierName) {
      return 'supplier name';
    }
    if (!invoice.supplierAbn || invoice.supplierAbn.length !== 11) {
      return 'a valid supplier ABN';
    }
    if (!invoice.issueDate) {
      return 'an issue date';
    }
    if (!invoice.paymentDueDate) {
      return 'a payment due date';
    }

    const issueDate = new Date(invoice.issueDate);
    const paymentDueDate = new Date(invoice.paymentDueDate);
    const today = new Date();
    if (issueDate > today) {
      return 'a valid issue date (cannot be in the future)';
    }
    if (paymentDueDate < issueDate) {
      return 'a valid due date (must be after issue date)';
    }

    if (!Array.isArray(invoice.itemsList) || invoice.itemsList.length === 0) {
      return 'at least one line item';
    }
    for (const item of invoice.itemsList) {
      if (!item.itemName) {
        return 'an item name';
      }
      if (item.quantity <= 0) {
        return `a valid quantity for '${item.itemName}'`;
      }
      if (item.unitPrice < 0) {
        return `a valid price for '${item.itemName}'`;
      }
    }
    if (!invoice.taxRate) {
      return 'a tax rate';
    }
    if (!Array.isArray(invoice.paymentDetails) || invoice.paymentDetails.length === 0) {
      return 'payment details';
    }
    for (const payment of invoice.paymentDetails) {
      if (!payment.accountNumber || !/^\d+$/.test(payment.accountNumber)) {
        return 'a valid account number';
      }
      if (!payment.bsbAbnNumber || !/^\d{3}-\d{3}$/.test(payment.bsbAbnNumber)) {
        return 'a valid BSB';
      }
    }
    return null;
  }

  async function handleFilesUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      if (filenames.includes(file.name)) {
        continue;
      }
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const validationError = validateInvoice(parsed);
        setInvoices(prev => [...prev, parsed]);
        setFilenames(prev => [...prev, file.name]);
        setFileErrors(prev => [...prev, validationError]);
      } catch {
        setInvoices(prev => [...prev, {} as CreateInvoiceInput]);
        setFilenames(prev => [...prev, file.name]);
        setFileErrors(prev => [...prev, 'Invalid JSON file – please check the format and try again.']);
      }
    }
  }

  function removeFile(index: number) {
    setInvoices(prev => prev.filter((_, i) => i !== index));
    setFilenames(prev => prev.filter((_, i) => i !== index));
    setFileErrors(prev => prev.filter((_, i) => i !== index));
  }

  const canSubmit = invoices.length > 0 && fileErrors.every(e => e === null);

  async function handleSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    try {
      await requestBulkCreateInvoice(invoices);
      navigate('/invoices');
    } catch (err) {
      if (err instanceof Error) {
        setSubmitError(err.message ?? 'Something went wrong.');
      }
      setSubmitError('Something went wrong.');
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <form className='create-page' onSubmit={handleSubmit}>
      <header>
        <h1> Bulk Create </h1>
        <p> Upload multiple invoice JSON files to create them all at once. </p>
      </header>
      <button className='back-button' type='button' onClick={() => navigate('/invoices/create')}>
        <IconArrowLeft size={14}/>
        <span> Back</span>
      </button>
      <div className='invoice-form'>
        <h1 style={{marginBottom:'3px'}}> Upload JSON files </h1>
        <p> Each file should match the invoice JSON format. All invoices are validated before any are saved. </p>
        <div className='input-container'>
          <div className='upload-file-item' onClick={() => fileInputRef.current?.click()}>
            <IconUpload size={18} />
            <span> Choose files </span>
            <input
              ref={fileInputRef}
              type='file'
              accept='.json'
              multiple
              onChange={handleFilesUpload} 
              style={{display: 'none'}}
            />
          </div>
        </div>
        {filenames.map((filename, index) => (
          <div className='field' key={index} style={{ marginTop: index === 0 ? '8px' : '0px' }}>
            <div className={`input-container ${fileErrors[index] ? 'input-error' : ''}`}>
              <div className='selected-file-item'>
                <IconFile size={18} />
                <span>{filename}</span>
                <button type='button' className='delete-icon-button' onClick={() => removeFile(index)}>
                  <IconFileX size={12} />
                </button>
              </div>
            </div>
            {fileErrors[index] && (<span className='error-message'> ⚠ Invoice contained in {filename} is missing {fileErrors[index]}. </span>)}
          </div>
        ))}
      </div>
      {submitError && (<span className='error-message'> ⚠ {submitError} </span>)}
      <button className= 'submit-button' type='submit' disabled={!canSubmit}>
        Create {invoices.length > 1 ? `${invoices.length} invoices` : 'invoice'}
      </button>
    </form>
  )
}
