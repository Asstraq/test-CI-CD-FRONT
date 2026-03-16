type ProfileLinkInput = {
  id?: string | null;
  name?: string | null;
  handle?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

export function buildProfileHref(profile: ProfileLinkInput): string | null {
  const id = profile.id?.trim();
  if (!id || id === 'unknown-author' || id === 'unknown-user') return null;

  const params = new URLSearchParams();
  if (profile.name?.trim()) params.set('name', profile.name.trim());
  if (profile.handle?.trim()) params.set('handle', profile.handle.trim());
  if (profile.email?.trim()) params.set('email', profile.email.trim());
  if (profile.avatarUrl?.trim())
    params.set('avatarUrl', profile.avatarUrl.trim());

  const query = params.toString();
  return query ? `/profile/${id}?${query}` : `/profile/${id}`;
}
