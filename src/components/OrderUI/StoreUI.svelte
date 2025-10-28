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
    const countRef = ref(database, `products/${productId}/alreadyServed`)

    runTransaction(countRef, (current) => {
      const newValue = (current || 0) + delta;
      
      return Math.min(waiting, newValue);
    });
  }

  $: targetTeamId = userRole !== 'admin' ? userRole : 'all';

  $: filteredProductsArray = (targetTeamId === 'all')
    ? productsArray
    : productsArray.filter(product => product.teamId === targetTeamId);
</script>

<section>
  <p>ロール：{userRole}</p>
  {#if (userRole !== null)}
    <div class='ok200'>
      <h2>待機中の注文一覧</h2>
      <div>
        {#each filteredProductsArray as product (product.id)}
          <button on:click={() => update提供済みCount((product.id), 1, (product.order))}>
            <small>{product.teamId}</small>
            <h3>{product.name}</h3>
            <p>¥{product.price}</p>
            <p>在庫：{product.maxOrder}個</p>
            <p>待機中：{product.order - product.alreadyServed}個</p>
          </button>
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

</style>