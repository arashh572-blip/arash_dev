const $ = id => document.getElementById(id);

let db = null;
let items = [];

function msg(message) {
  if ($('loginStatus')) {
    $('loginStatus').textContent = message;
  }

  if ($('status')) {
    $('status').textContent = message;
  }
}

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

// CONNECT TO SUPABASE

async function start() {

  try {

    const config = window.ARASHDEV_CONFIG || {};

    if (!window.supabase) {
      msg('کتابخانه Supabase بارگذاری نشده است.');
      $('loginBtn').disabled = true;
      return;
    }

    if (
      !config.SUPABASE_URL ||
      !config.SUPABASE_ANON_KEY ||
      config.SUPABASE_URL.startsWith('YOUR_') ||
      config.SUPABASE_ANON_KEY.startsWith('YOUR_')
    ) {
      msg('تنظیمات config.js کامل نیست.');
      $('loginBtn').disabled = true;
      return;
    }

    db = window.supabase.createClient(
      config.SUPABASE_URL,
      config.SUPABASE_ANON_KEY
    );

    const { data, error } = await db.auth.getSession();

    if (error) throw error;

    if (data.session) {
      openEditor();
    }

    msg('آماده ورود هستید.');

  } catch (error) {

    console.error(error);
    msg('خطا در اتصال: ' + error.message);

  }

}

// LOGIN

$('loginBtn').addEventListener('click', async function(event) {

  event.preventDefault();

  try {

    if (!db) {
      msg('اتصال پایگاه داده برقرار نیست.');
      return;
    }

    const email = $('email').value.trim();
    const password = $('pass').value;

    if (!email || !password) {
      msg('ایمیل و رمز عبور را وارد کنید.');
      return;
    }

    $('loginBtn').disabled = true;

    msg('در حال ورود...');

    const { data, error } = await db.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error('نشست ورود ایجاد نشد.');
    }

    msg('ورود موفقیت‌آمیز بود.');

    openEditor();

  } catch (error) {

    console.error(error);
    msg('خطا در ورود: ' + error.message);

  } finally {

    $('loginBtn').disabled = false;

  }

});

// OPEN ADMIN PANEL

function openEditor() {

  $('login').classList.add('hidden');
  $('editor').classList.remove('hidden');

  msg('به پنل مدیریت خوش آمدید.');

  loadList();

}

// LOGOUT

$('logout').addEventListener('click', async function() {

  try {

    await db.auth.signOut();

    $('editor').classList.add('hidden');
    $('login').classList.remove('hidden');

    msg('از حساب خارج شدید.');

  } catch (error) {

    msg(error.message);

  }

});

// IMAGE UPLOAD

async function upload(file) {

  const extension = (file.name.split('.').pop() || 'jpg')
    .replace(/[^a-z0-9]/gi, '');

  const path =
    Date.now() + '-' + crypto.randomUUID() + '.' + extension;

  const { error } = await db.storage
    .from('project-images')
    .upload(path, file);

  if (error) throw error;

  const result = db.storage
    .from('project-images')
    .getPublicUrl(path);

  return result.data.publicUrl;

}

// SAVE PROJECT

$('form').addEventListener('submit', async function(event) {

  event.preventDefault();

  try {

    msg('در حال ذخیره پروژه...');

    const id = $('pid').value;

    const old = items.find(
      item => String(item.id) === String(id)
    );

    let cover = old?.cover_url || null;

    if ($('cover').files[0]) {
      cover = await upload($('cover').files[0]);
    }

    let images = [...(old?.images || [])];

    for (const file of $('gallery').files) {
      const url = await upload(file);
      images.push(url);
    }

    const project = {

      title: $('title').value.trim(),

      category: $('category').value,

      description: $('description').value.trim(),

      details: $('details').value.trim(),

      project_url: $('url').value.trim() || null,

      cover_url: cover,

      images: images,

      published: $('published').checked

    };

    let result;

    if (id) {
