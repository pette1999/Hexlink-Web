import { defineStore } from 'pinia'
import type {  User } from 'firebase/auth'

export interface IUser {
  emailVerified: boolean,
  email: string | null
  photoURL: string | null
  uid: string
  displayName: string | null
}

export interface IAuth {
  currentUser: IUser | null,
  idToken: string | null,
  returnUrl: string | null;
}

export const useAuthStore = defineStore({
  id: 'auth',
  state: (): IAuth => ({
    idToken: null as string | null,
    currentUser: null as IUser | null,
    returnUrl: null as string | null,
  }),
  persist: true,
  getters: {
    authenticated: (state) => state.currentUser !== null && state.idToken != null,
  },
  actions: {
    signIn(user: User, idToken: string) {
      console.log("User logged in");
      this.idToken = idToken;
      this.currentUser = {
        emailVerified: user.emailVerified,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid,
        displayName: user.displayName
      }
    },
    signOut() {
      console.log("User logged out");
      this.currentUser =  null;
      this.idToken = null;
    },
    setReturnUrl(returnUrl: string) {
      this.returnUrl = returnUrl;
    },
  },
})