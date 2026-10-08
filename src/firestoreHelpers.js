import { getDocs, getDocsFromCache } from "firebase/firestore";

export async function getDocsCacheFirst(q, onData) {
  try {
    const cached = await getDocsFromCache(q);
    if (!cached.empty) onData(cached);
  } catch {
    // キャッシュが使えない場合はサーバーの結果だけを使う
  }
  const fresh = await getDocs(q);
  onData(fresh);
}
