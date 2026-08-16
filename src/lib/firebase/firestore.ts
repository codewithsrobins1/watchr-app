import { collection, doc, getDoc, getDocs, query, where, writeBatch } from 'firebase/firestore'
import { db } from './client'

export function nowIso() {
  return new Date().toISOString()
}

// Fetches multiple docs by id from a collection, returning a map of id -> data.
// Missing docs are simply omitted from the result.
export async function getDocsByIds<T>(
  collectionName: string,
  ids: string[]
): Promise<Record<string, T>> {
  const unique = Array.from(new Set(ids))
  const snaps = await Promise.all(unique.map((id) => getDoc(doc(db, collectionName, id))))

  const result: Record<string, T> = {}
  snaps.forEach((snap) => {
    if (snap.exists()) result[snap.id] = { ...snap.data(), id: snap.id } as T
  })
  return result
}

// Deletes every doc in a collection matching field == value. Used for cascade
// cleanup (e.g. removing a board's cards/members/invitations) since Firestore
// has no ON DELETE CASCADE.
export async function deleteWhere(collectionName: string, field: string, value: string) {
  const snap = await getDocs(query(collection(db, collectionName), where(field, '==', value)))
  if (snap.empty) return
  const batch = writeBatch(db)
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}
