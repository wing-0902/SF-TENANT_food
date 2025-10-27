<script lang="ts">
  import { ref, onValue, set, push, remove, update, type DatabaseReference } from "firebase/database";
  import { database } from "../../utils/initializeFirebase.mts";
  import { onMount, onDestroy } from 'svelte';
  import IsOrdering from './IsOrdering.svelte';

  $: cartInside = [];

  function addToCart(productId: string) {
    cartInside.push(productId);
  };

  // --- 変数定義 ---
  let products: { [id: string]: Product } = {}; 
  let editingProductId: string | null = null;
  let editingProduct: Product | null = null;
  
  // 型定義 (TypeScript向け)
  interface Product {
    teamId: string;
    name: string;
    price: number;
    photoUrl: string;
    order: number;
    soldOut: boolean;
  }

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

  // --- 表示用のデータ変換 ---
  $: productsArray = Object.entries(products).map(([id, product]) => ({ id, ...product }));
</script>

<section>
  <h1>注文を作成</h1>
  <p>{cartInside}</p>
  <hr />
  <h2>商品一覧 ({productsArray.length} 件)</h2>
  <div class='creating'>
    <div class='allSlot'>
      <div class='allProductLists'>
        {#each productsArray as product (product.id)}
          <div class="product-item">
            <div class="display-mode">
              <h3>{product.name}</h3>
              <p>企画：{product.teamId}</p>
              <p>価格：¥{product.price.toLocaleString()}</p>
              <p>在庫数：{product.order}</p>
              {#if (product.soldOut)}
                <p>売り切れ</p>
              {:else}
                <p>在庫あり</p>
              {/if}
              <small>ID：{product.id}</small><br/>
              <button on:click={addToCart(`${product.id}`)}>カートに追加</button>
            </div>
          </div>
        {:else}
          <p>商品がありません。</p>
        {/each}
      </div>
    </div>
    <div class='isOrderingSlot'>
      <IsOrdering />
    </div>
  </div>
</section>

<style lang='scss'>
  .creating {
    display: flex;
    .isOrderingSlot {
      width: 300px;
    }
    .allSlot {
      display: block;
      width: calc(100% - 300px);
    }
  }

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
      .edit-mode {
        h3, p, small {
          margin: 5px auto;
        }
      }
    }
  }
</style>