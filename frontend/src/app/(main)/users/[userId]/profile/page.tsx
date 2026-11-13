import { UserProfile } from '@/features/users/components/user-profile/UserProfile';

interface UserProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { userId } = await params;

  return <UserProfile userId={userId} />;
}
