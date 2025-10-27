<script lang="ts">
  import { ref, onValue, set, push, remove, update, type DatabaseReference } from "firebase/database";
  import { database } from "../../utils/initializeFirebase.mts";
  import { onMount, onDestroy } from 'svelte';

  // --- 変数定義 ---
  let products: { [id: string]: Product } = {}; 
  let editingProductId: string | null = null;
  let editingProduct: Product | null = null;
  
  // 新規追加フォーム用のデータ (teamId も含める)
  let newProduct: NewProduct = { teamId: 'team01', name: '', price: 0, photoUrl: '', order: 0 };
  
  // 型定義 (TypeScript向け)
  interface Product {
    teamId: string; // チームIDを追加
    name: string;
    price: number;
    photoUrl: string;
    order: number;
  }
  interface NewProduct extends Product {}

  // --- Firebase参照 ---
  // すべての商品が格納されている単一のノードを参照
  const productsRef: DatabaseReference = ref(database, "products");
  
  let unsubscribe: (() => void) | undefined;

  // --- リアルタイムデータの購読 ---
  onMount(() => {
    unsubscribe = onValue(productsRef, (snapshot) => {
      products = snapshot.val() || {};
      // 編集中のデータも最新にするロジックは前回と同様
      if (editingProductId && products[editingProductId]) {
        editingProduct = products[editingProductId];
      } else {
        editingProductId = null;
        editingProduct = null;
      }
    });
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  // --- CRUD 操作関数 ---

  /** 新しい商品を追加する (Create) */
  function addProduct() {
    if (!newProduct.name || newProduct.price <= 0 || !newProduct.teamId) return;

    // productsノード直下に push で追加
    const newPostRef = push(productsRef); 
    set(newPostRef, newProduct)
      .then(() => {
        console.log("商品を追加しました。");
        // フォームをクリア (teamId は維持しても良い)
        newProduct = { teamId: newProduct.teamId, name: '', price: 0, photoUrl: '', order: 0 }; 
      })
      .catch(error => console.error("商品追加エラー:", error));
  }

  /** 商品の編集モードを開始する */
  function startEdit(productId: string) {
    editingProductId = productId;
    editingProduct = { ...products[productId] }; 
  }

  /** 商品の情報を更新する (Update) */
  function saveEdit() {
    if (!editingProductId || !editingProduct || editingProduct.price <= 0) return;

    // 特定の商品への参照を取得 (`products/ユニークID`の形になる)
    const productRef = ref(database, `products/${editingProductId}`);

    update(productRef, editingProduct)
      .then(() => {
        console.log("商品を更新しました。");
        cancelEdit();
      })
      .catch(error => console.error("商品更新エラー:", error));
  }

  /** 編集モードをキャンセルする */
  function cancelEdit() {
    editingProductId = null;
    editingProduct = null;
  }

  /** 商品を削除する (Delete) */
  function deleteProduct(productId: string) {
    if (!confirm("本当にこの商品を削除しますか？")) return;
    
    const productRef = ref(database, `products/${productId}`);
    remove(productRef)
      .then(() => console.log("商品を削除しました。"))
      .catch(error => console.error("商品削除エラー:", error));
  }

  // --- 表示用のデータ変換 ---
  $: productsArray = Object.entries(products).map(([id, product]) => ({ id, ...product }));
</script>

<section>
  <h2>商品管理画面 (全チーム)</h2>

  <div class="card add-form">
    <h3>🚀 新しい商品を追加</h3>
    <input type="text" placeholder="チームID (teamId)" bind:value={newProduct.teamId} required />
    <input type="text" placeholder="名前 (name)" bind:value={newProduct.name} required />
    <input type="number" placeholder="価格 (price)" bind:value|number={newProduct.price} required />
    <input type="text" placeholder="写真URL (photoUrl)" bind:value={newProduct.photoUrl} />
    <input type="number" placeholder="初期注文数 (order)" bind:value|number={newProduct.order} />
    <button on:click={addProduct}>商品を追加</button>
  </div>
  
  <hr />

  <h3>商品一覧 ({productsArray.length} 件)</h3>
  {#each productsArray as product (product.id)}
    <div class="card product-item">
      {#if editingProductId === product.id && editingProduct}
        <div class="edit-mode">
          <h4>{editingProduct.name} の編集中...</h4>
          <p><strong>Team ID: {editingProduct.teamId}</strong></p>
          <input type="text" placeholder="チームID" bind:value={editingProduct.teamId} /> 
          <input type="text" placeholder="名前" bind:value={editingProduct.name} />
          <input type="number" placeholder="価格" bind:value|number={editingProduct.price} />
          <input type="text" placeholder="写真URL" bind:value={editingProduct.photoUrl} />
          <input type="number" placeholder="注文数" bind:value|number={editingProduct.order} />
          
          <div class="actions">
            <button on:click={saveEdit} class="save-btn">保存</button>
            <button on:click={cancelEdit} class="cancel-btn">キャンセル</button>
          </div>
        </div>

      {:else}
        <div class="display-mode">
          <h4>{product.name} (チーム: {product.teamId})</h4>
          <p>価格: ¥{product.price.toLocaleString()}</p>
          <p>注文数: {product.order}</p>
          <small>ID: {product.id}</small>

          <div class="actions">
            <button on:click={() => startEdit(product.id)}>編集</button>
            <button on:click={() => deleteProduct(product.id)} class="delete-btn">削除</button>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <p>商品がありません。</p>
  {/each}
</section>