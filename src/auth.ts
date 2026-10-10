import {
  InMemoryWebStorage,
  UserManager,
  type UserManagerSettings,
  WebStorageStateStore,
} from 'oidc-client-ts'
import { apiEnabled } from './common'

function createUserManager(): UserManager {
  const theAuthority = import.meta.env.VITE_OIDC_AUTHORITY
  if (!theAuthority) {
    throw new Error('VITE_OIDC_AUTHORITY is not set')
  }
  const oidcConfig: UserManagerSettings = {
    authority: theAuthority,
    client_id: 'counters-web',
    redirect_uri: window.location.origin + import.meta.env.BASE_URL,
    post_logout_redirect_uri: window.location.origin + import.meta.env.BASE_URL,
    scope: 'openid',
    userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }),
  }

  return new UserManager(oidcConfig)
}

// The one UserManager: AuthProvider and countersApi.ts share it. Undefined when the
// app runs on localStorage, so the Pages build drops createUserManager entirely.
export const userManager = apiEnabled ? createUserManager() : undefined
