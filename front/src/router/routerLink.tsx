import { allRoutes } from "./allRoutes";
import Login from "../components/auth/login";
import MainLayout from "../layouts/MainLayout";
import Forbidden from "../components/pages/Forbidden";
import RoleManagement from "../components/admin/roles/RoleManagement";
import RolePermissionsPage from "../components/admin/roles/RolePermissionsPage";
import UserManagement from "../components/admin/users/UserManagement";
import ContactManagement from "../components/contacts/ContactManagement";
import OrganizationManagement from "../components/organization/OrganizationManagement";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import type { RouteObject } from "react-router-dom";
import Audit from "../components/admin/audit/audit";
import PermissionManagement from "../components/admin/permissions/PermissionManagement";
import UserRolesPage from "../components/admin/users/UserRolesPage";
import UserScopePage from "../components/admin/users/UserScopePage";
import { Navigate } from "react-router-dom";

export const authRoute: RouteObject[] = [
  // Public routes
  {
    path: allRoutes.login,
    element: <Login />,
  },
  {
    path: allRoutes.forbidden,
    element: <Forbidden />,
  },

  // Dashboard layout — sidebar always rendered here
  {
    path: allRoutes.dashboard,
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      // Default index: redirect to contacts
      {
        index: true,
        element: <Navigate to={allRoutes.contacts} replace />,
      },
      {
        path: "contacts",
        element: (
          <ProtectedRoute requiredPermission="CONTACT_VIEW">
            <ContactManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <ProtectedRoute requiredPermission="USER_VIEW">
            <UserManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "roles",
        element: (
          <ProtectedRoute requiredPermission="ROLE_MANAGE">
            <RoleManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "roles/:id/permissions",
        element: (
          <ProtectedRoute requiredPermission="ROLE_MANAGE">
            <RolePermissionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "permissions",
        element: (
          <ProtectedRoute requiredPermission="ROLE_MANAGE">
            <PermissionManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "users/:userId/roles",
        element: (
          <ProtectedRoute requiredPermission="ROLE_MANAGE">
            <UserRolesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "users/:userId/scope",
        element: (
          <ProtectedRoute requiredPermission="USER_EDIT">
            <UserScopePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "organization",
        element: (
          <ProtectedRoute requiredPermission={["HOTEL_VIEW", "DEPARTMENT_VIEW"]}>
            <OrganizationManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "logs",
        element: (
          <ProtectedRoute requiredPermission="LOG_VIEW">
            <Audit />
          </ProtectedRoute>
        ),
      },
      {
        path: "forbidden",
        element: <Forbidden />,
      },
    ],
  },

  // Root redirect
  {
    path: "/",
    element: <Navigate to={allRoutes.dashboard} replace />,
  },
];