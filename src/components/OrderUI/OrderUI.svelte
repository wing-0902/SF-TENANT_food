<script lang='ts'>
  import { getAuth } from "firebase/auth";
  import { メールアドレスを分割, ロールを判定 } from "./splitEmailAddress.mts";

  let products: {
    [id: string]: Product
  } = {};
  let editingProductId: string | null = null;
  let editingProduct: Product | null = null;

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

  const auth = getAuth();
  const user = auth.currentUser;
  let userRole: string = '';

  if ( user !== null && user.email !== null) {
    const メールアドレスによるユーザ属性: string = メールアドレスを分割(user.email);
    userRole = ロールを判定(メールアドレスによるユーザ属性);
  }

  import { database } from '../../utils/initializeFirebase.mts';
  import { ref, onValue, set, push, remove, update, runTransaction, type DatabaseReference} from 'firebase/database';
  import { onMount, onDestroy } from 'svelte';

  // Firebase参照
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

  $: productsArray = Object.entries(products).map(([id, product]) => ({ id, ...product }));

  function updateOrderCount(productId: string, delta: number, alreadyServed: number, soldOut: boolean) {
    if (soldOut) {
      return;
    };

    const countRef = ref(database, `products/${productId}/order`)

    const minValue = alreadyServed || 0; 
    
    runTransaction(countRef, (current) => {
      const newValue = (current || 0) + delta;
      
      return Math.max(minValue, newValue);
    });
  }
</script>

<section>
  <p>ロール：{userRole}</p>
  {#if (userRole === 'admin')}
    <div class='ok200'>
      <h2>商品一覧</h2>
      <table>
        <thead>
          <tr>
            <th>企画ID</th>
            <th>商品名</th>
            <th>価格</th>
            <th>在庫数</th>
            <th>累計注文数</th>
            <th>累計提供数</th>
            <th>残在庫</th>
            <th>待機中</th>
            <th colspan='2'>注文数操作</th>
          </tr>
        </thead>
        <tbody>
          {#each productsArray as product (product.id)}
            <tr>
              <td>{product.teamId}</td>
              <td>{product.name}</td>
              <td>¥{product.price}</td>
              <td>{product.maxOrder}</td>
              <td>{product.order}</td>
              <td>{product.alreadyServed}</td>
              <td
                class:stock-low={product.maxOrder - product.order <= 70}
                class:残りほとんどない={product.maxOrder - product.order <= 15}
              >
                {product.maxOrder - product.order}
              </td>
              <td>{product.order - product.alreadyServed}</td>
              <td>
                <button
                  disabled={product.soldOut}
                  on:click={() => updateOrderCount((product.id), -1, (product.alreadyServed), (product.soldOut))}
                >
                  ↓
                </button>
              </td>
              <td>
                <button
                  disabled={product.soldOut}
                  on:click={() => updateOrderCount((product.id), 1, (product.alreadyServed), (product.soldOut))}
                >
                  ↑
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <div class='status403'>
      <h2>403 Forbidden</h2>
      <p>アクセス権限がありません．</p>
    </div>
  {/if}
</section>

<style lang="scss">
  .ok200 {
    table {
      border: 1px solid black;
      tr {
        height: 40px;
        th, td {
          border: 1px solid black;
        }
        td {
          button {
            width: 100%;
            height: 40px;
            border: none;
          }
        }
        td {
          &.stock-low {
            background-color: rgb(255, 234, 0);
          }
          &.残りほとんどない {
            background-color: rgb(145, 0, 0);
            color: white;
          }
        }
      }
    }
  }
</style>