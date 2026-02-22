import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { apiClient, useAuthStore } from "../../../stores/authStore";
import { allRoutes } from "../../../router/allRoutes";
import { PERMISSIONS } from "../../../utils/permissions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserInfo {
  user_id: number;
  username: string;
  email?: string;
  full_name?: string;
}

interface Hotel {
  hotel_id: number;
  hotel_name: string;
  location?: string;
  is_active: number;
}

interface Department {
  department_id: number;
  department_name: string;
  hotel_id: number;
  is_active: number;
}

interface HotelDeptLink {
  hotel_id: number;
  department_id: number;
}

interface UserScope {
  hotelIds: number[];
  departmentIds: number[];
  hotelDeptPairs?: { hotel_id: number; department_id: number }[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const UserScopePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission(PERMISSIONS.USER_EDIT);

  const [user, setUser] = useState<UserInfo | null>(null);
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [hotelDeptLinks, setHotelDeptLinks] = useState<HotelDeptLink[]>([]);

  const [selectedHotelIds, setSelectedHotelIds] = useState<Set<number>>(new Set());
  // composite key = "hotelId:deptId" — keeps dept selections independent per hotel
  const [selectedDeptKeys, setSelectedDeptKeys] = useState<Set<string>>(new Set());
  const [originalHotelIds, setOriginalHotelIds] = useState<Set<number>>(new Set());
  const [originalDeptKeys, setOriginalDeptKeys] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [userRes, hotelsRes, deptsRes, linksRes, scopeRes] = await Promise.all([
        apiClient.get(`/users/${userId}`),
        apiClient.get("/hotels"),
        apiClient.get("/departments"),
        apiClient.get("/hotels/all-links"),
        apiClient.get(`/users/${userId}/scope`),
      ]);

      setUser(userRes.data?.data ?? userRes.data ?? null);
      setAllHotels(hotelsRes.data?.data ?? []);
      setAllDepartments(deptsRes.data?.data ?? []);

      const rawLinks: HotelDeptLink[] = linksRes.data?.data ?? [];
      setHotelDeptLinks(rawLinks);

      const scope: UserScope = scopeRes.data?.data ?? { hotelIds: [], departmentIds: [] };
      const hSet = new Set<number>(scope.hotelIds);

      // Build composite keys from saved hotelDeptPairs (preferred - exact per-hotel assignment)
      // Fallback: rebuild from junction map (first-time migration compatibility)
      const deptKeys = new Set<string>();
      if (scope.hotelDeptPairs && scope.hotelDeptPairs.length > 0) {
        for (const pair of scope.hotelDeptPairs) {
          deptKeys.add(`${pair.hotel_id}:${pair.department_id}`);
        }
      } else {
        // Legacy fallback: expand via junction map
        const deptsByHotelLocal = new Map<number, number[]>();
        for (const link of rawLinks) {
          if (!deptsByHotelLocal.has(link.hotel_id)) deptsByHotelLocal.set(link.hotel_id, []);
          deptsByHotelLocal.get(link.hotel_id)!.push(link.department_id);
        }
        for (const deptId of scope.departmentIds) {
          for (const [hotelId, deptIds] of deptsByHotelLocal) {
            if (hSet.has(hotelId) && deptIds.includes(deptId)) {
              deptKeys.add(`${hotelId}:${deptId}`);
            }
          }
        }
      }

      setSelectedHotelIds(new Set(hSet));
      setSelectedDeptKeys(new Set(deptKeys));
      setOriginalHotelIds(new Set(hSet));
      setOriginalDeptKeys(new Set(deptKeys));
    } catch (err) {
      console.error(err);
      await Swal.fire({ icon: "error", title: "خطأ", text: "فشل في تحميل البيانات" });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Derived: departments per hotel (from junction table) ───────────────────
  const deptsByHotel = useMemo(() => {
    const map = new Map<number, number[]>();
    for (const link of hotelDeptLinks) {
      if (!map.has(link.hotel_id)) map.set(link.hotel_id, []);
      map.get(link.hotel_id)!.push(link.department_id);
    }
    return map;
  }, [hotelDeptLinks]);

  // ── Filter hotels by search ────────────────────────────────────────────────
  const filteredHotels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allHotels;
    return allHotels.filter(
      (h) =>
        h.hotel_name.toLowerCase().includes(q) ||
        (h.location?.toLowerCase().includes(q) ?? false)
    );
  }, [allHotels, search]);

  // ── Unique selected dept IDs (for save payload & stats) ──────────────────
  const selectedUniqueDeptIds = useMemo(
    () => new Set([...selectedDeptKeys].map((k) => Number(k.split(":")[1]))),
    [selectedDeptKeys]
  );

  // ── Has changes ────────────────────────────────────────────────────────────
  const isDirty = useMemo(() => {
    if (selectedHotelIds.size !== originalHotelIds.size) return true;
    for (const id of selectedHotelIds) if (!originalHotelIds.has(id)) return true;
    if (selectedDeptKeys.size !== originalDeptKeys.size) return true;
    for (const k of selectedDeptKeys) if (!originalDeptKeys.has(k)) return true;
    return false;
  }, [selectedHotelIds, selectedDeptKeys, originalHotelIds, originalDeptKeys]);

  // ── Toggle hotel ───────────────────────────────────────────────────────────
  const toggleHotel = (hotelId: number) => {
    setSelectedHotelIds((prev) => {
      const next = new Set(prev);
      if (next.has(hotelId)) {
        next.delete(hotelId);
        // Remove all composite dept keys belonging to this hotel
        setSelectedDeptKeys((prevD) => {
          const nextD = new Set(prevD);
          for (const key of [...nextD]) {
            if (key.startsWith(`${hotelId}:`)) nextD.delete(key);
          }
          return nextD;
        });
      } else {
        next.add(hotelId);
      }
      return next;
    });
  };

  // ── Toggle department (per-hotel independent) ────────────────────────────
  const toggleDept = (hotelId: number, deptId: number) => {
    const key = `${hotelId}:${deptId}`;
    setSelectedDeptKeys((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── Select all depts for a hotel ───────────────────────────────────────────
  const selectAllDeptsForHotel = (hotelId: number) => {
    const deptIds = deptsByHotel.get(hotelId) || [];
    setSelectedDeptKeys((prev) => {
      const next = new Set(prev);
      deptIds.forEach((id) => next.add(`${hotelId}:${id}`));
      return next;
    });
  };

  const clearAllDeptsForHotel = (hotelId: number) => {
    const deptIds = deptsByHotel.get(hotelId) || [];
    setSelectedDeptKeys((prev) => {
      const next = new Set(prev);
      deptIds.forEach((id) => next.delete(`${hotelId}:${id}`));
      return next;
    });
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const confirmed = await Swal.fire({
      icon: "question",
      title: "تأكيد الحفظ",
      text: "هل تريد حفظ نطاق صلاحيات هذا المستخدم؟",
      showCancelButton: true,
      confirmButtonText: "حفظ",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
    });
    if (!confirmed.isConfirmed) return;

    setSaving(true);
    try {
      // Flatten composite keys to unique dept IDs and per-hotel pairs for the backend
      const uniqueDeptIds = [...new Set([...selectedDeptKeys].map((k) => Number(k.split(":")[1])))];
      const hotelDeptPairs = [...selectedDeptKeys].map((k) => {
        const [h, d] = k.split(":");
        return { hotel_id: Number(h), department_id: Number(d) };
      });
      await apiClient.put(`/users/${userId}/scope`, {
        hotelIds: Array.from(selectedHotelIds),
        departmentIds: uniqueDeptIds,
        hotelDeptPairs,
      });
      setOriginalHotelIds(new Set(selectedHotelIds));
      setOriginalDeptKeys(new Set(selectedDeptKeys));
      await Swal.fire({
        icon: "success",
        title: "تم الحفظ",
        text: "تم تحديث نطاق المستخدم بنجاح",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "خطأ",
        text: err?.response?.data?.message || "فشل في حفظ النطاق",
      });
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto" />
          <p className="text-sm text-gray-500">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // ── Helpers for rendering ──────────────────────────────────────────────────
  const getDeptInfo = (deptId: number) =>
    allDepartments.find((d) => d.department_id === deptId);

  const selectedHotelsList = allHotels.filter((h) => selectedHotelIds.has(h.hotel_id));

  return (
    <div className="p-4 md:p-6 space-y-5" dir="rtl">
      {/* Back + Header */}
      <div className="flex items-start gap-3">
        <Link
          to={allRoutes.adminUsers}
          className="mt-0.5 p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition"
          title="رجوع"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                نطاق البيانات — {user?.username ?? `مستخدم #${userId}`}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {user?.full_name && <span className="text-gray-600">{user.full_name}</span>}
                {user?.email && <span className="text-gray-400 mr-2">• {user.email}</span>}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                حدد الفنادق والأقسام التي يمكن لهذا المستخدم الوصول إليها
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { value: allHotels.length, label: "إجمالي الفنادق" },
          { value: selectedHotelIds.size, label: "فنادق مُسندة", highlight: true },
          { value: allDepartments.length, label: "إجمالي الأقسام" },
          { value: selectedUniqueDeptIds.size, label: "أقسام مُسندة", highlight: true },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border shadow-sm px-4 py-3 text-center ${
              s.highlight ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-200"
            }`}
          >
            <div className={`text-2xl font-bold ${s.highlight ? "text-indigo-600" : "text-gray-700"}`}>
              {s.value}
            </div>
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
            placeholder="بحث في الفنادق..."
            className="w-full pr-9 pl-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
      </div>

      {/* Main content: Hotels + Departments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hotels panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700">
                🏨 الفنادق
                <span className="text-xs font-normal text-gray-400 mr-2">
                  ({selectedHotelIds.size}/{allHotels.length})
                </span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedHotelIds(new Set(allHotels.map((h) => h.hotel_id)))}
                  className="text-[11px] px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                >
                  تحديد الكل
                </button>
                <button
                  onClick={() => {
                    setSelectedHotelIds(new Set());
                    setSelectedDeptKeys(new Set());
                  }}
                  className="text-[11px] px-2 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                >
                  إلغاء الكل
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
            {filteredHotels.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">لا توجد فنادق مطابقة</div>
            ) : (
              filteredHotels.map((hotel) => {
                const checked = selectedHotelIds.has(hotel.hotel_id);
                const linkedDeptsCount = (deptsByHotel.get(hotel.hotel_id) || []).length;

                return (
                  <label
                    key={hotel.hotel_id}
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition hover:bg-gray-50 ${
                      checked ? "bg-indigo-50/40" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleHotel(hotel.hotel_id)}
                      className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800">{hotel.hotel_name}</div>
                      {hotel.location && (
                        <div className="text-xs text-gray-400 truncate">{hotel.location}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {linkedDeptsCount > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {linkedDeptsCount} قسم
                        </span>
                      )}
                      {hotel.is_active === 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 ring-1 ring-red-200">
                          غير نشط
                        </span>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Departments panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-700">
              🏢 الأقسام المرتبطة
              <span className="text-xs font-normal text-gray-400 mr-2">
                ({selectedUniqueDeptIds.size} مُسند)
              </span>
            </h2>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {selectedHotelsList.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <div className="text-3xl mb-2">🏨</div>
                اختر فندقاً واحداً على الأقل لعرض الأقسام
              </div>
            ) : (
              selectedHotelsList.map((hotel) => {
                const linkedDeptIds = deptsByHotel.get(hotel.hotel_id) || [];
                const linkedDepts = linkedDeptIds
                  .map((id) => getDeptInfo(id))
                  .filter(Boolean) as Department[];

                if (linkedDepts.length === 0) {
                  return (
                    <div key={hotel.hotel_id} className="px-5 py-3 border-b border-gray-50">
                      <div className="text-sm font-semibold text-gray-600 mb-1">{hotel.hotel_name}</div>
                      <div className="text-xs text-gray-400">لا توجد أقسام مرتبطة بهذا الفندق</div>
                    </div>
                  );
                }

                const allSelected = linkedDepts.every((d) => selectedDeptKeys.has(`${hotel.hotel_id}:${d.department_id}`));
                const someSelected = linkedDepts.some((d) => selectedDeptKeys.has(`${hotel.hotel_id}:${d.department_id}`));

                return (
                  <div key={hotel.hotel_id} className="border-b border-gray-100">
                    {/* Hotel header */}
                    <div className="flex items-center justify-between px-5 py-2 bg-gray-50/60">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">{hotel.hotel_name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                          {linkedDepts.filter((d) => selectedDeptKeys.has(`${hotel.hotel_id}:${d.department_id}`)).length}/{linkedDepts.length}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          allSelected
                            ? clearAllDeptsForHotel(hotel.hotel_id)
                            : selectAllDeptsForHotel(hotel.hotel_id)
                        }
                        className="text-[11px] px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                      >
                        {allSelected ? "إلغاء الكل" : "تحديد الكل"}
                      </button>
                    </div>

                    {/* Department checkboxes */}
                    <div className="divide-y divide-gray-50">
                      {linkedDepts.map((dept) => {
                        const dChecked = selectedDeptKeys.has(`${hotel.hotel_id}:${dept.department_id}`);
                        return (
                          <label
                            key={`${hotel.hotel_id}-${dept.department_id}`}
                            className={`flex items-center gap-3 px-5 py-2.5 pr-10 cursor-pointer transition hover:bg-gray-50 ${
                              dChecked ? "bg-indigo-50/30" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={dChecked}
                              onChange={() => toggleDept(hotel.hotel_id, dept.department_id)}
                              className="h-4 w-4 rounded text-indigo-600 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700">{dept.department_name}</span>
                            {dept.is_active === 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-500 ring-1 ring-red-200">
                                غير نشط
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Floating save bar */}
      {isDirty && (
        <div className="sticky bottom-4 z-30">
          <div className="max-w-xl mx-auto bg-white border border-indigo-200 shadow-lg rounded-2xl px-5 py-3 flex items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-indigo-600">{selectedHotelIds.size}</span> فنادق
              {" · "}
              <span className="font-semibold text-indigo-600">{selectedUniqueDeptIds.size}</span> أقسام
              <span className="text-xs text-gray-400 mr-2">— تغييرات غير محفوظة</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedHotelIds(new Set(originalHotelIds));
                  setSelectedDeptKeys(new Set(originalDeptKeys));
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                تراجع
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition ${
                  saving ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {saving ? "جاري الحفظ..." : "حفظ النطاق"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserScopePage;
