const KEY = 'nutrinformation_profile'

export function saveProfile(profile: any) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile))
  } catch (e) {}
}

export function getProfile() {
  try {
    const v = localStorage.getItem(KEY)
    if (!v) return null
    return JSON.parse(v)
  } catch (e) {
    return null
  }
}
