import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuthStore, apiClient } from "../../../stores/authStore";
import { PERMISSIONS } from "../../../utils/permissions";
import { allRoutes } from "../../../router/allRoutes";

type AnyUser = Record<string, any>;

type User = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at?: string;
  roles?: string[];
};

// Toast (زي الفنادق)
const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
});

const confirmDanger = (title: string, text?: string) =>
  Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "حذف",
    cancelButtonText: "إلغاء",
    confirmButtonColor: "#dc2626",
    reverseButtons: true,
    focusCancel: true,
  });

const confirmToggle = (title: string, text: string, confirmText: string) =>
  Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "إلغاء",
    reverseButtons: true,
    focusCancel: true,
  });

const normalizeUser = (u: AnyUser): User => {
  const id = Number(u.id ?? u.user_id ?? u.userId ?? 0);

  const username = String(u.username ?? "");
  const email = String(u.email ?? "");
  const full_name = String(u.full_name ?? u.fullName ?? u.name ?? "");

  const rawActive =
    u.is_active ?? u.isActive ?? u.active ?? u.status ?? u.enabled ?? true;

  const is_active =
    typeof rawActive === "boolean"
      ? rawActive
      : typeof rawActive === "number"
      ? rawActive === 1
      : String(rawActive).toLowerCase() === "true"
      ? true
      : String(rawActive).toLowerCase() === "false"
      ? false
      : true;

  const created_at = u.created_at ?? u.createdAt;
  const roles = Array.isArray(u.roles) ? u.roles : undefined;

  return { id, username, email, full_name, is_active, created_at, roles };
};

const extractUsersArray = (resData: any): AnyUser[] => {
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData?.users)) return resData.users;
  if (Array.isArray(resData?.result)) return resData.result;
  return [];
};

const UserManagement: React.FC = () => {
  const { hasPermission } = useAuthStore();

  const canView = hasPermission(PERMISSIONS.USER_VIEW);
  const canCreate = hasPermission(PERMISSIONS.USER_CREATE);
  const canEdit = hasPermission(PERMISSIONS.USER_EDIT);
  const canDelete = hasPermission(PERMISSIONS.USER_DELETE);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [busy, setBusy] = useState(false);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
  });

  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const hay = `${u.username} ${u.email} ${u.full_name}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, search]);

  const activeCount = useMemo(
    () => users.filter((u) => u.is_active).length,
    [users]
  );

  if (!canView) {
    return (
      <div className="flex items-center justify-center p-4 h-full">
        <div className="w-full max-w-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          ليس لديك صلاحية للوصول إلى هذه الصفحة
        </div>
      </div>
    );
  }

  const fetchUsers = async () => {
    try {
      setError(null);
      const res = await apiClient.get("/users");
      const arr = extractUsersArray(res.data);
      const normalized = arr.map(normalizeUser).filter((u) => u.id);
      setUsers(normalized);
    } catch (e: any) {
      console.error("Error fetching users:", e);
      setError(e?.response?.data?.message || "فشل في تحميل المستخدمين");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchUsers();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const createUser = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!canCreate) return;

  try {
    setBusy(true);
    setError(null);

    await apiClient.post("/users", {
      username: newUser.username,
      email: newUser.email,
      password: newUser.password,
      fullName: newUser.full_name,
    });

    setNewUser({ username: "", email: "", full_name: "", password: "" });
    setShowCreateForm(false);

    toast.fire({ icon: "success", title: "تم إنشاء المستخدم" });
    await fetchUsers();
  } catch (err: any) {
    console.error("Error creating user:", err);
    if (err?.response?.status === 403) return;

    const msg = err?.response?.data?.message || "فشل في إنشاء المستخدم";
    setError(msg);
    toast.fire({ icon: "error", title: msg });
  } finally {
    setBusy(false);
  }
};
  // ✅ Toggle زي الفنادق تمامًا
  const handleToggleUser = async (id: number) => {
    const current = users.find((u) => u.id === id);
    const nextState = current?.is_active ? "Deactivate" : "Activate";

    const result = await confirmToggle(
      nextState === "Activate" ? "تفعيل المستخدم؟" : "تعطيل المستخدم؟",
      "هل أنت متأكد؟",
      nextState === "Activate" ? "تفعيل" : "تعطيل"
    );
    if (!result.isConfirmed) return;

    try {
      setError(null);
      setBusyUserId(id);

      // Optimistic UI
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: !u.is_active } : u))
      );

      // ✅ Endpoint واحد زي الفنادق
      const res = await apiClient.patch(`/users/${id}/toggle-active`);

      const updatedRaw = res?.data?.data;
      if (updatedRaw) {
        const updated = normalizeUser(updatedRaw);
        setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      } else {
        // لو الباك بيرجع message بس
        await fetchUsers();
      }

      toast.fire({
        icon: "success",
        title: nextState === "Activate" ? "تم تفعيل المستخدم" : "تم تعطيل المستخدم",
      });
    } catch (err: any) {
      console.error("Error toggling user status:", err);
      if (err?.response?.status === 403) return;

      // rollback (نعمل refresh لضمان صحة الحالة)
      await fetchUsers();

      const msg = err?.response?.data?.message || "فشل تغيير الحالة";
      setError(msg);
      toast.fire({ icon: "error", title: msg });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!canDelete) return;

    const result = await confirmDanger("حذف المستخدم؟", "سيتم حذف المستخدم نهائيًا");
    if (!result.isConfirmed) return;

    try {
      setError(null);
      setBusyUserId(id);

      await apiClient.delete(`/users/${id}`);

      setUsers((prev) => prev.filter((u) => u.id !== id));

      toast.fire({ icon: "success", title: "تم حذف المستخدم" });
    } catch (err: any) {
      console.error("Error deleting user:", err);
      if (err?.response?.status === 403) return;

      const msg = err?.response?.data?.message || "فشل في حذف المستخدم";
      setError(msg);
      toast.fire({ icon: "error", title: msg });
    } finally {
      setBusyUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-indigo-600 mx-auto" />
          <p className="mt-4 text-slate-500">جارٍ تحميل المستخدمين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" dir="rtl">
      {/* Header */}
      <header className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-5">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">إدارة المستخدمين</h1>
              <p className="text-sm text-slate-500 mt-1">
                إجمالي:{" "}
                <span className="font-semibold text-slate-800">{users.length}</span>{" "}
                — نشط:{" "}
                <span className="font-semibold text-slate-800">{activeCount}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={fetchUsers}
                disabled={busy || busyUserId !== null}
                className="text-sm px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition disabled:opacity-60 shadow-sm"
              >
                تحديث
              </button>

              {canCreate && (
                <button
                  onClick={() => setShowCreateForm((v) => !v)}
                  disabled={busy || busyUserId !== null}
                  className="px-4 py-2 rounded-xl text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 shadow-sm hover:shadow-md transition"
                >
                  {showCreateForm ? "إلغاء" : "إضافة مستخدم جديد"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="w-full space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Create User */}
        {canCreate && showCreateForm && (
          <div className="bg-white shadow-sm rounded-2xl border border-slate-200 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-slate-900">إنشاء مستخدم جديد</h2>
              <span className="text-xs text-slate-500">
                بعد الإنشاء يمكنك تعيين الأدوار من زر “الأدوار”
              </span>
            </div>

            <form onSubmit={createUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    اسم المستخدم
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) =>
                      setNewUser((p) => ({ ...p, username: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="مثال: staff"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="staff@hotel.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    الاسم الكامل
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.full_name}
                    onChange={(e) =>
                      setNewUser((p) => ({ ...p, full_name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Hotel Staff"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    كلمة المرور
                  </label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser((p) => ({ ...p, password: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={busy || busyUserId !== null}
                  className="px-5 py-2 rounded-xl text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 shadow-sm"
                >
                  {busy ? "جارٍ الإنشاء..." : "إنشاء المستخدم"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
className="px-5 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm transition disabled:opacity-60"
                >
                  إغلاق
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-slate-900">قائمة المستخدمين</h2>

              <div className="w-full sm:w-80">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="بحث بالاسم / البريد / الاسم الكامل"
                />
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-slate-500">لا توجد نتائج مطابقة</div>
            ) : (
              <>
                {/* Desktop: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="hidden xl:table-cell px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">الرقم</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">اسم المستخدم</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">الاسم الكامل</th>
                        <th className="hidden lg:table-cell px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">البريد الإلكتروني</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">الحالة</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {filteredUsers.map((user) => {
                        const rowBusy = busyUserId === user.id;
                        return (
                          <tr key={user.id} className={`hover:bg-slate-50/80 transition-colors ${rowBusy ? "opacity-70" : ""}`}>
                            <td className="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-sm text-slate-900">{user.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-slate-900">{user.username}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                              {user.full_name}
                              <div className="lg:hidden text-xs text-slate-400 mt-1">{user.email}</div>
                            </td>
                            <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-slate-600">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={user.is_active ? "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200" : "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"}>
                                {user.is_active ? "نشط" : "معطل"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-wrap gap-2">
                                <Link to={allRoutes.adminUserRoles(user.id)} className="px-3 py-1.5 rounded-lg text-sm border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100">الأدوار</Link>
                                <Link to={allRoutes.adminUserScope(user.id)} className="px-3 py-1.5 rounded-lg text-sm border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100">النطاق</Link>
                                {canEdit && (
                                  <button onClick={() => handleToggleUser(user.id)} disabled={rowBusy || busy} className={user.is_active ? "px-3 py-1.5 rounded-lg text-sm border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-60" : "px-3 py-1.5 rounded-lg text-sm border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-60"}>
                                    {rowBusy ? "..." : user.is_active ? "تعطيل" : "تفعيل"}
                                  </button>
                                )}
                                {canDelete && (
                                  <button onClick={() => handleDeleteUser(user.id)} disabled={rowBusy || busy} className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-60">حذف</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const rowBusy = busyUserId === user.id;
                    return (
                      <div key={user.id} className={`p-4 hover:bg-slate-50/50 transition-colors ${rowBusy ? "opacity-70" : ""}`}>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{user.username}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{user.full_name}</p>
                            <p className="text-sm text-slate-600 mt-1 truncate">{user.email}</p>
                            <span className={user.is_active ? "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 mt-2" : "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 mt-2"}>
                              {user.is_active ? "نشط" : "معطل"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                          <Link to={allRoutes.adminUserRoles(user.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100">الأدوار</Link>
                          <Link to={allRoutes.adminUserScope(user.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100">النطاق</Link>
                          {canEdit && (
                            <button onClick={() => handleToggleUser(user.id)} disabled={rowBusy || busy} className={user.is_active ? "px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-60" : "px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-60"}>
                              {rowBusy ? "..." : user.is_active ? "تعطيل" : "تفعيل"}
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDeleteUser(user.id)} disabled={rowBusy || busy} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-60">حذف</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-500">
          ملاحظة: زر التفعيل/التعطيل يعتمد على endpoint: <span className="font-semibold">PATCH /users/:id/toggle-active</span>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;