<script lang="ts">
  import { getAuth } from 'firebase/auth';
  import { メールアドレスを分割, ロールを判定 } from './splitEmailAddress.mts';

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

  function update提供済みCount(productId: string, delta: number, waiting: number) {
    const countRef = ref(database, `products/${productId}/alreadyServed`);

    runTransaction(countRef, (current) => {
      const newValue = (current || 0) + delta;
      
      return Math.min(waiting, newValue);
    });
  }

  $: targetTeamId = userRole !== 'admin' ? userRole : 'all';

  $: filteredProductsArray = (targetTeamId === 'all')
    ? productsArray
    : productsArray.filter(product => product.teamId === targetTeamId);

  $: filteredProductsArray.sort((a, b) => {
    const conditionA = a.alreadyServed !== a.order;
    const conditionB = b.alreadyServed !== b.order;

    if (conditionA && !conditionB) {
      return -1;
    }

    if (!conditionA && conditionB) {
      return 1;
    }

    return 0;
  });

  function ほんまに売り切れでええんか(productId: string, 売り切れか: boolean) {
    let 確認メッセージ = 'ほんまに売り切れにしてええねんな？';
    
    if (売り切れか) {
      確認メッセージ = '売り切れを解除しますか？'
    } else {
      確認メッセージ = 確認メッセージ;
    }

    const result = confirm(確認メッセージ);
    if (result) {
      売り切れにする(productId);
    } else {
      alert("売り切れにするのをキャンセルしました");
    }
  }

  function 売り切れにする(productId: string) {
    const 売り切れRef = ref(database, `products/${productId}/soldOut`);
    runTransaction(売り切れRef, (current) => {
      return (!current);
    });
  }
</script>

<section>
  <p>ロール：{userRole}</p>
  {#if (userRole !== null)}
    <div class='ok200'>
      <h2>待機中の注文一覧</h2>
      <div class='list'>
        {#each filteredProductsArray as product (product.id)}
          <div
            class='buttonSlot'
            class:stock-low={product.maxOrder - product.order <= 70}
            class:残りほとんどない={product.maxOrder - product.order <= 15}
            class:売り切れ={product.soldOut === true}
            class:待機なし={product.order - product.alreadyServed === 0}
          >
            <button class='plusButton' on:click={() => update提供済みCount((product.id), 1, (product.order))}>
              <small>{product.teamId}</small>
              <h3>{product.name}</h3>
              <p>¥{product.price}</p>
              <p>残在庫：{product.maxOrder - product.order}個</p>
              <p>状況：{#if (product.soldOut)}売り切れ{:else}在庫あり{/if}</p>
              <p>待機中：
                <span class='waitingNum'>{product.order - product.alreadyServed}</span>個
              </p>
            </button>
            <button class='売り切れボタン' on:click={() => ほんまに売り切れでええんか((product.id), (product.soldOut))}>
              {#if (product.soldOut)}
                売り切れを解除
              {:else}
                売り切れにする
              {/if}
            </button>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class='status403'>
      <h2>403 Forbidden</h2>
      <p>ヒミツ♡</p>
    </div>
  {/if}
</section>

<style lang='scss'>
  .ok200 {
    .list {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      .buttonSlot {
        display: block;
        width: 250px;
        margin: 0 5px;
        --radius: 30px;

        &.stock-low {
          button {
            background-color: rgb(255, 234, 0);
          }
        }
        &.残りほとんどない {
          button {
            background-color: rgb(145, 0, 0);
            color: white;
            .waitingNum {
              color: yellow;
            }
          }
        }
        &.売り切れ {
          button {
            background-color: black;
            color: white;
            .waitingNum {
              color: orange;
            }
          }
        }
        &.待機なし {
          opacity: 0.3;
        }
        .plusButton {
          width: 100%;
          height: 250px;
          border-radius: var(--radius) var(--radius) 0 0;
          h3, p {
            font-family: ZenMaru;
          }
          small {
            font-family: FiraCode;
          }
          h3 {
            font-size: 1.5em;
          }
          h3, small, p {
            margin: 0;
          }
          small, p {
            font-size: 1.4em;
          }
          .waitingNum {
            font-size: 50px;
            color: red;
          }
          margin: 0;
        }
        .売り切れボタン {
          width: 100%;
          font-family: ZenMaru;
          height: 40px;
          border-radius: 0 0 var(--radius) var(--radius);
          margin: 0;
          font-size: 1.3em;
        }
      }
    }
  }
</style>