import { LogoutButton } from '@/features/auth/components/logout-button/LogoutButton';

export default function UsersPage() {
  return (
    <>
      <h1>Users</h1>
      {/* TODO: temporary, until the sidebar profile menu has Logout. */}
      <LogoutButton />
    </>
  );
}
