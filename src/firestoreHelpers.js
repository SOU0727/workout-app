import { getDocs, getDocsFromCache } from "firebase/firestore";

// キャッシュを先に表示し、続けてサーバーの最新も取得する(変わりうるデータ向け)
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

// キャッシュにあればそれだけを使い、無いときだけサーバーへ取りに行く
// (プリセット種目や過去の日の並び順など、ほぼ変わらないデータ向け)
export async function getDocsPreferCache(q, onData) {
  try {
    const cached = await getDocsFromCache(q);
    if (!cached.empty) {
      onData(cached);
      return;
    }
  } catch {
    // キャッシュが使えない場合はサーバーから取得する
  }
  onData(await getDocs(q));
}
