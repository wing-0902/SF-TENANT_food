<script lang="ts">
  import { createUserWithEmailAndPassword, sendEmailVerification, signInWithEmailAndPassword } from 'firebase/auth';
  import { auth } from '../../utils/initializeFirebase.mjs';

  let email = '';
  let password = '';
  let errorMessage = '';

  const handleAuth = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = '/loginComplete/';
    } catch (error: any) {
      errorMessage = error.message;
      alert(`エラー: ${errorMessage}`);
      console.error(error);
    }
  };
</script>

<div>
  <section>
    <form on:submit|preventDefault={() => handleAuth()}>
      <label for="email">メールアドレス</label>
      <br/>
      <input type="email" bind:value={email} required /><br/><br/>
      <label for="password">パスワード</label><br/>
      <input type="password" bind:value={password} required minlength="6" /><br/>
      {#if errorMessage}
        <p>{errorMessage}</p>
      {/if} 
      <div class='submitSlot'>
        <button type="submit">ログイン</button>
      </div>
    </form>
  </section>
</div>

<style lang='scss'>
  section {
    width: 100%;
    display: flex;
    justify-content: center;
    form {
      flex-direction: column;
      width: 500px;
      max-width: 100%;
      input {
        width: 100%;
        font-family: FiraCode;
        font-size: 1.1em;
      }
      .submitSlot {
        width: 100%;
        justify-content: center;
        display: flex;
        button {
          margin-top: 8px;
          font-size: 1em;
          font-family: ZenMaru;
        }
      }
    }
  }
</style>