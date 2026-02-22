import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { apiClient, useAuthStore } from '../../stores/authStore';
import { PERMISSIONS } from '../../utils/permissions';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Contact {
  contact_id: number;
  full_name: string;
  job_title: string;
  phone: string;
  email: string;
  notes?: string;
  hotel_id: number;
  department_id: number;
  hotel_name?: string;
  department_name?: string;
  is_active: number;
  created_at: string;
}

interface Hotel           { hotel_id: number; hotel_name: string; }
interface Department      { department_id: number; department_name: string; }
interface HotelDeptLink   { hotel_id: number; department_id: number; }

interface ContactForm {
  full_name: string; job_title: string; phone: string; email: string;
  notes: string; hotel_id: string; department_id: string;
}

const EMPTY_FORM: ContactForm = {
  full_name: '', job_title: '', phone: '', email: '', notes: '', hotel_id: '', department_id: '',
};

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  title: string;
  form: ContactForm;
  hotels: Hotel[];
  rawDepts: Department[];
  hotelDeptLinks: HotelDeptLink[];
  saving: boolean;
  onChange: (field: keyof ContactForm, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const ContactModal: React.FC<ModalProps> = ({
  title, form, hotels, rawDepts, hotelDeptLinks, saving, onChange, onSubmit, onClose,
}) => {
  // Build the dept IDs that belong to the selected hotel via the junction table
  const filteredDepts = useMemo(() => {
    if (!form.hotel_id) return [];
    const hotelId = Number(form.hotel_id);
    const deptIds = new Set(
      hotelDeptLinks.filter((l) => l.hotel_id === hotelId).map((l) => l.department_id)
    );
    return rawDepts.filter((d) => deptIds.has(d.department_id));
  }, [form.hotel_id, rawDepts, hotelDeptLinks]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 w-full max-w-lg mx-auto" dir="rtl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none p-1 rounded-lg hover:bg-slate-100 transition">&times;</button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">الاسم الكامل <span className="text-red-500">*</span></label>
              <input value={form.full_name} onChange={(e) => onChange('full_name', e.target.value)}
                placeholder="أدخل الاسم الكامل"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">المسمى الوظيفي <span className="text-red-500">*</span></label>
              <input value={form.job_title} onChange={(e) => onChange('job_title', e.target.value)}
                placeholder="مثال: مدير"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">رقم الهاتف <span className="text-red-500">*</span></label>
              <input value={form.phone} onChange={(e) => onChange('phone', e.target.value)}
                placeholder="+966..." type="tel" dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">البريد الإلكتروني <span className="text-red-500">*</span></label>
              <input value={form.email} onChange={(e) => onChange('email', e.target.value)}
                placeholder="example@domain.com" type="email" dir="ltr"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">الفندق <span className="text-red-500">*</span></label>
              <select value={form.hotel_id} onChange={(e) => { onChange('hotel_id', e.target.value); onChange('department_id', ''); }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">-- اختر الفندق --</option>
                {hotels.map((h) => <option key={h.hotel_id} value={h.hotel_id}>{h.hotel_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">القسم <span className="text-red-500">*</span></label>
              <select value={form.department_id} onChange={(e) => onChange('department_id', e.target.value)}
                disabled={!form.hotel_id}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400">
                <option value="">-- اختر القسم --</option>
                {filteredDepts.map((d) => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1">ملاحظات</label>
              <textarea value={form.notes} onChange={(e) => onChange('notes', e.target.value)}
                rows={2} placeholder="ملاحظات إضافية اختيارية..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold text-white transition shadow-sm ${saving ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'}`}>
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ContactManagement: React.FC = () => {
  const { hasPermission } = useAuthStore();

  const [contacts,       setContacts]       = useState<Contact[]>([]);
  const [hotels,         setHotels]         = useState<Hotel[]>([]);
  const [rawDepts,       setRawDepts]       = useState<Department[]>([]);
  const [hotelDeptLinks, setHotelDeptLinks] = useState<HotelDeptLink[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [filterHotel, setFilterHotel] = useState('ALL');

  const [modalMode,   setModalMode]   = useState<'create' | 'edit' | null>(null);
  const [editTarget,  setEditTarget]  = useState<Contact | null>(null);
  const [form,        setForm]        = useState<ContactForm>(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [deletingId,  setDeletingId]  = useState<number | null>(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, hRes, dRes, linksRes] = await Promise.all([
        apiClient.get('/contacts'),
        apiClient.get('/hotels'),
        apiClient.get('/departments'),
        apiClient.get('/hotels/all-links'),
      ]);
      const contacts   = cRes.data?.data ?? [];
      const hotels     = hRes.data?.data ?? [];
      const rawDepts   = dRes.data?.data ?? [];
      const links      = linksRes.data?.data ?? [];

      console.log('[ContactManagement] /hotels returned:', hotels.map((h: Hotel) => `${h.hotel_id}:${h.hotel_name}`));
      console.log('[ContactManagement] /departments returned:', rawDepts.map((d: Department) => `${d.department_id}:${d.department_name}`));
      console.log('[ContactManagement] /hotels/all-links returned:', links.length, 'links', links);

      setContacts(contacts);
      setHotels(hotels);
      setRawDepts(rawDepts);
      setHotelDeptLinks(links);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      const matchHotel  = filterHotel === 'ALL' || String(c.hotel_id) === filterHotel;
      const matchSearch = !q ||
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.job_title?.toLowerCase().includes(q) ?? false) ||
        (c.hotel_name?.toLowerCase().includes(q) ?? false);
      return matchHotel && matchSearch;
    });
  }, [contacts, search, filterHotel]);

  const hotelOptions = useMemo(
    () => Array.from(new Map(contacts.map((c) => [c.hotel_id, c.hotel_name ?? String(c.hotel_id)]))),
    [contacts]
  );

  // ── Modal helpers ───────────────────────────────────────────────────────────
  const handleFormChange = (field: keyof ContactForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const openCreate = () => { setForm(EMPTY_FORM); setEditTarget(null); setModalMode('create'); };
  const openEdit   = (c: Contact) => {
    setForm({ full_name: c.full_name, job_title: c.job_title, phone: c.phone, email: c.email,
      notes: c.notes ?? '', hotel_id: String(c.hotel_id), department_id: String(c.department_id) });
    setEditTarget(c);
    setModalMode('edit');
  };
  const closeModal = () => { setModalMode(null); setEditTarget(null); };

  const validate = async () => {
    const { full_name, job_title, phone, email, hotel_id, department_id } = form;
    if (!full_name.trim() || !job_title.trim() || !phone.trim() || !email.trim() || !hotel_id || !department_id) {
      await Swal.fire({ icon: 'warning', title: 'بيانات ناقصة', text: 'يرجى ملء جميع الحقول المطلوبة' });
      return false;
    }
    return true;
  };

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validate())) return;
    setSaving(true);
    try {
      await apiClient.post('/contacts', {
        full_name: form.full_name.trim(), job_title: form.job_title.trim(),
        phone: form.phone.trim(), email: form.email.trim(), notes: form.notes.trim(),
        hotel_id: Number(form.hotel_id), department_id: Number(form.department_id),
      });
      closeModal();
      await Swal.fire({ icon: 'success', title: 'تم', text: 'تمت إضافة جهة الاتصال بنجاح', timer: 1200, showConfirmButton: false });
      loadAll();
    } catch (err: any) {
      await Swal.fire({ icon: 'error', title: 'خطأ', text: err?.response?.data?.message || 'فشل في الإضافة' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !(await validate())) return;
    setSaving(true);
    try {
      await apiClient.put(`/contacts/${editTarget.contact_id}`, {
        full_name: form.full_name.trim(), job_title: form.job_title.trim(),
        phone: form.phone.trim(), email: form.email.trim(), notes: form.notes.trim(),
        hotel_id: Number(form.hotel_id), department_id: Number(form.department_id),
      });
      closeModal();
      await Swal.fire({ icon: 'success', title: 'تم الحفظ', timer: 1100, showConfirmButton: false });
      loadAll();
    } catch (err: any) {
      await Swal.fire({ icon: 'error', title: 'خطأ', text: err?.response?.data?.message || 'فشل في التعديل' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Contact) => {
    const result = await Swal.fire({
      icon: 'warning', title: 'تأكيد الحذف',
      html: `هل تريد حذف جهة الاتصال <b>${c.full_name}</b>؟`,
      showCancelButton: true, confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء', reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    setDeletingId(c.contact_id);
    try {
      await apiClient.delete(`/contacts/${c.contact_id}`);
      await Swal.fire({ icon: 'success', title: 'تم الحذف', timer: 1200, showConfirmButton: false });
      loadAll();
    } catch (err: any) {
      await Swal.fire({ icon: 'error', title: 'خطأ', text: err?.response?.data?.message || 'فشل في الحذف' });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6 space-y-5 bg-slate-50 min-h-full" dir="rtl">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">إدارة جهات الاتصال</h1>
          <p className="text-sm text-slate-500 mt-0.5">عرض وإدارة جهات الاتصال ضمن نطاق صلاحياتك</p>
        </div>
        {hasPermission(PERMISSIONS.CONTACT_CREATE) && (
          <button onClick={openCreate}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm hover:shadow-md">
            + إضافة جهة اتصال
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: contacts.length,    label: 'إجمالي جهات الاتصال', color: 'text-indigo-600' },
          { value: hotelOptions.length, label: 'فندق',                color: 'text-slate-900' },
          { value: filtered.length,    label: 'نتائج البحث',          color: 'text-slate-900' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 text-center hover:shadow-md transition-shadow">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 12a7.5 7.5 0 0012.15 5.65z" />
            </svg>
          </span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد أو الهاتف أو الوظيفة..."
            className="w-full pr-9 pl-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <button onClick={() => setFilterHotel('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filterHotel === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            الكل
          </button>
          {hotelOptions.map(([id, name]) => (
            <button key={id} onClick={() => setFilterHotel(String(id))}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filterHotel === String(id) ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Data: Table (desktop) + Cards (mobile) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">لا توجد جهات اتصال مطابقة.</div>
        ) : (
          <>
            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">الاسم الكامل</th>
                    <th className="hidden lg:table-cell px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">المسمى الوظيفي</th>
                    <th className="hidden xl:table-cell px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">الهاتف</th>
                    <th className="hidden xl:table-cell px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">البريد الإلكتروني</th>
                    <th className="hidden 2xl:table-cell px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">الفندق</th>
                    <th className="hidden 2xl:table-cell px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">القسم</th>
                    <th className="hidden 2xl:table-cell px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">تاريخ الإضافة</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filtered.map((c) => (
                    <tr key={c.contact_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {c.full_name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900">{c.full_name}</span>
                            <span className="lg:hidden text-xs text-slate-500">{c.job_title}</span>
                          </div>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-5 py-3 whitespace-nowrap text-sm text-slate-600">{c.job_title || '—'}</td>
                      <td className="hidden xl:table-cell px-5 py-3 whitespace-nowrap">
                        <a href={`tel:${c.phone}`} dir="ltr" className="text-sm text-indigo-600 hover:text-indigo-800">{c.phone}</a>
                      </td>
                      <td className="hidden xl:table-cell px-5 py-3 whitespace-nowrap">
                        <a href={`mailto:${c.email}`} dir="ltr" className="text-sm text-indigo-600 hover:text-indigo-800 truncate block max-w-[180px]">{c.email}</a>
                      </td>
                      <td className="hidden 2xl:table-cell px-5 py-3 whitespace-nowrap text-sm text-slate-600">
                        {c.hotel_name ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="hidden 2xl:table-cell px-5 py-3 whitespace-nowrap text-sm text-slate-600">
                        {c.department_name ?? <span className="text-slate-300">—</span>}
                      </td>
                      <td className="hidden 2xl:table-cell px-5 py-3 whitespace-nowrap text-xs text-slate-400">
                        {new Date(c.created_at).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {hasPermission(PERMISSIONS.CONTACT_EDIT) && (
                            <button onClick={() => openEdit(c)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
                              تعديل
                            </button>
                          )}
                          {hasPermission(PERMISSIONS.CONTACT_DELETE) && (
                            <button onClick={() => handleDelete(c)}
                              disabled={deletingId === c.contact_id}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                                deletingId === c.contact_id
                                  ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-100'
                              }`}>
                              {deletingId === c.contact_id ? '...' : 'حذف'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((c) => (
                <div key={c.contact_id} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {c.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{c.full_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.job_title || '—'}</p>
                      <a href={`tel:${c.phone}`} dir="ltr" className="text-sm text-indigo-600 hover:text-indigo-800 mt-1 block">{c.phone}</a>
                      <a href={`mailto:${c.email}`} dir="ltr" className="text-sm text-indigo-600 hover:text-indigo-800 truncate block">{c.email}</a>
                      <p className="text-xs text-slate-400 mt-1">
                        {c.hotel_name ?? '—'} · {c.department_name ?? '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
                    {hasPermission(PERMISSIONS.CONTACT_EDIT) && (
                      <button onClick={() => openEdit(c)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
                        تعديل
                      </button>
                    )}
                    {hasPermission(PERMISSIONS.CONTACT_DELETE) && (
                      <button onClick={() => handleDelete(c)}
                        disabled={deletingId === c.contact_id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          deletingId === c.contact_id
                            ? 'bg-slate-50 text-slate-400 cursor-not-allowed'
                            : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-100'
                        }`}>
                        {deletingId === c.contact_id ? '...' : 'حذف'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modalMode && (
        <ContactModal
          title={modalMode === 'create' ? 'إضافة جهة اتصال جديدة' : 'تعديل جهة الاتصال'}
          form={form} hotels={hotels} rawDepts={rawDepts} hotelDeptLinks={hotelDeptLinks}
          saving={saving} onChange={handleFormChange}
          onSubmit={modalMode === 'create' ? handleCreate : handleEdit}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default ContactManagement;
