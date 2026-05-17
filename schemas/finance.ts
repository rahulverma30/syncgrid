import { z } from 'zod';

export const InvoiceItemCreateSchema = z.object({
  description: z.string().min(1, 'Item description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  taxRate: z.number().nonnegative('Tax rate cannot be negative').default(0),
  discountAmount: z.number().nonnegative('Discount amount cannot be negative').default(0),
});

export const InvoiceCreateSchema = z.object({
  clientId: z.string().min(1, 'Client reference is required'),
  projectId: z.string().optional(),
  issueDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()).min(1, 'Due date is required'),
  currency: z.string().default('USD'),
  exchangeRate: z.number().positive().default(1.0),
  lineItems: z.array(InvoiceItemCreateSchema).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export const TransactionRecordSchema = z.object({
  invoiceId: z.string().optional(),
  clientId: z.string().optional(),
  paymentMethod: z.enum(['bank_transfer', 'stripe', 'razorpay', 'paypal', 'upi', 'cash', 'manual']),
  type: z.enum(['income', 'expense', 'refund', 'adjustment']),
  currency: z.string().default('USD'),
  amount: z.number().positive('Transaction amount must be greater than zero'),
  referenceNumber: z.string().optional(),
  paymentDate: z.string().or(z.date()).optional(),
  description: z.string().optional(),
});

export const ExpenseSubmitSchema = z.object({
  category: z.enum([
    'travel',
    'meals',
    'software',
    'hardware',
    'marketing',
    'office_supplies',
    'utilities',
    'rent',
    'salary',
    'consulting',
    'other',
  ]),
  merchant: z.string().min(1, 'Merchant/Vendor name is required'),
  projectId: z.string().optional(),
  amount: z.number().positive('Expense amount must be greater than zero'),
  currency: z.string().default('USD'),
  taxAmount: z.number().nonnegative('Tax amount cannot be negative').default(0),
  expenseDate: z.string().or(z.date()).optional(),
  receiptUrl: z.string().optional(),
  receiptName: z.string().optional(),
  receiptSize: z.number().optional(),
  notes: z.string().optional(),
});

export const BudgetUpdateSchema = z.object({
  name: z.string().min(1, 'Budget campaign/department name is required'),
  type: z.enum(['operational', 'project', 'department']),
  projectId: z.string().optional(),
  departmentId: z.string().optional(),
  amount: z.number().positive('Budget allocation must be positive'),
  currency: z.string().default('USD'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  alertThreshold: z.number().min(10).max(100, 'Threshold percentage must be between 10% and 100%'),
  notes: z.string().optional(),
});

export const VendorProfileSchema = z.object({
  name: z.string().min(1, 'Vendor corporate name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  category: z.enum(['software', 'hardware', 'utilities', 'consulting', 'office_rent', 'other']),
  taxId: z.string().optional(),
  paymentTerms: z.enum(['due_on_receipt', 'net_15', 'net_30', 'net_60']),
  notes: z.string().optional(),
});

export const POItemSchema = z.object({
  description: z.string().min(1, 'Line description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
});

export const PurchaseOrderCreateSchema = z.object({
  vendorId: z.string().min(1, 'Vendor reference is required'),
  projectId: z.string().optional(),
  expectedDeliveryDate: z.string().or(z.date()).optional(),
  lineItems: z.array(POItemSchema).min(1, 'At least one item is required'),
  taxAmount: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});
