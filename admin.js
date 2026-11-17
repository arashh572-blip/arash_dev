$('loginBtn').addEventListener('click', async (e) => {
  e.preventDefault();

  try {
    msg('در حال اتصال...');

    if (!db) {
      msg('اتصال به دیتابیس برقرار نیست.');
      return;
    }

    const email = $('email').value.trim();
    const password = $('pass').value;

    if (!email || !password) {
      msg('ایمیل و رمز عبور را وارد کن.');
      return;
    }

    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      msg('خطا: ' + error.message);
      return;
    }

    openEditor();

  } catch (err) {
    msg('خطا: ' + err.message);
    console.error(err);
  }
});
