const $ = id => document.getElementById(id);
const c = window.ARASHDEV_CONFIG || {};

let db, items = [];

function msg(s) {
  $('loginStatus').textContent = s;
}

if (!window.supabase) {
  msg('کتابخانه Supabase بارگذاری نشده است.');
  $('loginBtn').disabled = true;
} else if (
  !c.SUPABASE_URL ||
  c.SUPABASE_URL.startsWith('YOUR_') ||
  !c.SUPABASE_ANON_KEY ||
  c.SUPABASE_ANON_KEY.startsWith('YOUR_')
) {
  msg('تنظیمات config.js کامل نیست.');
  $('loginBtn').disabled = true;
} else {
  db = window.supabase.createClient(
    c.SUPABASE_URL,
    c.SUPABASE_ANON_KEY
  );
}

$('loginBtn').onclick = async () => {
  if (!db) return;

  const email = $('email').value.trim();
  const password = $('pass').value;

  if (!email || !password) {
    msg('ایمیل و رمز عبور را وارد کن.');
    return;
  }

  $('loginBtn').disabled = true;
  msg('در حال بررسی اطلاعات...');

  try {
    const { data, error } = await db.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    msg('ورود موفق بود!');
    $('login').classList.add('hidden');
    $('editor').classList.remove('hidden');

    loadList();
  } catch (error) {
    msg('خطا: ' + error.message);
  } finally {
    $('loginBtn').disabled = false;
  }
};

async function loadList() {
  const { data, error } = await db
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    $('status').textContent = error.message;
    return;
  }

  items = data || [];

  $('list').innerHTML = items.map(p => 
    <div class="item">
      <b>${p.title}</b>
    </div>
  ).join('') || 'هنوز پروژه‌ای ثبت نشده است.';
}

$('logout').onclick = async () => {
  await db.auth.signOut();
  location.reload();
};
