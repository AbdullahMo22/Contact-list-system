import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Layers,
  Plus,
  Pencil,
  Trash2,
  X,
  MapPin,
  Power,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react";
import Swal from "sweetalert2";
import { apiClient, useAuthStore } from "../../stores/authStore";
import { PERMISSIONS } from "../../utils/permissions";

interface Hotel {
  hotel_id: number;
  hotel_name: string;
  location: string;
  is_active: number; // 1 | 0
}

interface Department {
  department_id: number;
  department_name: string;
  is_active: number; // 1 | 0
}

type Filter = "ALL" | "ACTIVE" | "INACTIVE";

// Helpers
const emptyHotel = (): Partial<Hotel> => ({ hotel_name: "", location: "" });
const emptyDept = (): Partial<Department> => ({ department_name: "" });

// ===== SweetAlert2 (بديل toast/confirm في utils/alert) =====
const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2600,
  timerProgressBar: true,
  didOpen: (t) => {
    t.addEventListener("mouseenter", Swal.stopTimer);
    t.addEventListener("mouseleave", Swal.resumeTimer);
  },
  // لو واجهت RTL:
  // customClass: { popup: "text-right" },
});

const confirmDanger = (title: string, text?: string) =>
  Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "حذف",
    cancelButtonText: "إلغاء",
    confirmButtonColor: "#dc2626", // red-600
    reverseButtons: true,
    focusCancel: true,
    // customClass: { popup: "text-right" },
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
    // customClass: { popup: "text-right" },
  });

const OrganizationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"HOTELS" | "DEPTS">("HOTELS");
  const [filter, setFilter] = useState<Filter>("ALL");

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(true);

  // hotel_id -> Set of linked department_ids
  const [hotelDeptMap, setHotelDeptMap] = useState<Record<number, number[]>>({});

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const { hasPermission } = useAuthStore();

  // Hotel modal
  const [isHotelModalOpen, setIsHotelModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Partial<Hotel>>(emptyHotel());
  const [hotelSaving, setHotelSaving] = useState(false);
  const [hotelError, setHotelError] = useState<string | null>(null);

  // Department modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Partial<Department>>(emptyDept());
  const [deptSaving, setDeptSaving] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);

  // Hotel-Department link modal
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkingHotel, setLinkingHotel] = useState<Hotel | null>(null);
  const [selectedDeptIds, setSelectedDeptIds] = useState<Set<number>>(new Set());
  const [linkSaving, setLinkSaving] = useState(false);

  const fetchHotels = async () => {
    setLoadingHotels(true);
    setGlobalError(null);
    try {
      const res = await apiClient.get("/hotels");
      setHotels(res.data.data || []);
    } catch {
      setGlobalError("فشل تحميل الفنادق.");
    } finally {
      setLoadingHotels(false);
    }
  };

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    setGlobalError(null);
    try {
      const res = await apiClient.get("/departments");
      setDepartments(res.data.data || []);
    } catch {
      setGlobalError("فشل تحميل الأقسام.");
    } finally {
      setLoadingDepts(false);
    }
  };

  const fetchHotelDeptLinks = async () => {
    try {
      const res = await apiClient.get("/hotels/all-links");
      const links: { hotel_id: number; department_id: number }[] = res.data.data || [];
      const map: Record<number, number[]> = {};
      for (const { hotel_id, department_id } of links) {
        if (!map[hotel_id]) map[hotel_id] = [];
        map[hotel_id].push(department_id);
      }
      setHotelDeptMap(map);
    } catch {
      // non-blocking – links just won't show if this fails
    }
  };

  useEffect(() => {
    fetchHotels();
    fetchDepartments();
    fetchHotelDeptLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset filter when switching tabs
  const switchTab = (tab: "HOTELS" | "DEPTS") => {
    setActiveTab(tab);
    setFilter("ALL");
    setQuery("");
    setGlobalError(null);
  };

  const filteredHotels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hotels
      .filter((h) =>
        filter === "ALL" ? true : filter === "ACTIVE" ? h.is_active === 1 : h.is_active === 0
      )
      .filter((h) => {
        if (!q) return true;
        return (
          h.hotel_name.toLowerCase().includes(q) ||
          (h.location || "").toLowerCase().includes(q)
        );
      });
  }, [hotels, filter, query]);

  const filteredDepts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return departments
      .filter((d) =>
        filter === "ALL" ? true : filter === "ACTIVE" ? d.is_active === 1 : d.is_active === 0
      )
      .filter((d) => {
        if (!q) return true;
        return d.department_name.toLowerCase().includes(q);
      });
  }, [departments, filter, query]);

   const deptsForHotel = (hotelId: number) => {
    const ids = hotelDeptMap[hotelId] || [];
    return departments.filter((d) => ids.includes(d.department_id));
  };

   const hotelsForDept = (deptId: number) =>
    hotels.filter((h) => (hotelDeptMap[h.hotel_id] || []).includes(deptId));

  const hotelName = (hotelId: number) =>
    hotels.find((h) => h.hotel_id === hotelId)?.hotel_name ?? "—";

  // Hotel CRUD
  const openCreateHotel = () => {
    setEditingHotel(emptyHotel());
    setHotelError(null);
    setIsHotelModalOpen(true);
  };

  const openEditHotel = (h: Hotel) => {
    setEditingHotel({ ...h });
    setHotelError(null);
    setIsHotelModalOpen(true);
  };

  const handleSaveHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    setHotelSaving(true);
    setHotelError(null);

    try {
      if (editingHotel.hotel_id) {
        await apiClient.put(`/hotels/${editingHotel.hotel_id}`, {
          hotel_name: editingHotel.hotel_name,
          location: editingHotel.location,
        });
        toast.fire({ icon: "success", title: "تم تحديث الفندق بنجاح" });
      } else {
        await apiClient.post("/hotels", {
          hotel_name: editingHotel.hotel_name,
          location: editingHotel.location,
        });
        toast.fire({ icon: "success", title: "تم إنشاء الفندق بنجاح" });
      }
      setIsHotelModalOpen(false);
      fetchHotels();
    } 
    // catch (err: any) {
    //   const msg = err?.response?.data?.message || "فشل الحفظ.";
    //   setHotelError(msg);
    //   toast.fire({ icon: "error", title: msg });
    // } 
      catch (err: any) {
        if (err?.response?.status === 403) return;
  const nice = prettifyApiError(err);

  // الأفضل للـ form errors: inline واضح
  setHotelError(nice);

  // لو عايز توست خفيف كمان:
  toast.fire({ icon: "error", title: nice });

  // ولو الخطأ مش متوقع (مثلاً 500/Network) اعرض مودال بدل التوست:
  const status = err?.response?.status;
  if (!status || status >= 500) {
    await Swal.fire({
      icon: "error",
      title: "حصلت مشكلة",
      text: nice,
      confirmButtonText: "تمام",
    });
  }
}

    finally {
      setHotelSaving(false);
    }
  };

  const handleDeleteHotel = async (id: number) => {
    const result = await confirmDanger("حذف الفندق؟", "سيتم حذف الفندق وإلغاء ربطه بكل الأقسام.");
    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/hotels/${id}`);
      setHotels((prev) => prev.filter((h) => h.hotel_id !== id));
      // Remove from link map
      setHotelDeptMap((prev) => { const next = { ...prev }; delete next[id]; return next; });
      toast.fire({ icon: "success", title: "تم حذف الفندق" });
    } catch (err: any) {
        if (err?.response?.status === 403) return;
      toast.fire({ icon: "error", title: err?.response?.data?.message || "فشل في الحذف" });
    }
  };

  const handleToggleHotel = async (id: number) => {
    const current = hotels.find((h) => h.hotel_id === id);
    const nextState = current?.is_active === 1 ? "Deactivate" : "Activate";

    const result = await confirmToggle(
      nextState === "Activate" ? "تفعيل الفندق؟" : "إيقاف الفندق؟",
      "هل أنت متأكد؟",
      nextState === "Activate" ? "تفعيل" : "إيقاف"
    );
    if (!result.isConfirmed) return;

    try {
      const res = await apiClient.patch(`/hotels/${id}/toggle-active`);
      const updated: Hotel = res.data.data;
      setHotels((prev) => prev.map((h) => (h.hotel_id === id ? updated : h)));
      toast.fire({
        icon: "success",
        title: nextState === "Activate" ? "تم تفعيل الفندق" : "تم إيقاف الفندق",
      });
    } catch (err: any) {
        if (err?.response?.status === 403) return;
      toast.fire({ icon: "error", title: err?.response?.data?.message || "فشل تغيير الحالة" });
    }
  };

  // Department CRUD
  const openCreateDept = () => {
    setEditingDept(emptyDept());
    setDeptError(null);
    setIsDeptModalOpen(true);
  };

  const openEditDept = (d: Department) => {
    setEditingDept({ ...d });
    setDeptError(null);
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptSaving(true);
    setDeptError(null);
    const name = (editingDept.department_name || "").trim().replace(/\s+/g, " ");
    if (!name) {
      setDeptError("اسم القسم لا يمكن أن يكون فارغًا.");
      setDeptSaving(false);
      return;
    }

    try {
      if (editingDept.department_id) {
        await apiClient.put(`/departments/${editingDept.department_id}`, {
          department_name: name,
        });
        toast.fire({ icon: "success", title: "تم تحديث القسم بنجاح" });
      } else {
        await apiClient.post("/departments", {
          department_name: name,
        });
        toast.fire({ icon: "success", title: "تم إنشاء القسم بنجاح" });
      }
      setIsDeptModalOpen(false);
      fetchDepartments();
    } catch (err: any) {
      if (err?.response?.status === 403) return;
      const nice = prettifyApiErrorDEPART(err);
      setDeptError(nice);
      toast.fire({ icon: "error", title: nice });
    } finally {
      setDeptSaving(false);
    }
  };

  // Link modal handlers
  const openLinkModal = (hotel: Hotel) => {
    setLinkingHotel(hotel);
    setSelectedDeptIds(new Set(hotelDeptMap[hotel.hotel_id] || []));
    setIsLinkModalOpen(true);
  };

  const handleSaveLinks = async () => {
    if (!linkingHotel) return;
    setLinkSaving(true);
    try {
      await apiClient.post(`/hotels/${linkingHotel.hotel_id}/departments`, {
        department_ids: Array.from(selectedDeptIds),
      });
      setHotelDeptMap((prev) => ({
        ...prev,
        [linkingHotel.hotel_id]: Array.from(selectedDeptIds),
      }));
      setIsLinkModalOpen(false);
      toast.fire({ icon: "success", title: "تم تحديث أقسام الفندق" });
    } catch (err: any) {
      if (err?.response?.status === 403) return;
      toast.fire({ icon: "error", title: err?.response?.data?.message || "فشل تحديث الأقسام" });
    } finally {
      setLinkSaving(false);
    }
  };

  const handleDeleteDept = async (id: number) => {
    const result = await confirmDanger("حذف القسم؟", "لن يمكن التراجع عن هذا الإجراء.");
    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/departments/${id}`);
      setDepartments((prev) => prev.filter((d) => d.department_id !== id));
      toast.fire({ icon: "success", title: "تم حذف القسم" });
    } catch (err: any) {
        if (err?.response?.status === 403) return;
      toast.fire({ icon: "error", title: err?.response?.data?.message || "فشل في الحذف" });
    }
  };

  const handleToggleDept = async (id: number) => {
    const current = departments.find((d) => d.department_id === id);
    const nextState = current?.is_active === 1 ? "Deactivate" : "Activate";

    const result = await confirmToggle(
      nextState === "Activate" ? "تفعيل القسم؟" : "إيقاف القسم؟",
      "هل أنت متأكد؟",
      nextState === "Activate" ? "تفعيل" : "إيقاف"
    );
    if (!result.isConfirmed) return;

    try {
      const res = await apiClient.patch(`/departments/${id}/toggle-active`);
      const updated: Department = res.data.data;
      setDepartments((prev) => prev.map((d) => (d.department_id === id ? updated : d)));
      toast.fire({
        icon: "success",
        title: nextState === "Activate" ? "تم تفعيل القسم" : "تم إيقاف القسم",
      });
    } catch (err: any) {
        if (err?.response?.status === 403) return;
      toast.fire({ icon: "error", title: err?.response?.data?.message || "فشل تغيير الحالة" });
    }
  };

  // Stats
  const currentList = activeTab === "HOTELS" ? hotels : departments;
  const countAll = currentList.length;
  const countActive = currentList.filter((i) => i.is_active === 1).length;
  const countInactive = currentList.filter((i) => i.is_active === 0).length;

  const StatusBadge = ({ active }: { active: number }) =>
    active === 1 ? (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle className="h-3 w-3" /> Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 ring-1 ring-gray-200">
        <XCircle className="h-3 w-3" /> Inactive
      </span>
    );

  const FilterBar = () => (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl p-1 shadow-sm text-sm">
      {(["ALL", "ACTIVE", "INACTIVE"] as Filter[]).map((f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
      filter === f
  ? "bg-indigo-600 text-white"
  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"

          }`}
        >
          {f === "ALL"
            ? `All (${countAll})`
            : f === "ACTIVE"
            ? `Active (${countActive})`
            : `Inactive (${countInactive})`}
        </button>
      ))}
    </div>
  );
const prettifyApiError = (err: any) => {
  const raw =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "";

  const msg = String(raw);
  const lower = msg.toLowerCase();

  // Duplicate hotel name (MySQL/MariaDB)
  if (lower.includes("duplicate entry") || lower.includes("uq_hotel_name")) {
    return "اسم الفندق موجود بالفعل. جرّب اسم مختلف.";
  }

  // Duplicate department name (لو عندك unique على القسم)
  if (lower.includes("uq_department_name") || lower.includes("departments.uq")) {
    return "اسم القسم موجود بالفعل. جرّب اسم مختلف.";
  }

  // Generic validation
  if (lower.includes("validation") || lower.includes("required")) {
    return "من فضلك راجع الحقول المطلوبة.";
  }

  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
};
const prettifyApiErrorDEPART = (err: any) => {
  const raw =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "";

  const msg = String(raw).toLowerCase();

  // duplicate department inside same hotel
  if (msg.includes("uq_hotel_dept")) {
    return "اسم القسم موجود بالفعل داخل هذا الفندق.";
  }

  // duplicate hotel name
  if (msg.includes("uq_hotel_name")) {
    return "اسم الفندق موجود بالفعل.";
  }

  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
};

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organization Structure</h2>
          <p className="text-gray-500 text-sm mt-1">Manage properties and organizational units</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={activeTab === "HOTELS" ? "Search hotels..." : "Search departments..."}
              className="w-64 max-w-full rounded-2xl border border-gray-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Tabs */}
          <div className="flex bg-white rounded-2xl  gap-2 p-1 border border-gray-200 shadow-sm">
            {(["HOTELS", "DEPTS"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
activeTab === tab ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab === "HOTELS" ? <Building2 className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
                {tab === "HOTELS" ? "Hotels" : "Departments"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Global error */}
      {globalError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
          <span>{globalError}</span>
          <button
            onClick={() => setGlobalError(null)}
            className="ml-3 p-1.5 rounded-lg hover:bg-red-100 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar />
        {((activeTab === "HOTELS" && hasPermission(PERMISSIONS.HOTEL_CREATE)) ||
          (activeTab === "DEPTS" && hasPermission(PERMISSIONS.DEPARTMENT_CREATE))) && (
          <button
            onClick={activeTab === "HOTELS" ? openCreateHotel : openCreateDept}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            {activeTab === "HOTELS" ? "Add Hotel" : "Add Department"}
          </button>
        )}
      </div>

      {/* HOTELS */}
      {activeTab === "HOTELS" && (
        <>
          {loadingHotels ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Building2 className="h-7 w-7 text-slate-300" />
              </div>
              <p className="font-semibold text-gray-600">No hotels found</p>
              <p className="text-sm mt-1">
                {filter !== "ALL"
                  ? `No ${filter.toLowerCase()} hotels.`
                  : "Add your first hotel to get started."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredHotels.map((hotel) => {
                const depts = deptsForHotel(hotel.hotel_id);
                const isActive = hotel.is_active === 1;

                return (
                  <div
                    key={hotel.hotel_id}
                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                      isActive ? "border-slate-200" : "border-slate-200 bg-slate-50"

                    }`}
                  >
                    <div className={`h-1 w-full ${isActive ? "bg-indigo-500" : "bg-gray-300"}`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2.5 rounded-2xl ${
                              isActive ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-800 leading-tight">
                              {hotel.hotel_name}
                            </h3>
                            {hotel.location && (
                              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-indigo-400" />
                                {hotel.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <StatusBadge active={hotel.is_active} />
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-3 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Departments
                          </span>
                          <span className="text-xs font-bold text-gray-500 bg-white rounded-full px-2 py-0.5 ring-1 ring-gray-200">
                            {depts.length}
                          </span>
                        </div>
                        {depts.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No departments assigned</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {depts.map((d) => (
                              <span
                                key={d.department_id}
                                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ring-1 ${
                                  d.is_active === 1
                                    ? "bg-white text-gray-700 ring-gray-200"
                                    : "bg-gray-100 text-gray-400 ring-gray-200 line-through"
                                }`}
                              >
                                {d.department_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                        {hasPermission(PERMISSIONS.HOTEL_EDIT) && (
                          <button
                            onClick={() => handleToggleHotel(hotel.hotel_id)}
                            title={isActive ? "Deactivate" : "Activate"}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                              isActive
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            <Power className="h-3.5 w-3.5" />
                            {isActive ? "Deactivate" : "Activate"}
                          </button>
                        )}

                        {hasPermission(PERMISSIONS.HOTEL_EDIT) && (
                          <button
                            onClick={() => openLinkModal(hotel)}
                            title="Manage Departments"
                            className="p-2 text-gray-400 hover:text-violet-600 rounded-2xl hover:bg-violet-50 transition"
                          >
                            <Layers className="h-4 w-4" />
                          </button>
                        )}

                        {hasPermission(PERMISSIONS.HOTEL_EDIT) && (
                          <button
                            onClick={() => openEditHotel(hotel)}
                            title="Edit"
                            className="p-2 text-gray-400 hover:text-indigo-600 rounded-2xl hover:bg-indigo-50 transition"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}

                        {hasPermission(PERMISSIONS.HOTEL_DELETE) && (
                          <button
                            onClick={() => handleDeleteHotel(hotel.hotel_id)}
                            title="Delete"
                            className="p-2 text-gray-400 hover:text-red-600 rounded-2xl hover:bg-red-50 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* DEPTS */}
      {activeTab === "DEPTS" && (
        <>
          {loadingDepts ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            </div>
          ) : filteredDepts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Layers className="h-7 w-7 text-slate-300" />
              </div>
              <p className="font-semibold text-gray-600">No departments found</p>
              <p className="text-sm mt-1">
                {filter !== "ALL"
                  ? `No ${filter.toLowerCase()} departments.`
                  : "Add your first department."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Linked Hotels
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDepts.map((dept) => {
                      const isActive = dept.is_active === 1;
                      return (
                        <tr
                          key={dept.department_id}
                          className={`transition-colors hover:bg-gray-50 ${
                            !isActive ? "opacity-60" : ""
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`p-1.5 rounded-xl ${
                                  isActive ? "bg-indigo-50 text-indigo-500" : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                <Layers className="h-3.5 w-3.5" />
                              </div>
                              <span
                                className={`text-sm font-semibold ${
                                  isActive ? "text-gray-800" : "text-gray-400 line-through"
                                }`}
                              >
                                {dept.department_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {hotelsForDept(dept.department_id).length === 0 ? (
                                <span className="text-xs text-gray-400 italic">No hotels</span>
                              ) : (
                                hotelsForDept(dept.department_id).map((h) => (
                                  <span key={h.hotel_id} className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full ring-1 ring-blue-100">
                                    <Building2 className="h-2.5 w-2.5" />
                                    {h.hotel_name}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge active={dept.is_active} />
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-mono text-gray-400">#{dept.department_id}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              {hasPermission(PERMISSIONS.DEPARTMENT_EDIT) && (
                                <button
                                  onClick={() => handleToggleDept(dept.department_id)}
                                  title={isActive ? "Deactivate" : "Activate"}
                                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                    isActive
                                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  }`}
                                >
                                  <Power className="h-3 w-3" />
                                  {isActive ? "Deactivate" : "Activate"}
                                </button>
                              )}
                              {hasPermission(PERMISSIONS.DEPARTMENT_EDIT) && (
                                <button
                                  onClick={() => openEditDept(dept)}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition"
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              {hasPermission(PERMISSIONS.DEPARTMENT_DELETE) && (
                                <button
                                  onClick={() => handleDeleteDept(dept.department_id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* HOTEL MODAL */}
      {isHotelModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="text-base font-bold text-gray-800">
                  {editingHotel.hotel_id ? "Edit Hotel" : "Create Hotel"}
                </h3>
              </div>
              <button
                onClick={() => setIsHotelModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHotel} className="p-6 space-y-4">
   {hotelError && (
  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-3 py-2.5">
    <span className="mt-0.5">⚠️</span>
    <div>
      <div className="font-semibold">تعذر الحفظ</div>
      <div className="text-red-700/90">{hotelError}</div>
    </div>
  </div>
)}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Hotel Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={editingHotel.hotel_name ?? ""}
                  onChange={(e) => setEditingHotel({ ...editingHotel, hotel_name: e.target.value })}
                  placeholder="e.g. Grand Plaza"
                  className="w-full border border-gray-200 rounded-2xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Location</label>
                <input
                  value={editingHotel.location ?? ""}
                  onChange={(e) => setEditingHotel({ ...editingHotel, location: e.target.value })}
                  placeholder="e.g. New York"
                  className="w-full border border-gray-200 rounded-2xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHotelModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={hotelSaving}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600
                   text-white text-sm font-semibold hover:bg-indigo-500 shawdow-sm
                   disabled:opacity-60 transition"
                >
                  {hotelSaving ? "Saving..." : "Save Hotel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPT MODAL */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <Layers className="h-4 w-4 text-indigo-600" />
                </div>
                <h3 className="text-base font-bold text-gray-800">
                  {editingDept.department_id ? "Edit Department" : "Create Department"}
                </h3>
              </div>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="p-6 space-y-4">
         {deptError && (
  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
    <span className="mt-0.5">⚠️</span>
    <div>
      <div className="font-semibold">لا يمكن حفظ القسم</div>
      <div>{deptError}</div>
    </div>
  </div>
)}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={editingDept.department_name ?? ""}
                  onChange={(e) => setEditingDept({ ...editingDept, department_name: e.target.value })}
                  placeholder="e.g. Front Desk"
                  className="w-full border border-gray-200 rounded-2xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deptSaving}
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  {deptSaving ? "Saving..." : "Save Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LINK MODAL — Manage Hotel Departments */}
      {isLinkModalOpen && linkingHotel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Layers className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">Manage Departments</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{linkingHotel.hotel_name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Top actions */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
              <span className="text-xs text-gray-500">
                {selectedDeptIds.size} / {departments.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDeptIds(new Set(departments.map((d) => d.department_id)))}
                  className="text-xs px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDeptIds(new Set())}
                  className="text-xs px-2.5 py-1 rounded-xl bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Department list */}
            <div className="overflow-y-auto flex-1 px-4 py-3">
              {departments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No departments exist yet. Create departments first.
                </p>
              ) : (
                <div className="space-y-1">
                  {departments.map((d) => {
                    const checked = selectedDeptIds.has(d.department_id);
                    return (
                      <label
                        key={d.department_id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                          checked ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedDeptIds((prev) => {
                              const next = new Set(prev);
                              checked ? next.delete(d.department_id) : next.add(d.department_id);
                              return next;
                            });
                          }}
                          className="w-4 h-4 rounded accent-indigo-600"
                        />
                        <span className={`text-sm font-semibold ${
                          d.is_active === 1 ? "text-gray-800" : "text-gray-400 line-through"
                        }`}>
                          {d.department_name}
                        </span>
                        {d.is_active === 0 && (
                          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Inactive</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLinks}
                disabled={linkSaving}
                className="px-5 py-2.5 rounded-2xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-60 transition"
              >
                {linkSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;
