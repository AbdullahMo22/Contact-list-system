import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { apiClient, useAuthStore } from "../../../stores/authStore";
import { PERMISSIONS } from "../../../utils/permissions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Permission {
  permission_id: number;
  perm_key: string;
  module_name: string;
  action_name: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODULES = ["CONTACT", "HOTEL", "DEPARTMENT", "USER", "ROLE", "LOG"];
const ACTIONS = ["View", "Create", "Edit", "Delete", "Manage"];

const ACTION_COLORS: Record<string, string> = {
  View:   "bg-blue-50 text-blue-700 ring-blue-200",
  Create: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Edit:   "bg-amber-50 text-amber-700 ring-amber-200",
  Delete: "bg-red-50 text-red-700 ring-red-200",
  Manage: "bg-purple-50 text-purple-700 ring-purple-200",
};

function ActionBadge({ action }: { action: string }) {
  const cls = ACTION_COLORS[action] ?? "bg-gray-50 text-gray-600 ring-gray-200";
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ${cls}`}>
      {action}
    </span>
  );
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

// ─── Component ────────────────────────────────────────────────────────────────

const PermissionManagement: React.FC = () => {
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission(PERMISSIONS.ROLE_MANAGE);

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [form, setForm] = useState({ perm_key: "", module_name: "", action_name: "" });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchPermissions = useCallback(async () => {
    try {
      const res = await apiClient.get("/permissions");
      setPermissions(res.data?.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

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

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return permissions.filter((p) => {
      const matchModule = filterModule === "ALL" || p.module_name === filterModule;
      const matchSearch =
        !q ||
        p.perm_key.toLowerCase().includes(q) ||
        p.module_name.toLowerCase().includes(q) ||
        p.action_name.toLowerCase().includes(q);
      return matchModule && matchSearch;
    });
  }, [permissions, search, filterModule]);

  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of filtered) {
      const g = p.module_name || "General";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const allModules = useMemo(
    () => Array.from(new Set(permissions.map((p) => p.module_name))).sort(),
    [permissions]
  );

  // ── Auto-generate perm_key ─────────────────────────────────────────────────
  const autoKey = (module: string, action: string) =>
    module && action ? `${module.toUpperCase()}_${action.toUpperCase()}` : "";

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-fill perm_key if not manually edited
      if (field === "module_name" || field === "action_name") {
        const generatedKey = autoKey(
          field === "module_name" ? value : prev.module_name,
          field === "action_name" ? value : prev.action_name
        );
        next.perm_key = generatedKey;
      }
      return next;
    });
  };

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { perm_key, module_name, action_name } = form;
    if (!perm_key.trim() || !module_name.trim() || !action_name.trim()) {
      await Swal.fire({ icon: "warning", title: "بيانات ناقصة", text: "جميع الحقول مطلوبة" });
      return;
    }
    const dup = permissions.some(p => p.perm_key.toUpperCase() === perm_key.toUpperCase().trim());
    if (dup) {
      await Swal.fire({ icon: "warning", title: "موجود مسبقاً", text: "هذه الصلاحية موجودة بالفعل" });
      return;
    }
    setSaving(true);
    try {
      await apiClient.post("/permissions", {
        permKey: perm_key.trim().toUpperCase(),
        module_name: module_name.trim(),
        action_name: action_name.trim(),
      });
      setForm({ perm_key: "", module_name: "", action_name: "" });
      setShowForm(false);
      await Swal.fire({ icon: "success", title: "تم", text: "تمت إضافة الصلاحية بنجاح", timer: 1200, showConfirmButton: false });
      await fetchPermissions();
    } catch (err: any) {
      await Swal.fire({ icon: "error", title: "خطأ", text: err?.response?.data?.message || "فشل في إضافة الصلاحية" });
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = async (perm: Permission) => {
    const result = await Swal.fire({
      title: "تعديل الصلاحية",
      html: `
        <div style="display:grid;gap:12px;text-align:right">
          <div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:4px">المفتاح (perm_key)</div>
            <input id="sw-key" class="swal2-input" value="${escapeHtml(perm.perm_key)}" style="width:100%;margin:0" />
          </div>
          <div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:4px">الوحدة (module)</div>
            <input id="sw-module" class="swal2-input" value="${escapeHtml(perm.module_name)}" style="width:100%;margin:0" />
          </div>
          <div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:4px">الإجراء (action)</div>
            <input id="sw-action" class="swal2-input" value="${escapeHtml(perm.action_name)}" style="width:100%;margin:0" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "حفظ",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
      focusConfirm: false,
      preConfirm: () => {
        const key    = (document.getElementById("sw-key") as HTMLInputElement)?.value?.trim().toUpperCase();
        const module = (document.getElementById("sw-module") as HTMLInputElement)?.value?.trim();
        const action = (document.getElementById("sw-action") as HTMLInputElement)?.value?.trim();
        if (!key || !module || !action) { Swal.showValidationMessage("جميع الحقول مطلوبة"); return; }
        const dup = permissions.some(p => p.permission_id !== perm.permission_id && p.perm_key.toUpperCase() === key);
        if (dup) { Swal.showValidationMessage("المفتاح مستخدم بالفعل"); return; }
        return { permKey: key, module_name: module, action_name: action };
      },
    });
    if (!result.isConfirmed || !result.value) return;
    try {
      await apiClient.put(`/permissions/${perm.permission_id}`, result.value);
      await Swal.fire({ icon: "success", title: "تم الحفظ", timer: 1100, showConfirmButton: false });
      await fetchPermissions();
    } catch (err: any) {
      await Swal.fire({ icon: "error", title: "خطأ", text: err?.response?.data?.message || "فشل في التعديل" });
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (perm: Permission) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "تأكيد الحذف",
      html: `هل تريد حذف الصلاحية <b>${perm.perm_key}</b>؟<br/><span style="color:#ef4444;font-size:12px">تحذير: ستُزال من كل الأدوار المرتبطة بها</span>`,
      showCancelButton: true,
      confirmButtonText: "نعم، احذف",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    setDeletingId(perm.permission_id);
    try {
      await apiClient.delete(`/permissions/${perm.permission_id}`);
      await Swal.fire({ icon: "success", title: "تم الحذف", timer: 1200, showConfirmButton: false });
      await fetchPermissions();
    } catch (err: any) {
      await Swal.fire({ icon: "error", title: "خطأ", text: err?.response?.data?.message || "فشل في الحذف" });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-5" dir="rtl">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">إدارة الصلاحيات</h1>
          <p className="text-sm text-gray-500 mt-0.5">إضافة وتعديل وحذف صلاحيات النظام</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setForm({ perm_key: "", module_name: "", action_name: "" }); }}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm ${showForm ? "bg-gray-100 text-gray-700" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
        >
          {showForm ? "إلغاء" : "+ إضافة صلاحية جديدة"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: permissions.length, label: "إجمالي الصلاحيات", color: "text-indigo-600" },
          { value: allModules.length, label: "وحدة", color: "text-gray-700" },
          { value: filtered.length, label: "نتائج البحث", color: "text-gray-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4">إضافة صلاحية جديدة</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">الوحدة (Module) <span className="text-red-500">*</span></label>
                <select
                  value={form.module_name}
                  onChange={(e) => handleFormChange("module_name", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">-- اختر --</option>
                  {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">الإجراء (Action) <span className="text-red-500">*</span></label>
                <select
                  value={form.action_name}
                  onChange={(e) => handleFormChange("action_name", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">-- اختر --</option>
                  {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">المفتاح (perm_key) <span className="text-red-500">*</span></label>
                <input
                  value={form.perm_key}
                  onChange={(e) => setForm((prev) => ({ ...prev, perm_key: e.target.value.toUpperCase() }))}
                  placeholder="مثال: CONTACT_VIEW"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition ${saving ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
              >
                {saving ? "جاري الحفظ..." : "إضافة الصلاحية"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 12a7.5 7.5 0 0012.15 5.65z" />
            </svg>
          </span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث بالمفتاح أو الوحدة أو الإجراء..."
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          {["ALL", ...allModules].map((m) => (
            <button key={m} onClick={() => setFilterModule(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filterModule === m ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {m === "ALL" ? "الكل" : m}
            </button>
          ))}
        </div>
      </div>

      {/* Permissions by Module */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center text-gray-400 text-sm">
          لا توجد صلاحيات مطابقة.
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([moduleName, items]) => (
            <div key={moduleName} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Module Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-800">{moduleName}</h3>
                  <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5 font-medium">
                    {items.length}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">المفتاح</th>
                      <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">الإجراء</th>
                      <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">المعرّف</th>
                      <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {items.map((p) => (
                      <tr key={p.permission_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">{p.perm_key}</span>
                        </td>
                        <td className="px-5 py-3">
                          <ActionBadge action={p.action_name} />
                        </td>
                        <td className="px-5 py-3 text-xs font-mono text-gray-400">#{p.permission_id}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(p)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              disabled={deletingId === p.permission_id}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                                deletingId === p.permission_id
                                  ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                                  : "bg-red-50 text-red-700 hover:bg-red-100"
                              }`}
                            >
                              {deletingId === p.permission_id ? "جاري..." : "حذف"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PermissionManagement;
