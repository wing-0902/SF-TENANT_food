<script lang="ts">
  import { ref, onValue, set, type DatabaseReference } from "firebase/database";
  import { database } from "../../utils/initializeFirebase.mts";
  import { onMount, onDestroy } from 'svelte';

  // --- 型定義 ---
  interface Product { name: string; /* ... 他のプロパティ ... */ }
  interface CartItem { productId: string; quantity: number; }
  interface Order { 
    id: string;
    createdAt: number; 
    status: 'pending' | 'completed' | 'cancelled'; 
    items: CartItem[];
  }

  // --- 状態変数 ---
  let orders: Order[] = []; 
  // ⭐ 新規追加: 全製品データを格納する
  let products: { [id: string]: Product } = {}; 
  let isLoading: boolean = true;
  let unsubscribeOrders: (() => void) | undefined;
  let unsubscribeProducts: (() => void) | undefined;
  
  // --- リアクティブな絞り込み ---
  $: pendingOrders = orders.filter(order => order.status === 'pending');
  
  // --- Firebaseデータの購読 ---
  onMount(() => {
    // 1. 注文データ (/orders) の購読 (既存)
    const ordersRef: DatabaseReference = ref(database, "orders");
    unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const rawOrders = snapshot.val() || {};
      const newOrders: Order[] = [];

      for (const id in rawOrders) {
        if (rawOrders.hasOwnProperty(id)) {
          const orderData = rawOrders[id];
          newOrders.push({
            id: id,
            ...orderData,
          });
        }
      }

      orders = newOrders.sort((a, b) => b.createdAt - a.createdAt);
      isLoading = false;
    });

    // ⭐ 2. 製品データ (/products) の購読 (新規追加)
    const productsRef: DatabaseReference = ref(database, "products");
    unsubscribeProducts = onValue(productsRef, (snapshot) => {
      // 注文一覧では価格は不要だが、CreateOrder.svelteに合わせて安全のため型変換を行う
      const rawProducts = snapshot.val() || {};
      const cleanedProducts: { [id: string]: Product } = {};
      for (const id in rawProducts) {
        if (rawProducts.hasOwnProperty(id)) {
          const product = rawProducts[id];
          cleanedProducts[id] = {
            ...product,
            // 注文一覧表示では必須ではないが、一貫性のために数値に変換
            price: Number(product.price) || 0, 
            order: Number(product.order) || 0,
            // nameがあればProduct型として成立
            name: product.name || '名前不明', 
          };
        }
      }
      products = cleanedProducts;
    });
  });

  onDestroy(() => {
    if (unsubscribeOrders) {
      unsubscribeOrders();
    }
    if (unsubscribeProducts) {
      unsubscribeProducts();
    }
  });

  // --- ステータス変更ロジック (省略) ---
  async function updateOrderStatus(orderId: string, newStatus: 'completed' | 'cancelled') { /* ... */ }

  // 日付フォーマットヘルパー (省略)
  function formatDate(timestamp: number): string { /* ... */ }
  
  /**
   * 製品IDから製品名を取得するヘルパー関数
   */
  function getProductName(productId: string): string {
    return products[productId]?.name || '（製品名が見つかりません）';
  }
</script>

<div class="order-list-admin">
  <h1>未提供の注文一覧 ({pendingOrders.length} 件)</h1>

  {#if isLoading}
    <p>注文データを読み込み中です...</p>
  {:else if pendingOrders.length === 0}
    <p class="no-orders">現在、未提供の注文はありません。🎉</p>
  {:else}
    <div class="order-cards-container">
      {#each pendingOrders as order (order.id)}
        <div class="order-card">
          <div class="header">
            <span class="order-id">ID: {order.id.substring(0, 8)}...</span>
            <span class="timestamp">{formatDate(order.createdAt)}</span>
          </div>
          
          <div class="status-badge pending">未提供</div>
          
          <ul class="item-list">
            {#each order.items as item}
              <li>
                **{getProductName(item.productId)}** ({item.quantity} 個)
              </li>
            {/each}
          </ul>

          <div class="actions">
            </div>
        </div>
      {/each}
    </div>
  {/if}
</div>