
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { categoryService } from '../../services/category.service';
import { type Category } from '../../types';
import { Spinner } from '../../components/shared/Spinner';
import { Modal } from '../../components/shared/Modal';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { getAxiosErrorMessage } from '../../lib/utils';
import { Pencil, Power, Trash2 } from "lucide-react";

const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().max(500).optional(),
});
type FormData = z.infer<typeof schema>;

export const CategoriesPage: React.FC = () => {
    const qc = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: categoryService.getCategories,
    });

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] });

    const createMutation = useMutation({
        mutationFn: (d: FormData) => categoryService.createCategory(d),
        onSuccess: () => { toast.success('Category created'); setShowModal(false); reset(); invalidate(); },
        onError: (err) => toast.error(getAxiosErrorMessage(err)),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: FormData }) =>
            categoryService.updateCategory(id, data),
        onSuccess: () => { toast.success('Category updated'); setEditing(null); reset(); invalidate(); },
        onError: (err) => toast.error(getAxiosErrorMessage(err)),
    });

    const toggleMutation = useMutation({
        mutationFn: (id: string) => categoryService.toggleCategoryStatus(id),
        onSuccess: () => { toast.success('Status updated'); invalidate(); },
        onError: (err) => toast.error(getAxiosErrorMessage(err)),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoryService.deleteCategory(id),
        onSuccess: () => { toast.success('Category deleted'); setDeleteTarget(null); invalidate(); },
        onError: (err) => toast.error(getAxiosErrorMessage(err)),
    });

    const openEdit = (cat: Category) => {
        setEditing(cat);
        reset({ name: cat.name, description: cat.description ?? '' });
    };

    const openCreate = () => {
        setEditing(null);
        reset({ name: '', description: '' });
        setShowModal(true);
    };

    const onSubmit = (data: FormData) => {
        if (editing) {
            updateMutation.mutate({ id: editing._id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                <button onClick={openCreate} className="btn-primary">Add Category</button>
            </div>

            <div className="card p-0 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-16"><Spinner /></div>
                ) : !categories.length ? (
                    <div className="text-center py-12 text-gray-500">No categories yet.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {categories.map((cat) => (
                                <tr key={cat._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{cat.description ?? '—'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`badge ${cat.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {cat.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-3 justify-end">
                                            <button
                                                onClick={() => openEdit(cat)}
                                                className="text-xs bg-blue-500 text-white p-2 rounded-md px-3 flex items-center gap-1"
                                            >
                                                <Pencil size={14} />

                                            </button>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleMutation.mutate(cat._id)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${cat.isActive ? "bg-green-600" : "bg-gray-400"
                                                        }`}
                                                    aria-label={cat.isActive ? "Deactivate" : "Activate"}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${cat.isActive ? "translate-x-6" : "translate-x-1"
                                                            }`}
                                                    />
                                                </button>

                                               
                                            </div>

                                            <button
                                                onClick={() => setDeleteTarget(cat)}
                                                className="text-xs text-white p-2 rounded-md bg-red-600 hover:underline flex items-center gap-1"
                                            >
                                                <Trash2 size={14} />

                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            
            <Modal
                isOpen={showModal || !!editing}
                onClose={() => { setShowModal(false); setEditing(null); }}
                title={editing ? 'Edit Category' : 'New Category'}
                size="sm"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <div>
                        <label className="label">Name *</label>
                        <input type="text" {...register('name')} className={errors.name ? 'input-error' : 'input'} />
                        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <textarea rows={3} {...register('description')} className="input" />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editing ? 'Update' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
                title="Delete Category"
                message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
                confirmLabel="Delete"
                isDestructive
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
};
