import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { userService } from '../../services/user.service';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import { getAxiosErrorMessage } from '../../lib/utils';
import { Spinner } from '../../components/shared/Spinner';
import { PasswordInput } from '../../components/shared/PasswordInput';

const digitCount = (value: string) => value.replace(/\D/g, '').length;

const isPhone = (value: string): boolean =>
  /^\+?[\d\s()-]{7,20}$/.test(value) && digitCount(value) >= 7 && digitCount(value) <= 15;

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || isPhone(v), 'Enter a valid phone number, e.g. +1 555 000 0000'),
  department: z.string().trim().max(100, 'Department must be at most 100 characters'),
});
type ProfileForm = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Must contain uppercase, lowercase, and number'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

const ROLE_STYLE: Record<string, string> = {
  ADMIN:    'bg-red-100 text-red-700',
  AGENT:    'bg-purple-100 text-purple-700',
  CUSTOMER: 'bg-blue-100 text-blue-700',
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin', AGENT: 'Agent', CUSTOMER: 'Customer',
};

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

const avatarBg = (role: string) => ROLE_STYLE[role] ?? 'bg-gray-100 text-gray-600';

const Field: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
}> = ({ label, error, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export const ProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  const { data: fullUser, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authService.getMe(),
  });

  const {
    register: regProfile,
    handleSubmit: submitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: profileDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: { name: '', phone: '', department: '' },
  });

  useEffect(() => {
    if (fullUser) {
      resetProfile({
        name: fullUser.name ?? '',
        phone: fullUser.phone ?? '',
        department: fullUser.department ?? '',
      });
    }
  }, [fullUser, resetProfile]);

  const updateMutation = useMutation({
    mutationFn: (data: ProfileForm) => userService.updateProfile(data),
    onSuccess: (_res, data) => {
      resetProfile(data);
      toast.success('Profile updated');
    },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  const {
    register: regPass,
    handleSubmit: submitPass,
    reset: resetPass,
    formState: { errors: passErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    mode: 'onTouched',
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      authService.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => { toast.success('Password changed'); resetPass(); },
    onError: (err) => toast.error(getAxiosErrorMessage(err)),
  });

  const role = authUser?.role ?? '';

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="card flex items-center gap-5">
        {isLoading ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            <span className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold flex-shrink-0 ${avatarBg(role)}`}>
              {getInitials(authUser?.name ?? '')}
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {fullUser?.name ?? authUser?.name}
                </h2>
                <span className={`badge ${ROLE_STYLE[role] ?? 'bg-gray-100 text-gray-600'}`}>
                  {ROLE_LABEL[role] ?? role}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5 truncate">{authUser?.email}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                {fullUser?.department && (
                  <span>{fullUser.department}</span>
                )}
                {fullUser?.phone && (
                  <span>{fullUser.phone}</span>
                )}
                {fullUser?.createdAt && (
                  <span>Joined {format(new Date(fullUser.createdAt), 'MMM d, yyyy')}</span>
                )}
                {fullUser?.lastLogin && (
                  <span>Last login {format(new Date(fullUser.lastLogin), 'MMM d, yyyy')}</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {(['profile', 'password'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/40'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab === 'password' ? 'Change Password' : 'Edit Profile'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            isLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : (
              <form
                onSubmit={submitProfile((d) => updateMutation.mutate(d))}
                className="space-y-4"
                noValidate
              >
                <Field label="Full Name" error={profileErrors.name?.message}>
                  <input
                    type="text"
                    {...regProfile('name')}
                    maxLength={100}
                    className={profileErrors.name ? 'input-error' : 'input'}
                    placeholder="Your full name"
                  />
                </Field>

                <Field label="Email">
                  <input
                    type="email"
                    value={authUser?.email ?? ''}
                    disabled
                    className="input bg-gray-50 text-gray-400 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Phone" error={profileErrors.phone?.message}>
                    <input
                      type="tel"
                      {...regProfile('phone')}
                      maxLength={20}
                      className={profileErrors.phone ? 'input-error' : 'input'}
                      placeholder="+1 555 000 0000"
                    />
                  </Field>

                  <Field label="Department" error={profileErrors.department?.message}>
                    <input
                      type="text"
                      {...regProfile('department')}
                      maxLength={100}
                      className={profileErrors.department ? 'input-error' : 'input'}
                      placeholder="e.g. Engineering"
                    />
                  </Field>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="btn-primary px-6"
                    disabled={updateMutation.isPending || !profileDirty}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )
          )}

          {activeTab === 'password' && (
            <form
              onSubmit={submitPass((d) => passwordMutation.mutate(d))}
              className="space-y-4"
              noValidate
            >
              <Field label="Current Password" error={passErrors.currentPassword?.message}>
                <PasswordInput
                  {...regPass('currentPassword')}
                  hasError={!!passErrors.currentPassword}
                  autoComplete="current-password"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="New Password" error={passErrors.newPassword?.message}>
                  <PasswordInput
                    {...regPass('newPassword')}
                    hasError={!!passErrors.newPassword}
                    autoComplete="new-password"
                  />
                </Field>

                <Field label="Confirm New Password" error={passErrors.confirmPassword?.message}>
                  <PasswordInput
                    {...regPass('confirmPassword')}
                    hasError={!!passErrors.confirmPassword}
                    autoComplete="new-password"
                  />
                </Field>
              </div>

              <p className="text-xs text-gray-400">
                Min. 8 characters with at least one uppercase letter, lowercase letter, and number.
              </p>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="btn-primary px-6"
                  disabled={passwordMutation.isPending}
                >
                  {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
