<script lang='ts'>
  import { getAuth } from "firebase/auth";
  import { メールアドレスを分割, ロールを判定 } from "./splitEmailAddress.mts";

  const auth = getAuth();
  const user = auth.currentUser;
  let userEmail: string = '';
  let userRole: string = '';

  if ( user !== null && user.email !== null) {
    userEmail = user.email;
    const メールアドレスによるユーザー属性: string = メールアドレスを分割(userEmail);
    userRole = ロールを判定(メールアドレスによるユーザー属性);
  }
</script>

<div>
  <p>ログインID：「{userEmail}」</p>
  <p>ロール：{userRole}</p>
  {#if (userRole === "admin")}
    <p>オーダを受け付けるには<a href='/order/'>こちら</a></p>
    <p>店舗側UIを見るには<a href='/tenant/'>こちら</a></p>
  {:else}
    <p>店舗側UI（注文を閲覧し，チェックマークを付けます）は<a href='/tenant/'>こちら</a></p>
  {/if}
</div>