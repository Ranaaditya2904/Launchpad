import { doc, getDoc, onSnapshot, setDoc, serverTimestamp, type Unsubscribe } from "firebase/firestore";
import { db } from "./firebase";
import type { TrackerState } from "./types";

export function subscribeToState(uid:string, onState:(state:TrackerState|null)=>void, onError:(error:Error)=>void):Unsubscribe {
  if(!db) throw new Error("Firebase is not configured.");
  const ref=doc(db,"users",uid,"app","state");
  return onSnapshot(ref, snap => {
    if(!snap.exists()) onState(null);
    else onState(snap.data().payload as TrackerState);
  }, error => onError(error));
}
export async function saveCloudState(uid:string,state:TrackerState) {
  if(!db) throw new Error("Firebase is not configured.");
  await setDoc(doc(db,"users",uid,"app","state"),{payload:state,updatedAt:serverTimestamp()},{merge:true});
}
export async function loadCloudState(uid:string):Promise<TrackerState|null>{
  if(!db) throw new Error("Firebase is not configured.");
  const snap=await getDoc(doc(db,"users",uid,"app","state"));
  return snap.exists() ? snap.data().payload as TrackerState : null;
}