// src/shared/components/auth/index.ts
export { 
  ProtectedRoute, 
  AuthenticatedRoute, 
  AdminRoute, 
  SupervisorRoute, 
  SalesRoute, 
  EditorRoute, 
  PriceEditorRoute,
  SellerRoute,
  SellerTaTRoute
} from './ProtectedRoute';
export { PublicRoute, AuthRoute, GuestRoute } from './PublicRoute';
export { UnauthorizedPage } from './UnauthorizedPage';
export { default as ProtectedRouteDefault } from './ProtectedRoute';
export { default as PublicRouteDefault } from './PublicRoute';
export { default as UnauthorizedPageDefault } from './UnauthorizedPage';