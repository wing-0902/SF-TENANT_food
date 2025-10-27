<script lang='ts'>
  import { ref, onValue, set, push, remove, update, type DatabaseReference } from "firebase/database";
  import { database, auth } from "../../utils/initializeFirebase.mts";
  import { onMount, onDestroy } from 'svelte';
  import { onAuthStateChanged } from 'firebase/auth';

  let user: any = null;
  let userId: string = '';

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      user = authUser;
      if(user) {
        if(user.displayName) {
          userId = (user.email);
        } else {
          userId = 'ERROR';
        }
      }
    });
    return () => unsubscribe();
  });

  function getUsernameFromEmail(email: string): string {
    const parts = email.split('@');
    return parts[0];
  }
  $:userGroup = getUsernameFromEmail(userId);
</script>

<section>
  <p>{userId}</p>
  <h1>{userGroup}の商品</h1>
</section>