export const firestoreCollections = {
  users: "/users/{uid}",
  hubs: "/hubs/{hubId}",
  invites: "/hubs/{hubId}/invites/{inviteId}",
  membershipPlans: "/hubs/{hubId}/membershipPlans/{planId}",
  memberships: "/hubs/{hubId}/memberships/{membershipId}",
  events: "/hubs/{hubId}/events/{eventId}",
  registrations: "/hubs/{hubId}/events/{eventId}/registrations/{registrationId}",
  pages: "/hubs/{hubId}/pages/{pageId}",
  mediaFolders: "/hubs/{hubId}/mediaFolders/{folderId}",
  media: "/hubs/{hubId}/media/{mediaId}",
  avatarMedia: "/hubs/{hubId}/users/{uid}/avatarMedia/{mediaId}",
};
