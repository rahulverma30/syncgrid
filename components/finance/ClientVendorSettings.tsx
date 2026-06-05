import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Truck,
  ShoppingCart,
  Plus,
  Save,
  X,
  Calendar,
  ClipboardCheck,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { Button, Input, Select, Modal } from '@/components/ui';
import { toast } from 'sonner';

interface ClientVendorSettingsProps {
  clientBilling: any[];
  vendors: any[];
  purchaseOrders: any[];
  onSaveBilling: (payload: any) => void;
  onSaveVendor: (payload: any) => void;
  onCreatePO: (payload: any) => void;
  onApprovePO: (id: string, status: 'approved' | 'rejected', comments: string) => void;
  role: string;
}

export const ClientVendorSettings: React.FC<ClientVendorSettingsProps> = ({
  clientBilling,
  vendors,
  purchaseOrders,
  onSaveBilling,
  onSaveVendor,
  onCreatePO,
  onApprovePO,
  role,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'clients' | 'vendors' | 'purchase_orders'>(
    'clients'
  );

  // Client billing modal
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [selectedClientBilling, setSelectedClientBilling] = useState<any | null>(null);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [clientIdVal, setClientIdVal] = useState('');
  const [billEmail, setBillEmail] = useState('');
  const [prefCurrency, setPrefCurrency] = useState('USD');
  const [payTerms, setPayTerms] = useState('net_30');
  const [taxExempt, setTaxExempt] = useState(false);
  const [taxRegVal, setTaxRegVal] = useState('');
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [creditLimit, setCreditLimit] = useState('50000');

  // Vendor Modal
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [vName, setVName] = useState('');
  const [vEmail, setVEmail] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vCat, setVCat] = useState('software');
  const [vTaxId, setVTaxId] = useState('');
  const [vPayTerms, setVPayTerms] = useState('net_30');
  const [vNotes, setVNotes] = useState('');

  // PO creation modal
  const [poModalOpen, setPOModalOpen] = useState(false);
  const [poVendorId, setPOVendorId] = useState('');
  const [projects, setProjects] = useState<any[]>([]);
  const [poProjectId, setPOProjectId] = useState('');
  const [poItems, setPOItems] = useState<any[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [poTax, setPOTax] = useState('0');
  const [poNotes, setPONotes] = useState('');

  // PO review modal
  const [activeReviewPO, setActiveReviewPO] = useState<any | null>(null);
  const [reviewPOComments, setReviewPOComments] = useState('');

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          fetch('/api/protected/clients'),
          fetch('/api/protected/projects'),
        ]);
        const cJson = await cRes.json();
        const pJson = await pRes.json();
        if (cJson.success) setClientsList(cJson.data);
        if (pJson.success) setProjects(pJson.data);
      } catch (err) {
        console.error('Error fetching settings dropdowns:', err);
      }
    };
    fetchDropdowns();
  }, []);

  // Client billing actions
  const handleOpenBilling = (profile?: any) => {
    if (profile) {
      setSelectedClientBilling(profile);
      setClientIdVal(profile.clientId?._id || '');
      setBillEmail(profile.billingEmail || '');
      setPrefCurrency(profile.preferredCurrency || 'USD');
      setPayTerms(profile.paymentTerms || 'net_30');
      setTaxExempt(profile.taxExempt || false);
      setTaxRegVal(profile.taxRegistrationNumber || '');
      setAutoInvoice(profile.automaticInvoicing || true);
      setCreditLimit(profile.creditLimit?.toString() || '50000');
    } else {
      setSelectedClientBilling(null);
      setClientIdVal('');
      setBillEmail('');
      setPrefCurrency('USD');
      setPayTerms('net_30');
      setTaxExempt(false);
      setTaxRegVal('');
      setAutoInvoice(true);
      setCreditLimit('50000');
    }
    setBillingModalOpen(true);
  };

  const handleSaveBillingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdVal) {
      toast.error('Client select is required');
      return;
    }

    const payload = {
      clientId: clientIdVal,
      billingEmail: billEmail,
      preferredCurrency: prefCurrency,
      paymentTerms: payTerms,
      taxExempt,
      taxRegistrationNumber: taxRegVal,
      automaticInvoicing: autoInvoice,
      creditLimit: Number(creditLimit) || 50000,
    };

    onSaveBilling(payload);
    setBillingModalOpen(false);
  };

  // Vendor actions
  const handleOpenVendor = (vendor?: any) => {
    if (vendor) {
      setSelectedVendor(vendor);
      setVName(vendor.name);
      setVEmail(vendor.email || '');
      setVPhone(vendor.phone || '');
      setVCat(vendor.category || 'software');
      setVTaxId(vendor.taxId || '');
      setVPayTerms(vendor.paymentTerms || 'net_30');
      setVNotes(vendor.notes || '');
    } else {
      setSelectedVendor(null);
      setVName('');
      setVEmail('');
      setVPhone('');
      setVCat('software');
      setVTaxId('');
      setVPayTerms('net_30');
      setVNotes('');
    }
    setVendorModalOpen(true);
  };

  const handleSaveVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim()) {
      toast.error('Vendor name is required');
      return;
    }

    const payload: Record<string, any> = {
      name: vName,
      email: vEmail,
      phone: vPhone,
      category: vCat,
      taxId: vTaxId,
      paymentTerms: vPayTerms,
      notes: vNotes || undefined,
    };

    if (selectedVendor) {
      payload._id = selectedVendor._id;
    }

    onSaveVendor(payload);
    setVendorModalOpen(false);
  };

  // PO actions
  const handleAddPOItem = () => {
    setPOItems([...poItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleUpdatePOItem = (index: number, key: string, val: any) => {
    setPOItems(poItems.map((item, idx) => (idx === index ? { ...item, [key]: val } : item)));
  };

  const handleRemovePOItem = (index: number) => {
    if (poItems.length === 1) return;
    setPOItems(poItems.filter((_, idx) => idx !== index));
  };

  const handlePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poVendorId) {
      toast.error('Please select a target vendor');
      return;
    }

    const payload = {
      vendorId: poVendorId,
      projectId: poProjectId || undefined,
      lineItems: poItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
      taxAmount: Number(poTax) || 0,
      notes: poNotes || undefined,
    };

    onCreatePO(payload);
    setPOModalOpen(false);
    setPOVendorId('');
    setPOProjectId('');
    setPOItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setPOTax('0');
    setPONotes('');
  };

  const handleOpenPOReview = (po: any) => {
    setActiveReviewPO(po);
    setReviewPOComments('');
  };

  const handleResolvePOReview = (status: 'approved' | 'rejected') => {
    if (!activeReviewPO) return;
    onApprovePO(activeReviewPO._id, status, reviewPOComments);
    setActiveReviewPO(null);
  };

  const isFinance = ['super-admin', 'admin', 'finance'].includes(role);

  return (
    <div className="space-y-6 select-none">
      {/* Sub menu controls */}
      <div className="flex justify-between items-center bg-card/25 border border-border/80 p-1.5 rounded-xl backdrop-blur-md select-none">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('clients')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'clients'
                ? 'bg-primary text-primary-foreground shadow'
                : 'hover:bg-accent/40 text-muted-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Client preferences
          </button>
          <button
            onClick={() => setActiveSubTab('vendors')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'vendors'
                ? 'bg-primary text-primary-foreground shadow'
                : 'hover:bg-accent/40 text-muted-foreground'
            }`}
          >
            <Truck className="h-4 w-4" />
            Vendor catalog
          </button>
          <button
            onClick={() => setActiveSubTab('purchase_orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'purchase_orders'
                ? 'bg-primary text-primary-foreground shadow'
                : 'hover:bg-accent/40 text-muted-foreground'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            Purchase orders
          </button>
        </div>

        {isFinance && (
          <div>
            {activeSubTab === 'clients' && (
              <Button
                onClick={() => handleOpenBilling()}
                size="sm"
                className="h-8 text-[10px] gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Configure billing
              </Button>
            )}
            {activeSubTab === 'vendors' && (
              <Button
                onClick={() => handleOpenVendor()}
                size="sm"
                className="h-8 text-[10px] gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> register vendor
              </Button>
            )}
            {activeSubTab === 'purchase_orders' && (
              <Button
                onClick={() => setPOModalOpen(true)}
                size="sm"
                className="h-8 text-[10px] gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> generate PO order
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Sub-tab content sheets */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'clients' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="border border-border/80 rounded-xl overflow-hidden backdrop-blur-md"
          >
            <table className="table-container">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header-cell">Customer Company</th>
                  <th className="table-header-cell">Billing Email</th>
                  <th className="table-header-cell">Preferred Currency</th>
                  <th className="table-header-cell">Payment Terms</th>
                  <th className="table-header-cell">VAT / Tax ID</th>
                  <th className="table-header-cell">Credit Limit</th>
                  {isFinance && <th className="table-header-cell text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {clientBilling.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No custom billing profiles configured.
                    </td>
                  </tr>
                ) : (
                  clientBilling.map((cb) => (
                    <tr key={cb._id} className="table-row">
                      <td className="table-body-cell font-bold text-foreground">
                        <div className="flex flex-col">
                          <span>{cb.clientId?.name}</span>
                          <span className="text-[9px] text-muted-foreground font-normal">
                            {cb.clientId?.company}
                          </span>
                        </div>
                      </td>
                      <td className="table-body-cell text-muted-foreground">{cb.billingEmail}</td>
                      <td className="table-body-cell font-bold">{cb.preferredCurrency}</td>
                      <td className="table-body-cell uppercase tracking-wider text-[9px] font-extrabold text-primary">
                        {cb.paymentTerms.replace('_', ' ')}
                      </td>
                      <td className="table-body-cell font-medium text-foreground">
                        {cb.taxRegistrationNumber || 'None'}
                      </td>
                      <td className="table-body-cell text-muted-foreground">
                        ${cb.creditLimit.toLocaleString()}
                      </td>
                      {isFinance && (
                        <td className="table-body-cell text-right">
                          <button
                            onClick={() => handleOpenBilling(cb)}
                            className="px-2.5 py-1 border border-border/80 hover:bg-accent/40 text-foreground font-bold rounded text-[8px] uppercase tracking-wider cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeSubTab === 'vendors' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="border border-border/80 rounded-xl overflow-hidden backdrop-blur-md"
          >
            <table className="table-container">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header-cell">Supplier Vendor</th>
                  <th className="table-header-cell">Contact email</th>
                  <th className="table-header-cell">phone Number</th>
                  <th className="table-header-cell">Category</th>
                  <th className="table-header-cell">TIN / EIN Tax ID</th>
                  <th className="table-header-cell">Terms</th>
                  {isFinance && <th className="table-header-cell text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      No vendor suppliers registered.
                    </td>
                  </tr>
                ) : (
                  vendors.map((v) => (
                    <tr key={v._id} className="table-row">
                      <td className="table-body-cell font-bold text-foreground">
                        <div className="flex flex-col">
                          <span>{v.name}</span>
                          {v.notes && (
                            <span className="text-[9px] text-muted-foreground font-normal">
                              {v.notes}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="table-body-cell text-muted-foreground">{v.email || 'None'}</td>
                      <td className="table-body-cell text-muted-foreground">{v.phone || 'None'}</td>
                      <td className="table-body-cell">
                        <span className="px-2 py-0.5 bg-muted/40 border border-border text-[9px] uppercase font-bold tracking-wider rounded-md">
                          {v.category}
                        </span>
                      </td>
                      <td className="table-body-cell font-medium text-foreground">
                        {v.taxId || 'None'}
                      </td>
                      <td className="table-body-cell uppercase tracking-wider text-[9px] font-extrabold text-primary">
                        {v.paymentTerms.replace('_', ' ')}
                      </td>
                      {isFinance && (
                        <td className="table-body-cell text-right">
                          <button
                            onClick={() => handleOpenVendor(v)}
                            className="px-2.5 py-1 border border-border/80 hover:bg-accent/40 text-foreground font-bold rounded text-[8px] uppercase tracking-wider cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}

        {activeSubTab === 'purchase_orders' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="border border-border/80 rounded-xl overflow-hidden backdrop-blur-md"
          >
            <table className="table-container">
              <thead>
                <tr className="table-header-row">
                  <th className="table-header-cell">PO Number</th>
                  <th className="table-header-cell">Supplier Vendor</th>
                  <th className="table-header-cell">Order Date</th>
                  <th className="table-header-cell">total procurement</th>
                  <th className="table-header-cell">Status</th>
                  {isFinance && <th className="table-header-cell text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No Purchase Orders generated.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => {
                    const statusStyles: Record<string, string> = {
                      pending_approval:
                        'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse',
                      approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                      rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                      completed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
                    };

                    return (
                      <tr key={po._id} className="table-row">
                        <td className="table-body-cell font-bold text-foreground">{po.poNumber}</td>
                        <td className="table-body-cell font-semibold">
                          <div className="flex flex-col">
                            <span>{po.vendorId?.name}</span>
                            {po.projectId && (
                              <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                                Project: {po.projectId?.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="table-body-cell text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 opacity-60" />
                            {new Date(po.orderDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="table-body-cell font-bold text-foreground">
                          ${po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="table-body-cell">
                          <span
                            className={`px-2 py-0.5 text-[9px] uppercase font-extrabold tracking-wider border rounded-full ${statusStyles[po.status] || statusStyles.pending_approval}`}
                          >
                            {po.status.replace('_', ' ')}
                          </span>
                        </td>
                        {isFinance && (
                          <td className="table-body-cell text-right">
                            {po.status === 'pending_approval' ? (
                              <button
                                onClick={() => handleOpenPOReview(po)}
                                className="px-3 py-1 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded text-[10px] uppercase tracking-wider cursor-pointer"
                              >
                                Review PO
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-semibold italic select-none">
                                PO resolved
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Billing configuration modal */}
      <Modal
        isOpen={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        title="Configure client billing terms"
        size="md"
      >
        <form onSubmit={handleSaveBillingSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Select
              label="Select Customer"
              disabled={selectedClientBilling !== null}
              value={clientIdVal}
              onChange={(val) => setClientIdVal(val)}
              placeholder="Select Customer Client..."
              options={clientsList.map((c) => ({
                value: c._id,
                label: c.name,
              }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Billing email <span className="text-destructive">*</span>
            </label>
            <Input
              required
              type="email"
              value={billEmail}
              onChange={(e) => setBillEmail(e.target.value)}
              placeholder="billing@customer.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Select
                label="Currency"
                value={prefCurrency}
                onChange={(val) => setPrefCurrency(val)}
                options={[
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GBP', label: 'GBP (£)' },
                  { value: 'INR', label: 'INR (₹)' },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Select
                label="Terms"
                value={payTerms}
                onChange={(val) => setPayTerms(val)}
                options={[
                  { value: 'due_on_receipt', label: 'Due on receipt' },
                  { value: 'net_15', label: 'Net 15' },
                  { value: 'net_30', label: 'Net 30' },
                  { value: 'net_60', label: 'Net 60' },
                ]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              VAT / tax registration ID
            </label>
            <Input
              value={taxRegVal}
              onChange={(e) => setTaxRegVal(e.target.value)}
              placeholder="VAT-9827382"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Credit cap limit ($ USD)
            </label>
            <Input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setBillingModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Adjust Configuration</Button>
          </div>
        </form>
      </Modal>

      {/* Vendor Profile modal */}
      <Modal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        title={selectedVendor ? 'Adjust Vendor Profile' : 'Register vendor supplier'}
        size="md"
      >
        <form onSubmit={handleSaveVendorSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Vendor Name <span className="text-destructive">*</span>
            </label>
            <Input
              required
              value={vName}
              onChange={(e) => setVName(e.target.value)}
              placeholder="e.g. Amazon Web Services AWS"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Contact Email</label>
              <Input
                type="email"
                value={vEmail}
                onChange={(e) => setVEmail(e.target.value)}
                placeholder="billing@supplier.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Phone Number</label>
              <Input
                value={vPhone}
                onChange={(e) => setVPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <Select
                label="Category"
                value={vCat}
                onChange={(val) => setVCat(val)}
                placeholder="Select category..."
                options={[
                  { value: 'software', label: 'Software/SaaS' },
                  { value: 'hardware', label: 'Hardware infrastructure' },
                  { value: 'consulting', label: 'Auditing/Consulting' },
                  { value: 'office_supplies', label: 'Office supplies' },
                  { value: 'marketing', label: 'Marketing campaigns' },
                  { value: 'rent', label: 'Rent/Lease' },
                  { value: 'other', label: 'Other Operations' },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Select
                label="Terms"
                value={vPayTerms}
                onChange={(val) => setVPayTerms(val)}
                placeholder="Select terms..."
                options={[
                  { value: 'due_on_receipt', label: 'Due on receipt' },
                  { value: 'net_15', label: 'Net 15' },
                  { value: 'net_30', label: 'Net 30' },
                  { value: 'net_60', label: 'Net 60' },
                ]}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              EIN / TIN tax registration number
            </label>
            <Input
              value={vTaxId}
              onChange={(e) => setVTaxId(e.target.value)}
              placeholder="US-12345678"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Notes</label>
            <Input
              value={vNotes}
              onChange={(e) => setVNotes(e.target.value)}
              placeholder="Brief description"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setVendorModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Adjust Directory</Button>
          </div>
        </form>
      </Modal>

      {/* PO Creation modal */}
      <Modal
        isOpen={poModalOpen}
        onClose={() => setPOModalOpen(false)}
        title="Generate Purchase Order"
        size="lg"
      >
        <form onSubmit={handlePOSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4 items-end">
            <div className="space-y-1.5">
              <Select
                label="Supplier Vendor *"
                value={poVendorId}
                onChange={(val) => setPOVendorId(val)}
                placeholder="Select Vendor..."
                options={vendors.map((v) => ({
                  value: v._id,
                  label: v.name,
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <Select
                label="Linked Project (Optional)"
                value={poProjectId}
                onChange={(val) => setPOProjectId(val)}
                placeholder="No Project Linked..."
                options={projects.map((p) => ({
                  value: p._id,
                  label: p.name,
                }))}
              />
            </div>
          </div>

          {/* Line Items PO builder */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-foreground">Procurement Line Items</label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddPOItem}>
                + Add Item
              </Button>
            </div>

            <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
              {poItems.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <Input
                    required
                    value={item.description}
                    onChange={(e) => handleUpdatePOItem(idx, 'description', e.target.value)}
                    placeholder="e.g. AWS server cloud configurations"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    required
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleUpdatePOItem(idx, 'quantity', Number(e.target.value))}
                    className="w-20 text-center"
                    placeholder="Qty"
                  />
                  <Input
                    type="number"
                    required
                    min={0.01}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => handleUpdatePOItem(idx, 'unitPrice', Number(e.target.value))}
                    className="w-32"
                    placeholder="Price"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={poItems.length === 1}
                    onClick={() => handleRemovePOItem(idx)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Estimated Taxes Total</label>
              <Input
                type="number"
                value={poTax}
                onChange={(e) => setPOTax(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Procurement Description Notes
              </label>
              <Input
                value={poNotes}
                onChange={(e) => setPONotes(e.target.value)}
                placeholder="Special instructions"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setPOModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Transmit PO</Button>
          </div>
        </form>
      </Modal>

      {/* PO review modal */}
      <Modal
        isOpen={!!activeReviewPO}
        onClose={() => setActiveReviewPO(null)}
        title="Review Purchase Order"
        size="md"
      >
        {activeReviewPO && (
          <div className="space-y-4 pt-2">
            <div className="bg-muted/30 p-4 rounded-xl border border-border text-sm space-y-3 select-none">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PO Number:</span>
                <span className="font-semibold">{activeReviewPO.poNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier Vendor:</span>
                <span className="font-semibold">{activeReviewPO.vendorId?.name}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border font-bold text-foreground">
                <span>PO Amount:</span>
                <span>
                  $
                  {activeReviewPO.totalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Approver Notes / Comments
              </label>
              <textarea
                value={reviewPOComments}
                onChange={(e) => setReviewPOComments(e.target.value)}
                placeholder="Include validation detail or purchase clearance..."
                className="w-full h-20 p-3 bg-background border border-input text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="destructive" onClick={() => handleResolvePOReview('rejected')}>
                Reject PO
              </Button>
              <Button onClick={() => handleResolvePOReview('approved')} className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                Approve PO
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
