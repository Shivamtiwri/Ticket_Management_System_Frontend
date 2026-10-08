import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { categoryService } from '../../services/category.service';
import { ticketService } from '../../services/ticket.service';
import { TicketPriority } from '../../types';
import { getAxiosErrorMessage } from '../../lib/utils';

const schema = z.object({
  subject: z.string().trim().min(5, 'Subject must be at least 5 characters').max(200, 'Subject cannot exceed 200 characters'),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(5000, 'Description cannot exceed 5000 characters'),
  category: z.string().min(1, 'Category is required'),
  priority: z.nativeEnum(TicketPriority, { required_error: 'Priority is required', invalid_type_error: 'Priority is required' }),
});
type FormData = z.infer<typeof schema>;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const MAX_ATTACHMENT_COUNT = 5;

export const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileList | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: categoryService.getActiveCategories,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: TicketPriority.MEDIUM },
    mode: 'onTouched',
  });

  const handleFiles = (selected: FileList | null) => {
    if (!selected) {
      setFiles(null);
      setFileError(null);
      return;
    }
    const list = Array.from(selected);
    if (list.length > MAX_ATTACHMENT_COUNT) {
      setFileError(`You can attach at most ${MAX_ATTACHMENT_COUNT} files.`);
      return;
    }
    const tooBig = list.find((f) => f.size > MAX_ATTACHMENT_SIZE);
    if (tooBig) {
      setFileError(`"${tooBig.name}" is larger than 5MB.`);
      return;
    }
    const badType = list.find((f) => !ALLOWED_MIME_TYPES.includes(f.type));
    if (badType) {
      setFileError(`"${badType.name}" has unsupported type. Only JPG, PNG and PDF are allowed.`);
      return;
    }
    setFileError(null);
    setFiles(selected);
  };

  const mutation = useMutation({
    mutationFn: (fd: FormData) => {
      const formData = new FormData();
      Object.entries(fd).forEach(([k, v]) => formData.append(k, v as string));
      if (files) Array.from(files).forEach((f) => formData.append('attachments', f));
      return ticketService.createTicket(formData);
    },
    onSuccess: (ticket) => {
      toast.success('Ticket created successfully!');
      navigate(`/tickets/${ticket._id}`);
    },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
        <p className="text-gray-500 mt-1">Describe your issue and we'll get back to you.</p>
      </div>
      <div className="card">
        <form
          onSubmit={handleSubmit((d) => {
            if (fileError) return;
            mutation.mutate(d);
          })}
          className="space-y-5"
          noValidate
        >
          <div>
            <label className="label" htmlFor="subject">Subject *</label>
            <input id="subject" type="text" {...register('subject')}
              className={errors.subject ? 'input-error' : 'input'}
              placeholder="Brief description of the issue" />
            {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
          </div>

          <div>
            <label className="label" htmlFor="description">Description *</label>
            <textarea id="description" rows={6} {...register('description')}
              className={errors.description ? 'input-error' : 'input'}
              placeholder="Provide as much detail as possible..." />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="category">Category *</label>
              <select id="category" {...register('category')} className={errors.category ? 'input-error' : 'input'}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="priority">Priority *</label>
              <select id="priority" {...register('priority')} className={errors.priority ? 'input-error' : 'input'}>
                {Object.values(TicketPriority).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {errors.priority && <p className="mt-1 text-xs text-red-600">{errors.priority.message}</p>}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="attachments">Attachments (optional)</label>
            <input
              id="attachments"
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => handleFiles(e.target.files)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {fileError ? (
              <p className="mt-1 text-xs text-red-600">{fileError}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">Max 5 files, 5MB each. JPG, PNG, PDF allowed.</p>
            )}
            {files && !fileError && (
              <p className="text-xs text-gray-500 mt-1">{files.length} file(s) selected</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending || !!fileError}>
              {mutation.isPending ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
