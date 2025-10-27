<script lang="ts">
  import { ref, onValue, set, runTransaction } from "firebase/database";
  import { database } from "../../utils/initializeFirebase.mts";

  let slots = {};

  // DBからデータを購読
  const slotsRef = ref(database, "orders");
  onValue(slotsRef, (snapshot) => {
    slots = snapshot.val() || {};
  });

  let yourProj: string = 'all';
</script>

<section>

</section>

<style lang='scss'>

</style>