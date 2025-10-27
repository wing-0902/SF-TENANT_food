<script lang="ts">
  import { ref, onValue, type DatabaseReference, off } from "firebase/database";
  // データベース初期化ファイルは親コンポーネントと同じパスにあると仮定
  import { database } from "../../utils/initializeFirebase.mts"; 
  import { onMount, onDestroy } from 'svelte';

  // --- プロパティの定義 ---
  /** 親コンポーネントから渡される製品ID */
  export let productId: string;

  // --- 型定義 (親コンポーネントからコピー) ---
  interface Product {
    teamId: string;
    name: string;
    price: number;
    photoUrl: string;
    order: number;
    soldOut: boolean;
  }

  // --- 変数定義 ---
  let product: Product | null = null;
  let isLoading: boolean = true;
  let error: string | null = null;
  let productRef: DatabaseReference | null = null;
  let unsubscribe: (() => void) | undefined;

  /**
   * Firebase Realtime Database から特定の製品を購読する関数
   * @param id 取得したい製品のID (product key)
   */
  function subscribeToProduct(id: string) {
    // 既存の購読を解除
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = undefined;
    }
    
    // エラーとデータをリセット
    product = null;
    error = null;
    isLoading = true;

    if (!id) {
      error = "製品IDが指定されていません。";
      isLoading = false;
      return;
    }

    // 特定の製品ノードへの参照を取得: `products/{productId}`
    productRef = ref(database, `products/${id}`);

    // リアルタイムデータの購読を開始
    unsubscribe = onValue(
      productRef, 
      (snapshot) => {
        isLoading = false;
        if (snapshot.exists()) {
          // データが存在する場合
          product = snapshot.val() as Product;
          error = null;
        } else {
          // データが存在しない場合 (製品が削除されたなど)
          product = null;
          error = `製品ID: ${id} の詳細が見つかりません。`;
        }
      },
      (dbError) => {
        // 購読中のエラー処理
        isLoading = false;
        error = `データの取得中にエラーが発生しました: ${dbError.message}`;
        console.error("Firebase Error:", dbError);
      }
    );
  }

  // --- ライフサイクルメソッド ---
  onMount(() => {
    // コンポーネントがマウントされたら購読開始
    subscribeToProduct(productId);
  });

  onDestroy(() => {
    // コンポーネントが破棄されたら購読を解除してメモリリークを防ぐ
    if (unsubscribe) {
      unsubscribe();
    }
  });

  // productId が変更された場合に再度購読し直すリアクティブ宣言
  $: {
    // Svelteのリアクティブ機能で、productIdが変わったら自動で再実行
    if (productId) {
      subscribeToProduct(productId);
    }
  }
</script>

<div class="product-detail-card">
  {#if isLoading}
    <p>データを読み込み中...</p>
  {:else if error}
    <p class="error-message">エラー: {error}</p>
  {:else if product}
    <h2>{product.name} の詳細</h2>
    <div class="detail-content">
      <p><strong>企画名:</strong> {product.teamId}</p>
      <p><strong>価格:</strong> ¥{product.price.toLocaleString()}</p>
      <p><strong>在庫数:</strong> {product.order} 個</p>
      <p><strong>ステータス:</strong> {product.soldOut ? '売り切れ' : '在庫あり'}</p>
      <small>製品ID: {productId}</small>
    </div>
  {:else}
    <p>製品データが見つかりませんでした。</p>
  {/if}
</div>

<style lang='scss'>

</style>