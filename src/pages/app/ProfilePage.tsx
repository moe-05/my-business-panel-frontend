import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../api/authService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import type { ILoginHistory } from "../../api/authService";

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordFormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function ProfilePage() {
  const { user: currentUser, logout } = useAuth();

  // Password change state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState<PasswordFormState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordFormErrors>({});
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Login history state
  const [loginHistory, setLoginHistory] = useState<ILoginHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load login history on mount
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const history = await authService.getLoginHistory();
        setLoginHistory(history);
      } catch (error) {
        console.error("Error loading login history:", error);
        // Don't fail silently - this might not be available
        setLoginHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, []);

  // Validate password form
  const validatePasswordForm = (): boolean => {
    const errors: PasswordFormErrors = {};

    if (!passwordFormData.currentPassword) {
      errors.currentPassword = "Contraseña actual es requerida";
    }

    if (!passwordFormData.newPassword) {
      errors.newPassword = "Nueva contraseña es requerida";
    } else if (passwordFormData.newPassword.length < 6) {
      errors.newPassword = "Contraseña debe tener al menos 6 caracteres";
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (passwordFormData.currentPassword === passwordFormData.newPassword) {
      errors.newPassword = "La nueva contraseña debe ser diferente a la actual";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle password change submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsSubmittingPassword(true);
    setPasswordSuccess(false);
    try {
      await authService.changePassword({
        currentPassword: passwordFormData.currentPassword,
        newPassword: passwordFormData.newPassword,
        confirmPassword: passwordFormData.confirmPassword,
      });

      setPasswordSuccess(true);
      setPasswordFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});

      // Close modal after 2 seconds
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordErrors({
        currentPassword:
          error instanceof Error ? error.message : "Error changing password",
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await logout();
  };

  if (!currentUser) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <h2 className="text-lg font-bold text-red-900 mb-2">Error</h2>
          <p className="text-red-700">
            No se pudo cargar la información del usuario.
          </p>
        </div>
      </div>
    );
  }

  const createdAt = currentUser.tenant.created_at
    ? new Date(currentUser.tenant.created_at).toLocaleDateString("es-CR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
        <p className="text-gray-600">
          Gestiona tu información personal y seguridad
        </p>
      </div>

      {/* Personal Info Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-2xl">
              {currentUser.email.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {currentUser.email}
            </h2>
            <div className="flex flex-wrap gap-3 mt-3">
              <Badge variant="accent">{currentUser.role.role_name}</Badge>
              {currentUser.tenant.is_subscribed && (
                <Badge variant="success">Suscripción Activa</Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:w-auto">
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setPasswordFormData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setPasswordErrors({});
                setPasswordSuccess(false);
                setIsPasswordModalOpen(true);
              }}
            >
              Cambiar Contraseña
            </Button>
            <Button variant="danger" size="md" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - User Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Email Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Información de Cuenta
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-900 break-all">
                  {currentUser.email}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Rol
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {currentUser.role.role_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Jerarquía
                </p>
                <p className="text-sm font-medium text-gray-900">
                  Nivel {currentUser.role.role_hierarchy}
                </p>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Seguridad</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start gap-3">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0 mt-0.5"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <p>Tu contraseña está protegida y encriptada</p>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="shrink-0 mt-0.5"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <p>
                  Cambia tu contraseña regularmente para mantener tu cuenta
                  segura
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tenant & Login History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tenant Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Información del Tenant
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Nombre del Tenant
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {currentUser.tenant.tenant_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Email de Contacto
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {currentUser.tenant.contact_email}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Estado de Suscripción
                </p>
                <Badge
                  variant={
                    currentUser.tenant.is_subscribed ? "success" : "secondary"
                  }
                >
                  {currentUser.tenant.is_subscribed ? "Activa" : "Inactiva"}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Miembro Desde
                </p>
                <p className="text-sm font-medium text-gray-900">{createdAt}</p>
              </div>
            </div>
          </div>

          {/* Login History */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Historial de Sesiones
            </h3>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-3 border-accent-200 border-t-accent-500 rounded-full animate-spin" />
              </div>
            ) : loginHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                No hay historial de sesiones disponible
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {loginHistory.map((session) => (
                  <div
                    key={session.login_id}
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(session.login_time).toLocaleString("es-CR")}
                        </p>
                        {session.device_type && (
                          <p className="text-xs text-gray-500 mt-1">
                            Dispositivo: {session.device_type}
                          </p>
                        )}
                        {session.ip_address && (
                          <p className="text-xs text-gray-500">
                            IP: {session.ip_address}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={session.logout_time ? "secondary" : "success"}
                      >
                        {session.logout_time ? "Cerrada" : "Activa"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          if (!isSubmittingPassword) {
            setIsPasswordModalOpen(false);
            setPasswordFormData({
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
            setPasswordErrors({});
            setPasswordSuccess(false);
          }
        }}
        title="Cambiar Contraseña"
        size="sm"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {passwordSuccess ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-green-600"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-green-900 text-center">
                ¡Contraseña actualizada!
              </p>
              <p className="text-sm text-green-700 text-center mt-2">
                Tu contraseña ha sido cambiada exitosamente.
              </p>
            </div>
          ) : (
            <>
              <Input
                label="Contraseña Actual"
                type="password"
                placeholder="Ingresa tu contraseña actual"
                value={passwordFormData.currentPassword}
                onChange={(e) =>
                  setPasswordFormData((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                error={passwordErrors.currentPassword}
                required
              />

              <Input
                label="Nueva Contraseña"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={passwordFormData.newPassword}
                onChange={(e) =>
                  setPasswordFormData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                error={passwordErrors.newPassword}
                required
              />

              <Input
                label="Confirmar Contraseña"
                type="password"
                placeholder="Repite la nueva contraseña"
                value={passwordFormData.confirmPassword}
                onChange={(e) =>
                  setPasswordFormData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
                error={passwordErrors.confirmPassword}
                required
              />

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setPasswordFormData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPasswordErrors({});
                  }}
                  disabled={isSubmittingPassword}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={isSubmittingPassword}
                >
                  Cambiar Contraseña
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}
