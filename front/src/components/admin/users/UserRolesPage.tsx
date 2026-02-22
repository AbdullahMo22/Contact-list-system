import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { apiClient } from "../../../stores/authStore";
import { allRoutes } from "../../../router/allRoutes";
import { PERMISSIONS } from "../../../utils/permissions";
import { useAuthStore } from "../../../stores/authStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserInfo {
  user_id: number;
  username: string;
  email?: string;
}

interface Role {
  role_id: number;
  role_name: string;
  description?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const UserRolesPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission(PERMISSIONS.ROLE_MANAGE);

  const [user, setUser] = useState<UserInfo | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // ── Fetch all needed data ──────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [userRes, rolesRes, assignedRes] = await Promise.all([
        apiClient.get(`/users/${userId}`),
        apiClient.get("/roles"),
        apiClient.get(`/roles/users/${userId}/roles`),
      ]);

      setUser(userRes.data?.data ?? userRes.data ?? null);
      setAllRoles(rolesRes.data?.data ?? []);
      const assigned: Role[] = assignedRes.data?.data ?? [];
      setAssignedIds(new Set(assigned.map((r) => r.role_id)));
    } catch (err) {
      console.error(err);
      await Swal.fire({ icon: "error", title: "خطأ", text: "فشل في تحميل البيانات" });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRoles;
    return allRoles.filter(
      (r) => r.role_name.toLowerCase().includes(q) || (r.description?.toLowerCase().includes(q) ?? false)
    );
  }, [allRoles, search]);

  const assignedFiltered = filtered.filter((r) => assignedIds.has(r.role_id));
  const availableFiltered = filtered.filter((r) => !assignedIds.has(r.role_id));

  // ── Assign ─────────────────────────────────────────────────────────────────
  const assign = async (role: Role) => {
    setActioningId(role.role_id);
    try {
      await apiClient.post(`/roles/users/${userId}/roles`, { roleId: role.role_id });
      setAssignedIds((prev) => new Set([...prev, role.role_id]));
      await Swal.fire({ icon: "success", title: "تم", text: `تم إسناد دور "${role.role_name}" للمستخدم`, timer: 1200, showConfirmButton: false });
    } catch (err: any) {
      await Swal.fire({ icon: "error", title: "خطأ", text: err?.response?.data?.message || "فشل في إسناد الدور" });
    } finally {
      setActioningId(null);
    }
  };

  // ── Remove ─────────────────────────────────────────────────────────────────
  const remove = async (role: Role) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "إزالة الدور",
      html: `هل تريد إزالة دور <b>${role.role_name}</b> من هذا المستخدم؟`,
      showCancelButton: true,
      confirmButtonText: "نعم، إزالة",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    setActioningId(role.role_id);
    try {
      await apiClient.delete(`/roles/users/${userId}/roles/${role.role_id}`);
      setAssignedIds((prev) => { const next = new Set(prev); next.delete(role.role_id); return next; });
      await Swal.fire({ icon: "success", title: "تم", text: `تم إزالة دور "${role.role_name}"`, timer: 1200, showConfirmButton: false });
    } catch (err: any) {
      await Swal.fire({ icon: "error", title: "خطأ", text: err?.response?.data?.message || "فشل في إزالة الدور" });
    } finally {
      setActioningId(null);
    }
  };

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!canManage) {
    return (
      <div className="flex items-center justify-center min-h-[300px]" dir="rtl">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-6 py-4 text-sm">
          ليس لديك صلاحية للوصول إلى هذه الصفحة
        </div>
      </div>
    );
  }

  // ─── Role Card ─────────────────────────────────────────────────────────────
  const RoleCard = ({ role, assigned }: { role: Role; assigned: boolean }) => {
    const isActioning = actioningId === role.role_id;
    return (
      <div
        className={`flex items-center justify-between rounded-xl border p-3.5 transition-all ${
          assigned
            ? "border-indigo-200 bg-indigo-50"
            : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${assigned ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>
            {role.role_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-800">{role.role_name}</div>
            {role.description && (
              <div className="text-xs text-gray-400 mt-0.5 max-w-[260px] truncate">{role.description}</div>
            )}
          </div>
        </div>

        {assigned ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">مُسنَد</span>
            <button
              onClick={() => remove(role)}
              disabled={isActioning}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isActioning ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              {isActioning ? "..." : "إزالة"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => assign(role)}
            disabled={isActioning}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              isActioning ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {isActioning ? "..." : "إسناد"}
          </button>
        )}
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-5" dir="rtl">

      {/* Back + Header */}
      <div className="flex items-start gap-3">
        <Link
          to={allRoutes.adminUsers}
          className="mt-0.5 p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition"
          title="رجوع"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
          {loading || !user ? (
            <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                  {user.username?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{user.username}</h1>
                  {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">إدارة الأدوار المُسنَدة لهذا المستخدم</p>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: allRoles.length, label: "إجمالي الأدوار" },
          { value: assignedIds.size, label: "مُسنَد", highlight: true },
          { value: allRoles.length - assignedIds.size, label: "متاح" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 text-center">
            <div className={`text-2xl font-bold ${s.highlight ? "text-indigo-600" : "text-gray-700"}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="relative">
          <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 12a7.5 7.5 0 0012.15 5.65z" />
            </svg>
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في الأدوار..."
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Assigned */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-indigo-50">
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-bold text-indigo-800">الأدوار المُسنَدة</h3>
              <span className="ms-auto text-xs text-indigo-600 bg-indigo-100 rounded-full px-2 py-0.5 font-bold">{assignedFiltered.length}</span>
            </div>
            <div className="p-4 space-y-2.5">
              {assignedFiltered.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">لا توجد أدوار مُسنَدة</div>
              ) : (
                assignedFiltered.map((r) => <RoleCard key={r.role_id} role={r} assigned />)
              )}
            </div>
          </div>

          {/* Available */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <h3 className="text-sm font-bold text-gray-700">الأدوار المتاحة</h3>
              <span className="ms-auto text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-0.5 font-bold">{availableFiltered.length}</span>
            </div>
            <div className="p-4 space-y-2.5">
              {availableFiltered.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">كل الأدوار مُسنَدة بالفعل</div>
              ) : (
                availableFiltered.map((r) => <RoleCard key={r.role_id} role={r} assigned={false} />)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRolesPage;
