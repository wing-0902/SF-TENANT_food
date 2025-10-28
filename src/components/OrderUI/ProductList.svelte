<script lang="ts">
  import { ref, onValue, set, push, remove, update, type DatabaseReference } from "firebase/database";
  import { database } from "../../utils/initializeFirebase.mts";
  import { onMount, onDestroy } from 'svelte';
  import firebase from "firebase/compat/app";

  // --- 変数定義 ---
  let products: { [id: string]: Product } = {}; 
  let editingProductId: string | null = null;
  let editingProduct: Product | null = null;
  
  // 新規追加フォーム用のデータ (teamId も含める)
  
  const defaultNewProduct: NewProduct = {
    teamId: 'team01',
    name: '',
    price: 100,
    photoUrl: 'https://seikosf-food.pages.dev/no-image.jpeg',
    maxOrder: 200,
    order: 0,
    alreadyServed: 0,
    soldOut: false,
  };
  let newProduct: NewProduct = defaultNewProduct;
  
  // 型定義 (TypeScript向け)
  interface Product {
    teamId: string;
    name: string;
    price: number;
    photoUrl: string;
    maxOrder: number;
    order: number;
    alreadyServed: number;
    soldOut: boolean;
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
        newProduct = defaultNewProduct;
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
  <h1>商品管理画面 （全企画）</h1>

  <div class="card add-form">
    <h2>新しい商品を追加</h2>
    <label for='企画ID追加'>企画名</label>
    <input id='企画ID追加' type="text" placeholder="企画ID" bind:value={newProduct.teamId} required /><br/>
    <label for='商品名追加'>商品名</label>
    <input id='商品名追加' type="text" placeholder="商品名" bind:value={newProduct.name} required /><br/>
    <label for='価格追加'>価格</label>
    <input id='価格追加' type="number" placeholder="価格" bind:value={newProduct.price} required /><span>円</span><br/>
    <label for='写真URL追加'>写真URL</label>
    <input id='写真URL追加' type="text" placeholder="写真URL" bind:value={newProduct.photoUrl} /><br/>
    <label for='注文数追加'>在庫数</label>
    <input id='注文数追加' type="number" placeholder="在庫数" bind:value={newProduct.maxOrder} /><span>個</span><br/>
    <button on:click={addProduct}>商品を追加</button>
  </div>
  
  <hr />

  <h2>商品一覧 ({productsArray.length} 件)</h2>
  <div class='allProductLists'>
    {#each productsArray as product (product.id)}
      <div class="product-item">
        {#if editingProductId === product.id && editingProduct}
          <div class="edit-mode">
            <h3>{editingProduct.name} の編集中...</h3>
            <p><strong>企画名：{editingProduct.teamId}</strong></p>
            <label for='editTeamName'>企画名</label>
            <input id='editTeamName' type="text" placeholder="企画ID" bind:value={editingProduct.teamId} /><br/>
            <label for='editName'>商品名</label>
            <input id='editName' type="text" placeholder="商品名" bind:value={editingProduct.name} /><br/>
            <label for='editPrice'>価格</label>
            <input id='editPrice' type="number" placeholder="価格" bind:value={editingProduct.price} /><br/>
            <label for='editPhoto'>写真URL</label>
            <input type="text" placeholder="写真URL" bind:value={editingProduct.photoUrl} /><br/>
            <label for='editNum'>在庫数</label>
            <input id='editNum' type="number" placeholder="注文数" bind:value={editingProduct.maxOrder} /><br/>
            <input type="checkbox" bind:checked={editingProduct.soldOut}>
            <label for='soldOutCheck'>売り切れ</label>
            <div class="actions">
              <button on:click={saveEdit} class="save-btn">保存</button>
              <button on:click={cancelEdit} class="cancel-btn">キャンセル</button>
            </div>
          </div>

        {:else}
          <div class="display-mode">
            <h3>{product.name}</h3>
            <p>企画：{product.teamId}</p>
            <p>価格：¥{product.price.toLocaleString()}</p>
            <p>在庫数：{product.maxOrder}</p>
            <p>販売済：{product.alreadyServed}</p>
            {#if (product.soldOut)}
              <p>売り切れ</p>
            {:else}
              <p>在庫あり</p>
            {/if}
            <small>ID：{product.id}</small>
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
  </div>
</section>

<style lang='scss'>
  .allProductLists {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    .product-item {
      border: 1px solid black;
      margin: 2px;
      width: 320px;
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      text-align: center;
      border-radius: 20px 8px;
      .display-mode {
        h3, small, p {
          margin: 10px auto;
        }
      }
      .edit-mode {
        h3, p, small {
          margin: 5px auto;
        }
      }
    }
  }
</style>