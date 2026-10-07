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
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  category: z.string().min(1, 'Category is required'),
  priority: z.nativeEnum(TicketPriority),
});
type FormData = z.infer<typeof schema>;

export const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileList | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: categoryService.getActiveCategories,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: TicketPriority.MEDIUM },
  });

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
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5" noValidate>
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
              <select id="priority" {...register('priority')} className="input">
                {Object.values(TicketPriority).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="attachments">Attachments (optional)</label>
            <input
              id="attachments"
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
              onChange={(e) => setFiles(e.target.files)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-400 mt-1">Max 5 files, 5MB each. JPG, PNG, PDF, TXT, DOC allowed.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
