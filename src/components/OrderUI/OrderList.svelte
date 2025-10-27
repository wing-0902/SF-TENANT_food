<script lang="ts">
  import { ref, onValue, set, type DatabaseReference } from "firebase/database";
  import { database } from "../../utils/initializeFirebase.mts";
  import { onMount, onDestroy } from 'svelte';

  // --- 型定義 ---
  interface CartItem { productId: string; quantity: number; }
  
  interface Order { 
    id: string; // コンポーネント内で一時的に持たせるID
    createdAt: number; 
    status: 'pending' | 'completed' | 'cancelled'; 
    items: CartItem[];
    // 必要に応じて totalAmount などを追加
  }

  // --- 状態変数 ---
  let orders: Order[] = []; // 全ての注文データ
  let isLoading: boolean = true;
  let unsubscribe: (() => void) | undefined;
  
  // --- リアクティブな絞り込み ---
  // ステータスが 'pending' の注文のみに絞り込む
  $: pendingOrders = orders.filter(order => order.status === 'pending');
  
  // --- Firebaseデータの購読 ---
  onMount(() => {
    const ordersRef: DatabaseReference = ref(database, "orders");
    
    // ordersノード全体を監視
    unsubscribe = onValue(ordersRef, (snapshot) => {
      const rawOrders = snapshot.val() || {};
      const newOrders: Order[] = [];

      // Firebaseオブジェクトを配列に変換し、IDを付与
      for (const id in rawOrders) {
        if (rawOrders.hasOwnProperty(id)) {
          const orderData = rawOrders[id];
          newOrders.push({
            id: id, // FirebaseキーをIDとして保持
            ...orderData,
          });
        }
      }

      // 作成日時が新しい順にソート（DESC）
      orders = newOrders.sort((a, b) => b.createdAt - a.createdAt);
      isLoading = false;
    });
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  // --- ステータス変更ロジック ---
  /**
   * 注文のステータスを指定された新しい値に更新する
   * @param orderId 更新対象の注文ID
   * @param newStatus 設定する新しいステータス
   */
  async function updateOrderStatus(orderId: string, newStatus: 'completed' | 'cancelled') {
    if (!confirm(`注文ID: ${orderId} のステータスを ${newStatus === 'completed' ? '提供済' : 'キャンセル'} に変更しますか？`)) {
      return;
    }
    
    try {
      // 特定の注文のstatusフィールドへの参照を取得し、値を更新
      const statusRef = ref(database, `orders/${orderId}/status`);
      await set(statusRef, newStatus);
      
      alert("ステータスを更新しました。");
    } catch (error) {
      console.error("ステータス更新エラー:", error);
      alert("ステータス更新中にエラーが発生しました。コンソールを確認してください。");
    }
  }

  // 日付フォーマットヘルパー
  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
                {item.quantity} 個 (商品ID: {item.productId.substring(0, 5)}...)
              </li>
            {/each}
          </ul>

          <div class="actions">
            <button 
              class="complete-btn" 
              on:click={() => updateOrderStatus(order.id, 'completed')}>
              提供済みにする
            </button>
            
            <button 
              class="cancel-btn" 
              on:click={() => updateOrderStatus(order.id, 'cancelled')}>
              キャンセル
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>