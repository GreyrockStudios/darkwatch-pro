import { useAppStore } from '../stores/useAppStore';

export default function LogoutPage() {
  const logout = useAppStore((s) => s.logout);

  // Clear auth state and redirect
  logout();
  return null;
}