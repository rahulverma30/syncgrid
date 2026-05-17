'use client';

import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronDown,
  X,
  Search,
  Check,
  UploadCloud,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  DollarSign,
  Plus,
} from 'lucide-react';
import { Button } from './button';
import { Input } from './input';

/**
 * Standard Form Field Wrapper to render label and error states neatly
 */
export function FormFieldWrapper({
  label,
  error,
  required = false,
  children,
  className,
}: {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5 w-full text-left', className)}>
      {label && (
        <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-0.5 select-none">
          {label}
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}
      <div className="relative w-full">{children}</div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs font-semibold text-rose-500 flex items-center gap-1 select-none pt-0.5"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Custom DatePicker using standard html5 calendar input with styled premium indicators
 */
export const DatePicker = forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { label?: string; error?: string }
>(({ className, label, error, ...props }, ref) => {
  return (
    <FormFieldWrapper label={label} error={error} required={props.required}>
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type="date"
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            'pl-10 block w-full dark:color-scheme-dark',
            className
          )}
        />
        <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground/80" />
      </div>
    </FormFieldWrapper>
  );
});

DatePicker.displayName = 'DatePicker';

/**
 * Custom DateRangePicker integrating two linked calendar date inputs beautifully
 */
export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  label,
  error,
  required,
}: {
  startDate: string;
  endDate: string;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <FormFieldWrapper label={label} error={error} required={required}>
      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="relative">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
          <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
        </div>
        <div className="relative">
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
          <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
        </div>
      </div>
    </FormFieldWrapper>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

/**
 * Premium Keyboard SearchableSelect (Combobox) with input queries and checkmarks
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  error,
  required,
  className,
}: {
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <FormFieldWrapper label={label} error={error} required={required} className={className}>
      <div ref={containerRef} className="relative w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3.5 py-2 text-sm text-foreground ring-offset-background hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-ring select-none text-left"
        >
          <span className={cn('truncate', !selectedOption && 'text-muted-foreground')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground/80 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-1.5 w-full rounded-md border border-border bg-popover/95 backdrop-blur-md p-1.5 text-popover-foreground shadow-lg focus:outline-none max-h-60 overflow-y-auto"
            >
              <div className="relative flex items-center border-b border-border/50 pb-1.5 mb-1">
                <Search className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-muted-foreground/80" />
                <input
                  type="text"
                  placeholder="Type to filter..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent pl-8 pr-2 py-1 text-xs outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {filteredOptions.length === 0 ? (
                <div className="py-3 text-center text-xs text-muted-foreground select-none">
                  No matches found.
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded px-2.5 py-1.5 text-xs text-left transition-colors',
                        opt.value === value
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'hover:bg-accent/80 text-foreground'
                      )}
                    >
                      <span>{opt.label}</span>
                      {opt.value === value && <Check className="h-3.5 w-3.5 text-current" />}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FormFieldWrapper>
  );
}

/**
 * AsyncSelect simulating database load lists using debounced fetch queries
 */
export function AsyncSelect({
  loadOptions,
  value,
  onChange,
  placeholder = 'Search database...',
  label,
  error,
  required,
  className,
}: {
  loadOptions: (query: string) => Promise<SelectOption[]>;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      loadOptions(search)
        .then((res) => {
          setOptions(res);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, loadOptions, isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <FormFieldWrapper label={label} error={error} required={required} className={className}>
      <div ref={containerRef} className="relative w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3.5 py-2 text-sm text-foreground ring-offset-background hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-ring text-left"
        >
          <span className={cn('truncate', !selectedOption && 'text-muted-foreground')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground/80 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-1.5 w-full rounded-md border border-border bg-popover/95 backdrop-blur-md p-1.5 text-popover-foreground shadow-lg max-h-60 overflow-y-auto"
            >
              <div className="relative flex items-center border-b border-border/50 pb-1.5 mb-1">
                <Search className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-muted-foreground/80" />
                <input
                  type="text"
                  placeholder="Type to query database..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent pl-8 pr-2 py-1 text-xs outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {loading ? (
                <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5 select-none">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent" />
                  Querying database...
                </div>
              ) : options.length === 0 ? (
                <div className="py-3 text-center text-xs text-muted-foreground select-none">
                  No results found.
                </div>
              ) : (
                <div className="space-y-0.5">
                  {options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded px-2.5 py-1.5 text-xs text-left transition-colors',
                        opt.value === value
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'hover:bg-accent/80 text-foreground'
                      )}
                    >
                      <span>{opt.label}</span>
                      {opt.value === value && <Check className="h-3.5 w-3.5 text-current" />}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FormFieldWrapper>
  );
}

/**
 * TagInput supporting keyboard tag additions via Space/Enter, displaying visual chip removals
 */
export function TagInput({
  tags,
  onChange,
  placeholder = 'Add tag and press Enter...',
  label,
  error,
  required,
  className,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}) {
  const [input, setInput] = useState('');

  const addTag = () => {
    const formatted = input.trim();
    if (formatted && !tags.includes(formatted)) {
      onChange([...tags, formatted]);
      setInput('');
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, i) => i !== indexToRemove));
  };

  return (
    <FormFieldWrapper label={label} error={error} required={required} className={className}>
      <div className="flex flex-wrap items-center gap-2 p-2 rounded-md border border-input bg-background/50 focus-within:ring-2 focus-within:ring-ring transition-all w-full">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 rounded bg-secondary text-secondary-foreground pl-2 pr-1 py-1 text-xs font-semibold select-none shadow-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="rounded-full p-0.5 hover:bg-muted-foreground/20 text-muted-foreground/80 hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent py-1 px-1.5 text-sm outline-none text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </FormFieldWrapper>
  );
}

/**
 * Masked PhoneInput with localized phone symbols and inputs
 */
export const PhoneInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(({ className, label, error, ...props }, ref) => {
  return (
    <FormFieldWrapper label={label} error={error} required={props.required}>
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type="tel"
          placeholder="+1 (555) 000-0000"
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            'pl-10 block w-full',
            className
          )}
        />
        <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground/80" />
      </div>
    </FormFieldWrapper>
  );
});

PhoneInput.displayName = 'PhoneInput';

/**
 * Masked CurrencyInput adding visual currency prefixes
 */
export const CurrencyInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }
>(({ className, label, error, ...props }, ref) => {
  return (
    <FormFieldWrapper label={label} error={error} required={props.required}>
      <div className="relative">
        <input
          {...props}
          ref={ref}
          type="number"
          placeholder="0.00"
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            'pl-9 block w-full font-mono',
            className
          )}
        />
        <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
      </div>
    </FormFieldWrapper>
  );
});

CurrencyInput.displayName = 'CurrencyInput';

interface UploadedFile {
  name: string;
  size: number;
  progress: number;
  error?: string;
}

/**
 * Premium Drag-and-Drop FileUploader with uploading file progress lines
 */
export function FileUploader({
  onFilesSelected,
  accept = '*',
  maxSizeMB = 10,
  label,
  error,
  required,
}: {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  error?: string;
  required?: boolean;
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList) => {
    const validFiles: File[] = [];
    const newUploads: UploadedFile[] = [];

    Array.from(files).forEach((file) => {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        newUploads.push({
          name: file.name,
          size: file.size,
          progress: 100,
          error: `File size exceeds the limit of ${maxSizeMB}MB`,
        });
      } else {
        validFiles.push(file);
        newUploads.push({
          name: file.name,
          size: file.size,
          progress: 10,
        });
      }
    });

    setUploads((prev) => [...prev, ...newUploads]);
    onFilesSelected(validFiles);

    // Simulate progress bars for valid uploads
    validFiles.forEach((file) => {
      let currentProgress = 10;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 25) + 10;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
        }

        setUploads((prev) =>
          prev.map((up) => (up.name === file.name ? { ...up, progress: currentProgress } : up))
        );
      }, 300);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <FormFieldWrapper label={label} error={error} required={required}>
      <div className="space-y-4 w-full">
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-card/40 hover:bg-card/75 hover:border-primary/50 transition-colors cursor-pointer select-none text-center',
            isDragActive ? 'border-primary bg-primary/5' : 'border-border/80'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            onChange={(e) => e.target.files && processFiles(e.target.files)}
            className="hidden"
          />

          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 shadow-inner">
            <UploadCloud className="h-6 w-6" />
          </div>

          <p className="text-sm font-semibold text-foreground">
            Drag & drop files here, or <span className="text-primary hover:underline">browse</span>
          </p>
          <p className="text-xs text-muted-foreground/80 mt-1 uppercase tracking-wide">
            Max File Size: {maxSizeMB}MB
          </p>
        </div>

        <AnimatePresence>
          {uploads.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2.5 overflow-hidden"
            >
              {uploads.map((up, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-border/50 bg-card/60 backdrop-blur-sm gap-4"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText
                      className={cn(
                        'h-8 w-8 text-primary flex-shrink-0',
                        up.error && 'text-rose-500'
                      )}
                    />
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-foreground truncate leading-none">
                        {up.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {(up.size / 1024).toFixed(1)} KB
                      </p>
                      {up.error ? (
                        <p className="text-[10px] font-semibold text-rose-500 flex items-center gap-0.5 leading-none">
                          <AlertCircle className="h-3 w-3" />
                          {up.error}
                        </p>
                      ) : (
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            style={{ width: `${up.progress}%` }}
                            className={cn(
                              'h-full bg-primary transition-all duration-300',
                              up.progress === 100 && 'bg-emerald-500'
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {up.progress === 100 && !up.error ? (
                      <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 text-[9px] font-bold font-mono">
                        <Check className="h-3 w-3" />
                        100%
                      </span>
                    ) : up.error ? (
                      <span className="inline-flex items-center gap-0.5 rounded bg-rose-500/10 text-rose-500 px-1.5 py-0.5 text-[9px] font-bold font-mono">
                        Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded bg-blue-500/10 text-blue-500 px-1.5 py-0.5 text-[9px] font-bold font-mono">
                        <Clock className="h-2.5 w-2.5 animate-spin" />
                        {up.progress}%
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setUploads((prev) => prev.filter((_, i) => i !== idx))}
                      className="rounded-full p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FormFieldWrapper>
  );
}

/**
 * Chip-based MultiSelect showing standard options
 */
export function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select elements...',
  label,
  error,
  required,
}: {
  options: SelectOption[];
  selectedValues: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSelect = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  return (
    <FormFieldWrapper label={label} error={error} required={required}>
      <div ref={containerRef} className="relative w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground ring-offset-background hover:bg-accent/40 focus:outline-none focus:ring-2 focus:ring-ring text-left"
        >
          <div className="flex flex-wrap gap-1.5 max-w-[90%]">
            {selectedValues.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedValues.map((val) => {
                const labelName = options.find((o) => o.value === val)?.label || val;
                return (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 rounded bg-secondary text-secondary-foreground pl-2 pr-1 py-0.5 text-xs font-semibold"
                  >
                    {labelName}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(val);
                      }}
                      className="rounded-full p-0.5 hover:bg-muted-foreground/20 text-muted-foreground/80 hover:text-foreground cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </span>
                );
              })
            )}
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground/80 transition-transform duration-200 flex-shrink-0',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 mt-1.5 w-full rounded-md border border-border bg-popover/95 backdrop-blur-md p-1.5 shadow-lg max-h-60 overflow-y-auto"
            >
              <div className="space-y-0.5">
                {options.map((opt) => {
                  const isChecked = selectedValues.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleSelect(opt.value)}
                      className={cn(
                        'flex w-full items-center justify-between rounded px-2.5 py-1.5 text-xs text-left transition-colors',
                        isChecked
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'hover:bg-accent/80 text-foreground'
                      )}
                    >
                      <span>{opt.label}</span>
                      {isChecked && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FormFieldWrapper>
  );
}

/**
 * RichTextarea showing mock rich editing tabs
 */
export const RichTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }
>(({ className, label, error, ...props }, ref) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  return (
    <FormFieldWrapper label={label} error={error} required={props.required}>
      <div className="w-full rounded-lg border border-input bg-background/50 overflow-hidden focus-within:ring-2 focus-within:ring-ring transition-all">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/30 select-none">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={cn(
                'text-xs font-semibold px-2.5 py-1 rounded transition-colors',
                activeTab === 'write'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={cn(
                'text-xs font-semibold px-2.5 py-1 rounded transition-colors',
                activeTab === 'preview'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Preview
            </button>
          </div>
          <div className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
            <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            Markdown Supported
          </div>
        </div>

        {activeTab === 'write' ? (
          <textarea
            {...props}
            ref={ref}
            rows={4}
            className={cn(
              'w-full bg-transparent px-3.5 py-3 text-sm text-foreground outline-none resize-y min-h-[100px] placeholder:text-muted-foreground',
              className
            )}
          />
        ) : (
          <div className="px-4 py-3 text-sm text-foreground min-h-[100px] prose dark:prose-invert">
            {props.value ? (
              <div className="whitespace-pre-wrap">{props.value}</div>
            ) : (
              <span className="text-muted-foreground text-xs italic select-none">
                Nothing to preview yet.
              </span>
            )}
          </div>
        )}
      </div>
    </FormFieldWrapper>
  );
});

RichTextarea.displayName = 'RichTextarea';
