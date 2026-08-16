import { arrayRemove, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from './client'
import { deleteWhere } from './firestore'

export async function deleteBoardCascade(boardId: string) {
  await deleteWhere('cards', 'board_id', boardId)
  await deleteWhere('boardMembers', 'board_id', boardId)
  await deleteWhere('boardInvitations', 'board_id', boardId)
  await deleteDoc(doc(db, 'boards', boardId))
}

export async function leaveBoard(boardId: string, userId: string) {
  const memberSnap = await getDocs(
    query(collection(db, 'boardMembers'), where('board_id', '==', boardId), where('user_id', '==', userId))
  )
  await Promise.all(memberSnap.docs.map((d) => deleteDoc(d.ref)))
  await updateDoc(doc(db, 'boards', boardId), { member_ids: arrayRemove(userId) })
}

export async function deleteCommunityCascade(communityId: string) {
  await deleteWhere('communityMembers', 'community_id', communityId)
  await deleteWhere('communityInvitations', 'community_id', communityId)
  await deleteDoc(doc(db, 'communities', communityId))
}

export async function leaveCommunity(communityId: string, userId: string) {
  const memberSnap = await getDocs(
    query(collection(db, 'communityMembers'), where('community_id', '==', communityId), where('user_id', '==', userId))
  )
  await Promise.all(memberSnap.docs.map((d) => deleteDoc(d.ref)))
  await updateDoc(doc(db, 'communities', communityId), { member_ids: arrayRemove(userId) })
}
