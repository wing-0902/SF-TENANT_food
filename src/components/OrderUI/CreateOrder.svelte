<script lang="ts">
  import { ref, onValue, type DatabaseReference } from "firebase/database";
  import { database } from "../../utils/initializeFirebase.mts";
  import { onMount, onDestroy } from 'svelte';
  import CartList from './CartList.svelte';

  // --- カートの状態管理 ---
  let cartInside: string[] = []; // 製品IDの配列（重複あり）

  function addToCart(productId: string) {
    cartInside.push(productId);
    cartInside = cartInside; // Svelteに更新を通知
  };
  
  // CartListからの数量変更イベント処理
  function handleQuantityUpdate(event: CustomEvent<{ productId: string, changeType: 'increase' | 'decrease' | 'remove' }>) {
    const { productId, changeType } = event.detail;
    let newCart = [...cartInside]; 
    
    if (changeType === 'increase') {
      newCart.push(productId);
    } else if (changeType === 'decrease') {
      const indexToRemove = newCart.indexOf(productId);
      if (indexToRemove !== -1) { newCart.splice(indexToRemove, 1); }
    } else if (changeType === 'remove') {
      newCart = newCart.filter(id => id !== productId);
    }
    
    cartInside = newCart; 
  }

  // CartListからの注文完了イベント処理（カートを空にする）
  function handleOrderSubmitted() {
    cartInside = [];
  }

  // --- 製品データ管理 (既存のまま) ---
  let products: { [id: string]: Product } = {};	
  let editingProductId: string | null = null;
  let editingProduct: Product | null = null;
  let selectedTeamIds: Set<string> = new Set();
  interface Product { teamId: string; name: string; price: number; photoUrl: string; order: number; soldOut: boolean; }
  const productsRef: DatabaseReference = ref(database, "products");
  let unsubscribe: (() => void) | undefined;
  
  onMount(() => {
    unsubscribe = onValue(productsRef, (snapshot) => {
      products = snapshot.val() || {};
      if (editingProductId && products[editingProductId]) {
        editingProduct = products[editingProductId];
      } else {
        editingProductId = null;
        editingProduct = null;
      }
    });
  });

  onDestroy(() => { if (unsubscribe) { unsubscribe(); } });

  // --- 絞り込みロジック (既存のまま) ---
  $: allTeamIds = Object.values(products).map(product => product.teamId).filter((value, index, self) => self.indexOf(value) === index).sort(); 
  function toggleTeamId(teamId: string) { /* ... */ }
  $: productsArray = Object.entries(products).map(([id, product]) => ({ id, ...product })).filter(product => { /* ... */ return selectedTeamIds.size === 0 || selectedTeamIds.has(product.teamId); });
</script>

<section>
  <h1>注文を作成</h1>
  <hr />
  
  <div class="filter-controls">
    <h3>企画で絞り込む</h3>
    <div class="team-checklist">
      <label>
        <input
          type="checkbox"
          checked={selectedTeamIds.size === 0}
          on:change={() => (selectedTeamIds = new Set())}
        />
        全て
      </label>
      {#each allTeamIds as teamId (teamId)}
        <label>
          <input
            type="checkbox"
            checked={selectedTeamIds.has(teamId)}
            on:change={() => toggleTeamId(teamId)}
          />
          {teamId}
        </label>
      {/each}
    </div>
  </div>
  
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
      <CartList 
        cartInside={cartInside} 
        on:quantityChange={handleQuantityUpdate} 
      />
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