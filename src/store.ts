import create from 'zustand'

type Profile = { conditions: string[]; allergies: string[]; custom: string[] }

type State = {
  profile: Profile
  setProfile: (p: Profile) => void
}

const useStore = create<State>((set) => ({
  profile: { conditions: [], allergies: [], custom: [] },
  setProfile: (p) => set({ profile: p })
}))

export default useStore
