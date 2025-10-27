<script lang="ts">
  import ProductDetail from './ProductDetail.svelte'; 
  import { createEventDispatcher } from 'svelte'; // ① イベントディスパッチャーをインポート
  
  export let cartInside: string[] = []; 
  
  // ① ディスパッチャーの初期化
  const dispatch = createEventDispatcher(); 

  // リアクティブな計算 (前回のものと同じ)
  $: uniqueProductIds = Array.from(new Set(cartInside));
  $: productCounts = cartInside.reduce((acc, id) => {
    acc[id] = (acc[id] || 0) + 1;
    return acc;
  }, {} as { [id: string]: number });
  $: totalItems = cartInside.length;
  
  /**
   * ② 数量変更イベントを親コンポーネントに通知する
   * @param id 変更対象の製品ID
   * @param change 'increase', 'decrease', または 'remove'
   */
  function handleQuantityChange(id: string, change: 'increase' | 'decrease' | 'remove') {
    // 'quantityChange' という名前のカスタムイベントを発火
    dispatch('quantityChange', { 
      productId: id, 
      changeType: change // どのような変更を要求しているかをペイロードに含める
    });
  }

  // ③ 数量を減らす際、1個の場合は削除するか確認するロジック
  function decreaseQuantity(id: string) {
    const currentCount = productCounts[id] || 0;
    if (currentCount > 1) {
      handleQuantityChange(id, 'decrease');
    } else if (currentCount === 1) {
      // 数量が1で、さらにマイナスボタンが押された場合は削除を提案
      if (confirm("この商品をカートから完全に削除しますか？")) {
        handleQuantityChange(id, 'remove');
      }
    }
  }

</script>

<div class='cart-list-page'>
  <h1>カート一覧 ({totalItems} 点)</h1>
  
  {#if uniqueProductIds.length === 0}
    <p>カートに商品が入っていません。</p>
  {:else}
    <div class="cart-items-container">
      {#each uniqueProductIds as productId (productId)}
        <div class="cart-item-card">
          <ProductDetail productId={productId} />
          
          <div class="quantity-control">
            <button 
              on:click={() => decreaseQuantity(productId)} 
              disabled={productCounts[productId] <= 0}
            >
              －
            </button>
            
            <span class="quantity-display">
              数量: {productCounts[productId]}
            </span>
            
            <button 
              on:click={() => handleQuantityChange(productId, 'increase')}
            >
              ＋
            </button>
          </div>
          
          <div class="actions">
            <button 
              class="remove-btn" 
              on:click={() => handleQuantityChange(productId, 'remove')}>
              全て削除
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>