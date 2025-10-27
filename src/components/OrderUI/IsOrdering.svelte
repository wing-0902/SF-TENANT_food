<script lang="ts">
  export let cartInside: string[];
</script>

<div class='cart'>
  <h3>カート</h3>
  <p>{cartInside}</p>
</div>

<style lang='scss'>
  .cart {
    border: 1px solid black;
    min-height: 300px;
    padding: 0 4px;
    box-sizing: border-box;
  }
</style>