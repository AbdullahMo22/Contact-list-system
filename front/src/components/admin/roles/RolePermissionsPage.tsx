import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { apiClient, useAuthStore } from "../../../stores/authStore";
import { PERMISSIONS } from "../../../utils/permissions";

/* =========================
   Types
========================= */

interface Permission {
  permission_id: number;
  perm_key: string;
  module_name: string;
  action_name: string;
}

interface Role {
  role_id: number;
  role_name: string;
  description?: string;
}

/* =========================
   Helpers
========================= */

const ACTION_COLORS: Record<string, string> = {
  View: "bg-blue-50 text-blue-700 ring-blue-200",
  Create: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Edit: "bg-amber-50 text-amber-700 ring-amber-200",
  Delete: "bg-red-50 text-red-700 ring-red-200",
  Manage: "bg-purple-50 text-purple-700 ring-purple-200",
};

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_COLORS[action] ?? "bg-gray-50 text-gray-600 ring-gray-200";
  return (
    <span
      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ${cls}`}
    >
      {action}
    </span>
  );
}

/* =========================
   Indeterminate Checkbox
========================= */

function IndeterminateCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
    />
  );
}

/* =========================
   Main Component
========================= */

export default function RolePermissionsPage() {
  const { id: roleId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [original, setOriginal] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  // Guard
  if (!hasPermission(PERMISSIONS.ROLE_MANAGE)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-6 py-4 text-sm">
          ليس لديك صلاحية للوصول إلى هذه الصفحة
        </div>
      </div>
    );
  }

  // Fetch
  const fetchData = async () => {
    setLoading(true);
    try {
      const [roleRes, allRes, assignedRes] = await Promise.all([
        apiClient.get(`/roles/${roleId}`),
        apiClient.get("/roles/system/permissions"),
        apiClient.get(`/roles/${roleId}/permissions`),
      ]);

      const roleData: Role = roleRes.data?.data ?? roleRes.data;
      const allPermsData: Permission[] = allRes.data?.data ?? [];
      const assignedData: Permission[] = assignedRes.data?.data ?? [];

      const assignedIds = new Set<number>(
        assignedData.map((p) => p.permission_id)
      );

      setRole(roleData);
      setAllPerms(allPermsData);
      setSelected(new Set(assignedIds));
      setOriginal(new Set(assignedIds));
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: "error",
        title: "خطأ في التحميل",
        text: "فشل تحميل بيانات الصلاحيات.",
        confirmButtonText: "حسنًا",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roleId) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  // Filter & Group
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allPerms;

    return allPerms.filter(
      (p) =>
        p.perm_key.toLowerCase().includes(q) ||
        p.module_name.toLowerCase().includes(q) ||
        p.action_name.toLowerCase().includes(q)
    );
  }, [allPerms, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of filtered) {
      const g = p.module_name || "General";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  // Helpers
  const toggle = (pid: number) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(pid) ? n.delete(pid) : n.add(pid);
      return n;
    });

  const selectGroup = (items: Permission[]) =>
    setSelected((prev) => {
      const n = new Set(prev);
      items.forEach((p) => n.add(p.permission_id));
      return n;
    });

  const clearGroup = (items: Permission[]) =>
    setSelected((prev) => {
      const n = new Set(prev);
      items.forEach((p) => n.delete(p.permission_id));
      return n;
    });

  const selectAll = () =>
    setSelected((prev) => {
      const n = new Set(prev);
      filtered.forEach((p) => n.add(p.permission_id));
      return n;
    });

  const clearAll = () =>
    setSelected((prev) => {
      const n = new Set(prev);
      filtered.forEach((p) => n.delete(p.permission_id));
      return n;
    });

  const isDirty = useMemo(() => {
    if (selected.size !== original.size) return true;
    for (const id of selected) if (!original.has(id)) return true;
    return false;
  }, [selected, original]);

  // Save
  const handleSave = async () => {
    const confirmed = await Swal.fire({
      icon: "question",
      title: "تأكيد الحفظ",
      text: "هل تريد حفظ صلاحيات هذا الدور؟",
      showCancelButton: true,
      confirmButtonText: "حفظ",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
    });

    if (!confirmed.isConfirmed) return;

    setSaving(true);
    try {
      await apiClient.put(`/roles/${roleId}/permissions`, {
        permissionIds: Array.from(selected),
      });

      setOriginal(new Set(selected));

      await Swal.fire({
        icon: "success",
        title: "تم الحفظ",
        text: "تم تحديث صلاحيات الدور بنجاح.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "خطأ",
        text:
          err?.response?.data?.message || "فشل في حفظ الصلاحيات.",
        confirmButtonText: "حسنًا",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          <p className="text-sm text-gray-500">جاري تحميل الصلاحيات...</p>
        </div>
      </div>
    );
  }

  const roleTitle = role?.role_name ?? `دور #${roleId}`;
  const selectedInView = filtered.filter((p) =>
    selected.has(p.permission_id)
  ).length;

  return (
    <div className="p-4 md:p-6 space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
            title="رجوع"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              إدارة صلاحيات الدور
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              الدور:{" "}
              <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">
                {roleTitle}
              </span>
              {role?.description && (
                <span className="mr-2 text-gray-400">{role.description}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isDirty && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              تغييرات غير محفوظة
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${
              saving || !isDirty
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: selected.size, label: "صلاحية محددة", color: "text-indigo-600" },
          { value: allPerms.length, label: "إجمالي الصلاحيات", color: "text-gray-700" },
          { value: grouped.length, label: "مجموعة", color: "text-gray-700" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 text-center"
          >
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 12a7.5 7.5 0 0012.15 5.65z"
              />
            </svg>
          </span>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالمجموعة أو الصلاحية أو الإجراء..."
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={selectAll}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
          >
            تحديد الكل {search ? `(${filtered.length})` : ""}
          </button>

          <button
            onClick={clearAll}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            إلغاء الكل {search ? `(${filtered.length})` : ""}
          </button>

          {search && (
            <span className="text-xs text-gray-400">
              {selectedInView}/{filtered.length} محدد
            </span>
          )}
        </div>
      </div>

      {/* Permission Groups */}
      {grouped.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-gray-400 text-sm">
          لا توجد صلاحيات مطابقة للبحث.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([groupName, items]) => {
            const checkedCount = items.filter((p) =>
              selected.has(p.permission_id)
            ).length;
            const allChecked = checkedCount === items.length;
            const someChecked = checkedCount > 0 && !allChecked;

            return (
              <div
                key={groupName}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Group Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <IndeterminateCheckbox
                      checked={allChecked}
                      indeterminate={someChecked}
                      onChange={() =>
                        allChecked ? clearGroup(items) : selectGroup(items)
                      }
                    />
                    <h3 className="text-sm font-bold text-gray-800">
                      {groupName}
                    </h3>
                    <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5 font-medium">
                      {checkedCount} / {items.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => selectGroup(items)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                    >
                      تحديد الكل
                    </button>
                    <button
                      onClick={() => clearGroup(items)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                    >
                      إلغاء الكل
                    </button>
                  </div>
                </div>

                {/* Permissions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-x divide-gray-100">
                  {items.map((p) => {
                    const checked = selected.has(p.permission_id);
                    return (
                      <label
                        key={p.permission_id}
                        className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors select-none ${
                          checked ? "bg-indigo-50/70" : "hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p.permission_id)}
                          className="mt-0.5 h-4 w-4 rounded text-indigo-600 flex-shrink-0 cursor-pointer accent-indigo-600"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1">
                            <ActionBadge action={p.action_name} />
                          </div>
                          <div
                            className="text-xs font-mono text-gray-500 truncate"
                            title={p.perm_key}
                          >
                            {p.perm_key}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Footer */}
      {isDirty && (
        <div className="sticky bottom-4 flex justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white border border-indigo-200 shadow-xl rounded-2xl px-5 py-3 flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              لديك{" "}
              <span className="font-bold text-indigo-700">{selected.size}</span>{" "}
              صلاحية محددة
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}