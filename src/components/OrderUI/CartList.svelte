<script lang="ts">
  import ProductDetail from './ProductDetail.svelte'; 
  import { createEventDispatcher } from 'svelte';
  import { ref, push, set } from "firebase/database";
  import { database } from "../../utils/initializeFirebase.mts";

  // --- プロパティの定義 (親から受け取るデータ) ---
  export let cartInside: string[] = []; 
  export let products: { [id: string]: Product } = {}; 
  
  // --- 型定義 ---
  interface Product { teamId: string; name: string; price: number; photoUrl: string; order: number; soldOut: boolean; }
  interface CartItem { productId: string; quantity: number;}
  interface Order { createdAt: number; status: 'pending' | 'completed' | 'cancelled'; items: CartItem[]; }

  const dispatch = createEventDispatcher(); 
  
  // --- リアクティブな計算 ---
  $: uniqueProductIds = Array.from(new Set(cartInside));
  $: productCounts = cartInside.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {} as { [id: string]: number });
  $: totalItems = cartInside.length;

  // 合計金額の計算 (価格をNumber()で確実に数値に変換)
  $: totalAmount = uniqueProductIds.reduce((total, id) => {
    const productData = products[id];
    const count = productCounts[id];

    const price = Number(productData?.price) || 0; 
    
    if (productData && price > 0) {
      return total + (price * count);
    }
    return total;
  }, 0);
  
  // --- イベントハンドラ（親への通知） ---
  function handleQuantityChange(id: string, change: 'increase' | 'decrease' | 'remove') {
    dispatch('quantityChange', { productId: id, changeType: change });
  }

  function decreaseQuantity(id: string) {
    const currentCount = productCounts[id] || 0;
    if (currentCount > 1) {
      handleQuantityChange(id, 'decrease');
    } else if (currentCount === 1) {
      if (confirm("この商品をカートから完全に削除しますか？")) {
        handleQuantityChange(id, 'remove');
      }
    }
  }

  // --- 注文送信ロジック ---
  async function submitOrder() {
    if (cartInside.length === 0) { // totalAmountもチェック
      alert("カートに商品がないか、合計金額が不正です。");
      return;
    }

    if (!confirm(`合計金額 ${totalAmount.toLocaleString()} 円で注文を確定しますか？`)) {
      return;
    }
    
    // 1. 注文アイテムリストの作成 (注文時のデータを固定)
    const orderItems: CartItem[] = uniqueProductIds.map(id => {
      const quantity = productCounts[id];

      return {
        productId: id,
        quantity: quantity,
      };
    });

    // 2. 注文オブジェクトの作成
    const newOrder: Order = {
      createdAt: Date.now(),
      status: 'pending', 
      items: orderItems,
    };

    // 3. Firebase (/orders) への書き込み
    try {
      const ordersRef = ref(database, "orders");
      const newOrderRef = push(ordersRef);
      await set(newOrderRef, newOrder);

      alert(`注文が完了しました！\n注文ID: ${newOrderRef.key}\n合計金額: ¥${totalAmount.toLocaleString()}`);

      // 4. 成功後、カートをクリアするために親へ通知
      dispatch('orderSubmitted', {});

    } catch (error) {
      console.error("注文送信エラー:", error);
      alert("注文の送信中にエラーが発生しました。コンソールを確認してください。");
    }
  }

</script>

<div class='cart-list-page'>
  <h1>カート ({totalItems} 点)</h1>
  
  {#if uniqueProductIds.length === 0}
    <p>カートに商品が入っていません。</p>
  {:else}
    <div class="cart-items-container">
      {#each uniqueProductIds as productId (productId)}
        <div class="cart-item-card">
          <ProductDetail productId={productId} />
          
          <div class="quantity-control">
            <button on:click={() => decreaseQuantity(productId)} disabled={productCounts[productId] <= 0}>－</button>
            <span class="quantity-display">数量: {productCounts[productId]}</span>
            <button on:click={() => handleQuantityChange(productId, 'increase')}>＋</button>
          </div>
          
          <div class="actions">
            <button class="remove-btn" on:click={() => handleQuantityChange(productId, 'remove')}>全て削除</button>
          </div>
        </div>
      {/each}
    </div>
    
    <div class="order-summary">
      <hr>
      <h3>合計金額: ¥{totalAmount.toLocaleString()}</h3>
      
      <button 
        class="submit-order-btn" 
        on:click={submitOrder}
        disabled={cartInside.length === 0}
      >
        注文を確定する
      </button>
    </div>
  {/if}
</div>
