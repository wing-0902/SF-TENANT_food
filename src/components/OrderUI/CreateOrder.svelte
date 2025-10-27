<script lang="ts">
  import { ref, onValue, type DatabaseReference } from "firebase/database";
  import { database } from "../../utils/initializeFirebase.mts";
  import { onMount, onDestroy } from 'svelte';
  // CartListからイベントを受け取るため、on:quantityChange のリスナーを有効にする
  import CartList from './CartList.svelte'; 

  // --- カートの状態管理 ---
  // Svelte のリアクティブな状態として定義
  let cartInside: string[] = []; // 製品IDの配列。重複が数量を表す

  /**
   * 商品一覧から「カートに追加」ボタンが押されたときの処理
   * @param productId 追加する製品ID
   */
  function addToCart(productId: string) {
    // 常に配列の末尾に追加するだけで数量増加として機能する
    cartInside.push(productId);
    // Svelteに配列の変更を検知させるための再代入
    cartInside = cartInside; 
    console.log(`[CreateOrder] ${productId} を追加:`, cartInside);
  };
  
  /**
   * CartList から発火された数量変更イベントを処理する
   */
  function handleQuantityUpdate(event: CustomEvent<{ productId: string, changeType: 'increase' | 'decrease' | 'remove' }>) {
    const { productId, changeType } = event.detail;
    
    // Svelteのリアクティビティを確保するため、常に新しい配列のコピーを作成
    let newCart = [...cartInside]; 
    
    if (changeType === 'increase') {
      // 増加: 配列に製品IDを1つ追加
      newCart.push(productId);
      
    } else if (changeType === 'decrease') {
      // 減少: その製品IDを持つ最初の要素を見つけて削除
      const indexToRemove = newCart.indexOf(productId);
      if (indexToRemove !== -1) {
        newCart.splice(indexToRemove, 1);
      }
      
    } else if (changeType === 'remove') {
      // 全て削除: その製品IDを持つ要素を全て除外して新しい配列を作成
      newCart = newCart.filter(id => id !== productId);
    }
    
    // 新しい配列で状態を更新し、UIを再描画させる
    cartInside = newCart; 
    console.log(`[CreateOrder] カートが更新されました (${changeType}):`, cartInside);
  }

  // --- 変数定義 (既存のまま) ---
  let products: { [id: string]: Product } = {};	
  // ... 既存のコードは省略 ... (編集に関する変数、型定義、Firebaseロジックなど)
  let editingProductId: string | null = null;
  let editingProduct: Product | null = null;
  let selectedTeamIds: Set<string> = new Set();
  
  interface Product {
    teamId: string;
    name: string;
    price: number;
    photoUrl: string;
    order: number;
    soldOut: boolean;
  }
  
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

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  // 全商品からユニークな teamId のリストを抽出
  $: allTeamIds = Object.values(products)
    .map(product => product.teamId)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort(); 

  // チェックリストの変更を処理する関数
  function toggleTeamId(teamId: string) {
    if (selectedTeamIds.has(teamId)) {
      selectedTeamIds.delete(teamId);
    } else {
      selectedTeamIds.add(teamId);
    }
    selectedTeamIds = selectedTeamIds;
  }

  // --- 表示用のデータ変換と絞り込み ---
  $: productsArray = Object.entries(products)
    .map(([id, product]) => ({ id, ...product }))
    .filter(product => {
      if (selectedTeamIds.size === 0) {
        return true;
      }
      return selectedTeamIds.has(product.teamId);
    });
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