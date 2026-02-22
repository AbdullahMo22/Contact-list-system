import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, Pencil, Trash2, KeyRound, Shield } from 'lucide-react';
import { useAuthStore, apiClient } from '../../../stores/authStore';
import { PERMISSIONS } from '../../../utils/permissions';
import { allRoutes } from '../../../router/allRoutes';
import Swal from 'sweetalert2';

interface Role {
  id: number;
  name: string;
  description: string;
  users_count?: number;
}
const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');


type AlertType = 'error' | 'success' | 'info';

const Alert: React.FC<{
  type: AlertType;
  message: string;
  onClose?: () => void;
}> = ({ type, message, onClose }) => {
  const styles =
    type === 'error'
      ? 'bg-red-50 border-red-200 text-red-800'
      : type === 'success'
        ? 'bg-green-50 border-green-200 text-green-800'
        : 'bg-slate-50 border-slate-200 text-slate-800';

  return (
    <div className={`border rounded-xl px-4 py-3 flex items-start justify-between gap-4 ${styles}`}>
      <p className="text-sm leading-6">{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-sm underline opacity-80 hover:opacity-100"
          aria-label="Close alert"
        >
          إغلاق
        </button>
      )}
    </div>
  );
};

const NoAccess: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl shadow-sm p-6">
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
        ليس لديك صلاحية للوصول إلى هذه الصفحة
      </div>
    </div>
  </div>
);
const swalRtl = Swal.mixin({
  customClass: {
    popup: 'swal2-rtl-popup',
    title: 'swal2-rtl-title',
    htmlContainer: 'swal2-rtl-html',
    confirmButton: 'swal2-confirm-btn',
    cancelButton: 'swal2-cancel-btn',
  },
  buttonsStyling: false,
});
const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState<{ type: AlertType; message: string } | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });

  const { hasPermission } = useAuthStore();
  const canManageRoles = hasPermission(PERMISSIONS.ROLE_MANAGE);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Guard
  if (!canManageRoles) return <NoAccess />;

  const clearAlert = () => setAlert(null);

  const fetchRoles = async () => {
    try {
      const response = await apiClient.get('/roles');
      const rows = response.data.data || [];

      setRoles(rows.map((r: any) => ({
        id: r.role_id,
        name: r.role_name,
        description: r.description,
        users_count: Number(r.users_count || 0),
      })));
      setAlert(null);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setAlert({ type: 'error', message: 'فشل في تحميل الأدوار' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canDeleteThis = useMemo(() => {
    const map = new Map<number, boolean>();
    for (const r of roles) {
      map.set(r.id, canManageRoles && (r.users_count || 0) === 0);
    }
    return map;
  }, [roles, canManageRoles]);

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManageRoles) {
      await Swal.fire({ icon: 'error', title: 'غير مصرح', text: 'ليس لديك صلاحية لإنشاء دور' });
      return;
    }

    const name = newRole.name.trim();
    const description = (newRole.description || '').trim();

    if (!name) {
      await Swal.fire({ icon: 'warning', title: 'بيانات ناقصة', text: 'اسم الدور مطلوب' });
      return;
    }

    // منع تكرار الاسم على مستوى UI (اختياري لكنه مفيد)
    const exists = roles.some(r => r.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      await Swal.fire({ icon: 'warning', title: 'موجود بالفعل', text: 'اسم الدور مستخدم بالفعل' });
      return;
    }

    try {
      setCreating(true);
 
      await apiClient.post('/roles', { role_name: name, role_description: description });

      setNewRole({ name: '', description: '' });
      setShowCreateForm(false);
      await Swal.fire({ icon: 'success', title: 'تم', text: 'تم إنشاء الدور بنجاح', timer: 1200, showConfirmButton: false });

      fetchRoles();
    } catch (err: any) {
      console.error('Error creating role:', err);
      const msg = err?.response?.data?.message || 'فشل في إنشاء الدور';
      await Swal.fire({ icon: 'error', title: 'خطأ', text: msg });
    } finally {
      setCreating(false);
    }
  };

  const editRole = async (role: Role) => {
  const result = await swalRtl.fire({
    title: 'تعديل الدور',
    html: `
      <div style="display:grid; gap:10px;">
        <div>
          <div style="font-size:13px; color:#6b7280; margin-bottom:6px;">اسم الدور</div>
          <input id="swal-role-name" class="swal2-input" value="${escapeHtml(role.name)}" />
        </div>

        <div>
          <div style="font-size:13px; color:#6b7280; margin-bottom:6px;">الوصف</div>
          <textarea id="swal-role-desc" class="swal2-textarea" rows="3"
            style="resize:none;"
          >${escapeHtml(role.description || '')}</textarea>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'حفظ',
    cancelButtonText: 'إلغاء',
    reverseButtons: true,
    focusConfirm: false,
    preConfirm: () => {
      const nameEl = document.getElementById('swal-role-name') as HTMLInputElement | null;
      const descEl = document.getElementById('swal-role-desc') as HTMLTextAreaElement | null;

      const name = (nameEl?.value || '').trim();
      const description = (descEl?.value || '').trim();

      if (!name) {
        Swal.showValidationMessage('اسم الدور مطلوب');
        return;
      }

      // optional: prevent duplicates in UI
      const exists = roles.some(r => r.id !== role.id && r.name.toLowerCase() === name.toLowerCase());
      if (exists) {
        Swal.showValidationMessage('اسم الدور مستخدم بالفعل');
        return;
      }

      return { role_name: name, role_description: description };
    },
  });

  if (!result.isConfirmed || !result.value) return;

  try { 
    console.log('Updating role with data:', result.value);
    await apiClient.put(`/roles/${role.id}`, result.value);
    await swalRtl.fire({ icon: 'success', title: 'تم الحفظ', timer: 1100, showConfirmButton: false });
    fetchRoles();
  } catch (err: any) {
    const msg = err?.response?.data?.message || 'فشل في تعديل الدور';
    await swalRtl.fire({ icon: 'error', title: 'خطأ', text: msg });
  }
};



  const deleteRole = async (roleId: number) => {
    if (!canManageRoles) {
      await Swal.fire({ icon: 'error', title: 'غير مصرح', text: 'ليس لديك صلاحية حذف دور' });
      return;
    }

    const role = roles.find((r) => r.id === roleId);
    if (!role) return;

    if ((role.users_count || 0) > 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'لا يمكن الحذف',
        text: 'لا يمكن حذف دور مرتبط بمستخدمين',
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: 'تأكيد الحذف',
      text: `هل أنت متأكد من حذف الدور: "${role.name}" ؟`,
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(roleId);
      await apiClient.delete(`/roles/${roleId}`);

      await Swal.fire({
        icon: 'success',
        title: 'تم الحذف',
        text: 'تم حذف الدور بنجاح',
        timer: 1200,
        showConfirmButton: false,
      });

      fetchRoles();
    } catch (err: any) {
      console.error('Error deleting role:', err);
      const msg = err?.response?.data?.message || 'فشل في حذف الدور';
      await Swal.fire({ icon: 'error', title: 'خطأ', text: msg });
    } finally {
      setDeletingId(null);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جارٍ تحميل الأدوار...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">إدارة الأدوار</h1>
              <p className="text-sm text-gray-500 mt-1">إنشاء الأدوار وحذفها وإدارة صلاحياتها</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowCreateForm((v) => !v)}
                disabled={!canManageRoles}
                className={`px-4 py-2 rounded-lg text-sm text-white transition
                  ${canManageRoles ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400 cursor-not-allowed'}
                `}
                title={!canManageRoles ? 'ليس لديك صلاحية' : ''}
              >
                {showCreateForm ? 'إلغاء' : 'إضافة دور جديد'}
              </button>

            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 space-y-6">
          {alert && <Alert type={alert.type} message={alert.message} onClose={clearAlert} />}

          {/* Create Role Form */}
          {showCreateForm && canManageRoles && (
            <div className="bg-white shadow-sm border rounded-xl p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">إنشاء دور جديد</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  إغلاق
                </button>
              </div>

              <form onSubmit={createRole} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="role-name" className="block text-sm font-medium text-gray-700">
                      اسم الدور <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="role-name"
                      required
                      value={newRole.name}
                      onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                      placeholder="مثال: ADMIN"
                    />
                  </div>

                  <div>
                    <label htmlFor="role-desc" className="block text-sm font-medium text-gray-700">
                      الوصف
                    </label>
                    <input
                      type="text"
                      id="role-desc"
                      value={newRole.description}
                      onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm px-3 py-2 border"
                      placeholder="وصف مختصر للدور"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className={`px-4 py-2 rounded-lg text-sm text-white transition
                      ${creating ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                    `}
                  >
                    إنشاء الدور
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Roles List */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-lg font-semibold text-slate-900">قائمة الأدوار</h2>
                <button onClick={fetchRoles} className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition">
                  <RefreshCw className="h-4 w-4" /> تحديث
                </button>
              </div>
              {roles.length === 0 ? (
                <div className="text-center py-10"><p className="text-slate-500">لا توجد أدوار محددة</p></div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          الرقم
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          اسم الدور
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          الوصف
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          عدد المستخدمين
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          الإجراءات
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                      {roles.map((role) => {
                        const deletable = !!canDeleteThis.get(role.id);

                        return (
                          <tr key={role.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {role.id}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900">{role.name}</div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {role.description || '-'}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {role.users_count || 0}
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-3">
                                <button
onClick={() => editRole(role)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
                                >
                                  <Pencil className="h-3.5 w-3.5" /> تعديل
                                </button>
                                <button
                                  onClick={() => deleteRole(role.id)}
                                  disabled={!deletable || deletingId === role.id}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${deletable && deletingId !== role.id ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-100' : 'text-slate-400 bg-slate-50 cursor-not-allowed border border-slate-200'}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> {deletingId === role.id ? 'جارٍ الحذف...' : 'حذف'}
                                </button>
                                <Link
                                  to={allRoutes.adminRolePermissions(role.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition"
                                >
                                  <KeyRound className="h-3.5 w-3.5" /> إدارة الصلاحيات
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden divide-y divide-slate-100">
                  {roles.map((role) => {
                    const deletable = !!canDeleteThis.get(role.id);
                    return (
                      <div key={role.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0"><Shield className="h-5 w-5" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{role.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{role.description || '—'}</p>
                            <p className="text-xs text-slate-500 mt-1">المستخدمين: {role.users_count || 0}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                          <button onClick={() => editRole(role)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" /> تعديل</button>
                          <button onClick={() => deleteRole(role.id)} disabled={!deletable || deletingId === role.id} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${deletable && deletingId !== role.id ? 'text-red-700 bg-red-50 hover:bg-red-100 border border-red-100' : 'text-slate-400 bg-slate-50 cursor-not-allowed border border-slate-200'}`}><Trash2 className="h-3.5 w-3.5" /> {deletingId === role.id ? '...' : 'حذف'}</button>
                          <Link to={allRoutes.adminRolePermissions(role.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100"><KeyRound className="h-3.5 w-3.5" /> الصلاحيات</Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoleManagement;
