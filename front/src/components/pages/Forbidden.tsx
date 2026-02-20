import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import Swal from "sweetalert2";

export default function Forbidden() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "تسجيل الخروج؟",
      text: "سيتم إنهاء الجلسة الحالية",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "تسجيل الخروج",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 text-center border border-red-100">
        
        {/* Icon */}
        <div className="mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M5.455 19h13.09c1.054 0 1.716-1.14 1.197-2.05L13.197 4.95c-.527-.922-1.867-.922-2.394 0L4.258 16.95C3.739 17.86 4.401 19 5.455 19z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-red-600 mb-2">
          403 - غير مصرح
        </h2>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-6">
          ليس لديك صلاحية للوصول إلى هذه الصفحة.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
          >
            العودة للرئيسية
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}