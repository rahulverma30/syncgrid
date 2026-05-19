import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calculator, Save, X, DollarSign } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { toast } from 'sonner';

interface InvoiceBuilderProps {
  onClose: () => void;
  onSubmit: (payload: any) => void;
  role: string;
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ onClose, onSubmit, role }) => {
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  // Form states
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState('1.0');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Net 30. Payment clear within 30 days of bill transmission.');

  // Line items state
  const [lineItems, setLineItems] = useState<any[]>([
    { description: '', quantity: 1, unitPrice: 0, taxRate: 18, discountAmount: 0 },
  ]);

  // Fetch client & projects dropdown records
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          fetch('/api/protected/clients'),
          fetch('/api/protected/projects'),
        ]);
        const cJson = await cRes.json();
        const pJson = await pRes.json();
        if (cJson.success) setClients(cJson.data);
        if (pJson.success) setProjects(pJson.data);
      } catch (err) {
        console.error('Error fetching builder clients dropdowns:', err);
      }
    };
    loadDropdowns();
  }, []);

  // Compute live arithmetic during render
  const totals = useMemo(() => {
    let sub = 0;
    let tax = 0;
    let disc = 0;

    lineItems.forEach((item) => {
      const amt = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      const taxAmt = (amt * (Number(item.taxRate) || 0)) / 100;
      sub += amt;
      tax += taxAmt;
      disc += Number(item.discountAmount) || 0;
    });

    return {
      subtotal: sub,
      taxTotal: tax,
      discountTotal: disc,
      grandTotal: Math.max(0, sub + tax - disc),
    };
  }, [lineItems]);

  const handleAddItem = () => {
    setLineItems([
      ...lineItems,
      { description: '', quantity: 1, unitPrice: 0, taxRate: 18, discountAmount: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index: number, key: string, val: any) => {
    const updated = lineItems.map((item, idx) => {
      if (idx === index) {
        return { ...item, [key]: val };
      }
      return item;
    });
    setLineItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClient) {
      toast.error('Please select a target client customer');
      return;
    }
    if (!dueDate) {
      toast.error('Due date is required');
      return;
    }

    const invalid = lineItems.some(
      (item) => !item.description.trim() || item.quantity <= 0 || item.unitPrice < 0
    );
    if (invalid) {
      toast.error('Line items descriptions and positive prices are required');
      return;
    }

    const payload = {
      clientId: selectedClient,
      projectId: selectedProject || undefined,
      dueDate: new Date(dueDate),
      currency,
      exchangeRate: Number(exchangeRate) || 1.0,
      lineItems: lineItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate),
        discountAmount: Number(item.discountAmount),
      })),
      notes: notes || undefined,
      terms: terms || undefined,
    };

    onSubmit(payload);
  };

  return (
    <div className="bg-card/20 border border-border/80 rounded-xl p-6 backdrop-blur-md space-y-6 select-none">
      <div className="flex justify-between items-center pb-3 border-b border-border/60">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider">Dynamic Invoice Builder</h3>
          <p className="text-[10px] text-muted-foreground">
            Construct and calculate itemized invoice bills
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-accent/40 rounded text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dropdowns header inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Customer Client
            </label>
            <select
              required
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full h-9 px-3 border border-border bg-background/40 text-xs rounded-md focus:outline-none"
            >
              <option value="">Select Customer Client...</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.company || 'Private'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Linked Project (Optional)
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full h-9 px-3 border border-border bg-background/40 text-xs rounded-md focus:outline-none"
            >
              <option value="">No Linked Project...</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Due Date
            </label>
            <Input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1 flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-9 px-3 border border-border bg-background/40 text-xs rounded-md focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <div className="w-20">
              <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Ex Rate
              </label>
              <Input
                type="number"
                step="0.001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Line Items builder */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Itemized Line Items
            </h4>
            <Button
              type="button"
              onClick={handleAddItem}
              variant="outline"
              size="sm"
              className="h-8 text-[10px] gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add line
            </Button>
          </div>

          <div className="border border-border/60 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/10 border-b border-border/40 text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Item Description</th>
                  <th className="p-3 w-16 text-center">Qty</th>
                  <th className="p-3 w-28">Unit Price</th>
                  <th className="p-3 w-20">Tax (%)</th>
                  <th className="p-3 w-24">Discount</th>
                  <th className="p-3 w-28 text-right">Line Total</th>
                  <th className="p-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, idx) => {
                  const lineTotal =
                    item.quantity * item.unitPrice +
                    (item.quantity * item.unitPrice * item.taxRate) / 100 -
                    item.discountAmount;

                  return (
                    <tr key={idx} className="border-b border-border/30">
                      <td className="p-2">
                        <Input
                          required
                          value={item.description}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                          placeholder="e.g. Sprint developer hours delivery"
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          required
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'quantity', Number(e.target.value))
                          }
                          className="h-8 text-xs text-center"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          required
                          min={0}
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'unitPrice', Number(e.target.value))
                          }
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          required
                          min={0}
                          max={100}
                          value={item.taxRate}
                          onChange={(e) => handleUpdateItem(idx, 'taxRate', Number(e.target.value))}
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          required
                          min={0}
                          step="0.01"
                          value={item.discountAmount}
                          onChange={(e) =>
                            handleUpdateItem(idx, 'discountAmount', Number(e.target.value))
                          }
                          className="h-8 text-xs"
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-foreground">
                        {currency}{' '}
                        {lineTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          disabled={lineItems.length === 1}
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 hover:bg-rose-500/20 text-rose-400 rounded disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lower notes & Totals box */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-border/60">
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Invoice Notes (Client facing)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Include payment terms detail or routing codes"
                className="w-full h-16 p-2 bg-background/40 border border-border text-xs rounded-md focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                Standard terms & conditions
              </label>
              <Input
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="bg-muted/15 p-4 rounded-xl border border-border/65 flex flex-col justify-between space-y-3">
            <h5 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Totals summary
            </h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold">
                  {currency}{' '}
                  {totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxes Total:</span>
                <span className="font-semibold text-sky-400">
                  +{currency}{' '}
                  {totals.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item Discounts:</span>
                <span className="font-semibold text-rose-400">
                  -{currency}{' '}
                  {totals.discountTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border/80 text-sm font-extrabold text-foreground">
                <span>Grand Total:</span>
                <span>
                  {currency}{' '}
                  {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-9 text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 h-9 text-xs gap-1.5 cursor-pointer">
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
