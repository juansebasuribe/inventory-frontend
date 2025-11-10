// src/pages/AdminUsersPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  RefreshCcw,
  Users,
  Shield,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  ArrowLeft,
  Home,
} from 'lucide-react';

import { userService } from '../shared/services/userService';
import type { User, UserRole } from '../shared/types/entities';
import { usePermissions } from '../shared/stores/authStore';
import { UserCreateModal } from '../features/auth/components/UserCreateModal';

type StatusFilter = 'all' | 'active' | 'inactive';

const ROLE_META: Record<UserRole, { label: string; badge: string; dot: string }> = {
  manager: { label: 'Gerente', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  supervisor: { label: 'Supervisor', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  editor: { label: 'Editor', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  operator: { label: 'Operario', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  seller_executive: { label: 'Seller Ejecutivo', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  seller_tt: { label: 'Seller TaT', badge: 'bg-lime-100 text-lime-700', dot: 'bg-lime-500' },
  seller: { label: 'Seller', badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' },
};
const ROLE_VALUES = Object.keys(ROLE_META) as UserRole[];

interface EditState {
  open: boolean;
  user: User | null;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: UserRole;
}

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [showCreate, setShowCreate] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    open: false,
    user: null,
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'seller',
  });

  const permissions = usePermissions();
  const canView = permissions.canAccess('users.view');
  const canCreate = permissions.canAccess('users.create');
  const canEdit = permissions.canAccess('users.edit');
  const canDelete = permissions.canAccess('users.delete');

  const resolveRole = (user: User): { value: string; label: string } => {
    const rawRole = (user.profile?.role ?? (user as any).role) as string | undefined;
    if (rawRole) {
      const normalized = rawRole.toLowerCase() as UserRole;
      if (ROLE_VALUES.includes(normalized)) {
        const meta = ROLE_META[normalized];
        return { value: normalized, label: meta?.label ?? normalized };
      }
      return {
        value: rawRole,
        label: rawRole.replace('_', ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
      };
    }
    return { value: 'seller', label: ROLE_META['seller']?.label ?? 'Seller' };
  };

  const resolveActive = (user: User): boolean => {
    if (typeof user.is_active === 'boolean') return user.is_active;
    const fallback = (user as any).is_active ?? (user as any).status;
    if (typeof fallback === 'boolean') return fallback;
    if (fallback === 1 || fallback === '1') return true;
    if (fallback === 0 || fallback === '0') return false;
    return true;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) void fetchUsers();
  }, [canView]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const { value: roleValue } = resolveRole(user);
      const isActive = resolveActive(user);
      const matchesSearch =
        user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.username?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || roleValue === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const active = users.filter((u) => resolveActive(u)).length;
    const inactive = users.length - active;
    const perRole: Record<string, number> = {};
    users.forEach((user) => {
      const { value: roleKey } = resolveRole(user);
      perRole[roleKey] = (perRole[roleKey] ?? 0) + 1;
    });
    return { active, inactive, perRole };
  }, [users]);

  const openEdit = (user: User) => {
    setEditState({
      open: true,
      user,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      role: resolveRole(user).value as UserRole,
    });
  };

  const closeEdit = () => {
    setEditState({
      open: false,
      user: null,
      first_name: '',
      last_name: '',
      phone_number: '',
      role: 'seller',
    });
  };

  const handleUpdateUser = async () => {
    if (!editState.user || !canEdit) return;

    try {
      setLoading(true);
      await userService.updateUser(editState.user.id, {
        first_name: editState.first_name,
        last_name: editState.last_name,
        phone_number: editState.phone_number,
      });

      if (editState.user.profile?.role !== editState.role) {
        await userService.changeUserRoleByUserId(editState.user.id, editState.role);
      }

      await fetchUsers();
      closeEdit();
    } catch (err: any) {
      console.error('Error actualizando usuario:', err);
      setError(err.message || 'No fue posible actualizar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (!canDelete) return;
    if (!window.confirm(`¿Eliminar al usuario ${user.first_name}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await userService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      console.error('Error eliminando usuario:', err);
      setError(err.message || 'No se pudo eliminar el usuario');
    }
  };

  if (!canView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-lg">
          <Shield className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h1 className="text-2xl font-semibold text-gray-900">Sin permisos</h1>
          <p className="mt-2 text-gray-600">No tienes permisos para gestionar usuarios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="inline-flex items-center gap-1 transition-colors hover:text-gray-900"
                >
                  <Home className="h-4 w-4" />
                  Inicio
                </button>
                <span className="text-gray-300">/</span>
                <span className="font-medium text-gray-700">Gestión de Usuarios</span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-red-500">Gestión</p>
                <h1 className="text-3xl font-bold text-gray-900">Usuarios y Roles</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Administra roles, accesos y estados del equipo comercial desde un solo lugar.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
              <button
                type="button"
                onClick={fetchUsers}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo usuario
                </button>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Usuarios totales"
            icon={<Users className="h-5 w-5" />}
            value={users.length}
            subtitle="Equipo registrado"
            pill="General"
          />
          <StatCard
            title="Activos"
            icon={<UserCheck className="h-5 w-5" />}
            value={stats.active}
            subtitle="Con acceso vigente"
            pill="Operativos"
          />
          <StatCard
            title="Inactivos"
            icon={<UserX className="h-5 w-5" />}
            value={stats.inactive}
            subtitle="Sin acceso"
            pill="Revisión"
          />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="col-span-1 md:col-span-3">
              <label className="text-sm font-semibold text-gray-700">Buscar</label>
              <div className="mt-1 flex items-center rounded-xl border border-gray-200 px-3">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  className="w-full border-0 bg-transparent py-2 pl-2 text-sm text-gray-700 focus:outline-none"
                  placeholder="Nombre, email o usuario"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <FilterSelect
              label="Rol"
              icon={<Filter className="h-4 w-4 text-gray-400" />}
              value={roleFilter}
              onChange={(value) => setRoleFilter(value as UserRole | 'all')}
              options={[
                { label: 'Todos', value: 'all' },
                ...Object.entries(ROLE_META).map(([value, meta]) => ({
                  label: meta.label,
                  value,
                })),
              ]}
            />
            <FilterSelect
              label="Estado"
              icon={<Filter className="h-4 w-4 text-gray-400" />}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as StatusFilter)}
              options={[
                { label: 'Todos', value: 'all' },
                { label: 'Activos', value: 'active' },
                { label: 'Inactivos', value: 'inactive' },
              ]}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Usuario</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Rol</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Estado</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">Último acceso</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredUsers.map((user) => {
                  const { value: roleValue, label: roleLabel } = resolveRole(user);
                  const meta = ROLE_META[roleValue as UserRole];
                  const isActive = resolveActive(user);
                  return (
                    <tr key={user.id}>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            meta?.badge ?? 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${meta?.dot ?? 'bg-gray-400'}`} />
                          {meta?.label ?? roleLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.updatedAt ?? user.createdAt ?? Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                           <button
                             onClick={() => openEdit(user)}
                             disabled={!canEdit}
                             className={`rounded-full border border-gray-200 p-2 text-gray-500 transition ${
                               canEdit ? 'hover:border-gray-300 hover:text-gray-700' : 'cursor-not-allowed opacity-40'
                             }`}
                             title={canEdit ? 'Editar usuario' : 'Sin permisos para editar'}
                           >
                             <Edit2 className="h-4 w-4" />
                           </button>
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={!canDelete || user.profile?.role === 'manager'}
                            className={`rounded-full border border-gray-200 p-2 text-gray-500 transition ${
                              !canDelete || user.profile?.role === 'manager'
                                ? 'cursor-not-allowed opacity-40'
                                : 'hover:border-rose-200 hover:text-rose-600'
                            }`}
                            title={
                              !canDelete
                                ? 'Sin permisos para eliminar'
                                : user.profile?.role === 'manager'
                                ? 'Los gerentes no pueden eliminarse'
                                : 'Eliminar usuario'
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                      {loading ? 'Cargando usuarios...' : 'No se encontraron usuarios con los filtros aplicados.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {canCreate && (
        <UserCreateModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={fetchUsers}
        />
      )}

      {editState.open && editState.user && (
        <EditDrawer
          state={editState}
          onClose={closeEdit}
          onSubmit={handleUpdateUser}
          setState={setEditState}
          saving={loading}
        />
      )}

      {error && (
        <div className="fixed bottom-6 right-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-lg">
          {error}
          <button className="ml-3 text-xs underline" onClick={() => setError(null)}>
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
};

interface StatCardProps {
  title: string;
  subtitle: string;
  value: number;
  icon: React.ReactNode;
  pill: string;
}

const StatCard = ({ title, subtitle, value, icon, pill }: StatCardProps) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{pill}</span>
      <div className="rounded-full bg-gray-100 p-2 text-gray-500">{icon}</div>
    </div>
    <p className="mt-4 text-3xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500">{subtitle}</p>
    <p className="mt-1 text-sm font-semibold text-gray-800">{title}</p>
  </div>
);

interface FilterSelectProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

const FilterSelect = ({ label, icon, value, onChange, options }: FilterSelectProps) => (
  <div>
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    <div className="mt-1 flex items-center rounded-xl border border-gray-200 bg-white px-3">
      {icon}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-0 bg-transparent py-2 pl-2 pr-1 text-sm text-gray-700 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

interface EditDrawerProps {
  state: EditState;
  setState: React.Dispatch<React.SetStateAction<EditState>>;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
}

const EditDrawer = ({ state, setState, onClose, onSubmit, saving }: EditDrawerProps) => {
  if (!state.user) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
      <div className="h-full w-full max-w-md bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400">Editar usuario</p>
            <h2 className="text-xl font-semibold text-gray-900">
              {state.user.first_name} {state.user.last_name}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 transition hover:text-gray-600">
            &times;
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100"
              value={state.first_name}
              onChange={(e) =>
                setState((prev) => ({ ...prev, first_name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Apellido</label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100"
              value={state.last_name}
              onChange={(e) =>
                setState((prev) => ({ ...prev, last_name: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Teléfono</label>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100"
              value={state.phone_number}
              maxLength={10}
              onChange={(e) =>
                setState((prev) => ({ ...prev, phone_number: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Rol</label>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-red-400 focus:ring-2 focus:ring-red-100"
              value={state.role}
              onChange={(e) =>
                setState((prev) => ({ ...prev, role: e.target.value as UserRole }))
              }
            >
              {Object.entries(ROLE_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;



