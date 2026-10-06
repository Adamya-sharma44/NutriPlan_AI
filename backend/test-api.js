const BASE = 'http://localhost:5000/api';

let pass = 0;
let fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? ' -> ' + extra : '')); }
}

async function api(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  return { status: res.status, body, cookie: res.headers.get('set-cookie') };
}

(async () => {
  const email = 'demo' + Date.now() + '@example.com';
  let cookie = '';

  console.log('\n== AUTH ==');
  let r = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name: '', email: 'nope', password: '1' }) });
  check('register validation errors', r.status === 400 && r.body.errors.name && r.body.errors.email && r.body.errors.password, JSON.stringify(r.body));

  r = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Demo User', email, password: 'secret123' }) });
  cookie = (r.body && r.cookie) || '';
  check('register succeeds', r.status === 201 && r.body.user.email === email, JSON.stringify(r.body));
  check('auth cookie is httpOnly', /httponly/i.test(r.cookie || ''), r.cookie);

  r = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Dup', email, password: 'secret123' }) });
  check('duplicate email rejected', r.status === 400, JSON.stringify(r.body));

  r = await api('/auth/me');
  check('me is a clean 200 when signed out', r.status === 200 && r.body.user === null, JSON.stringify(r.body));
  r = await api('/plans');
  check('plans require auth', r.status === 401, JSON.stringify(r.body));

  r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: 'wrongpass' }) });
  check('wrong password rejected', r.status === 400, JSON.stringify(r.body));

  r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: 'secret123' }) });
  check('login succeeds', r.status === 200, JSON.stringify(r.body));
  cookie = (r.cookie || cookie).split(';')[0];

  const auth = { Cookie: cookie };
  r = await api('/auth/me', { headers: auth });
  check('me returns user with cookie', r.status === 200 && r.body.user.email === email, JSON.stringify(r.body));

  console.log('\n== MEAL PLAN GENERATION ==');
  const form = {
    goal: 'Save time and money', dietary: 'Vegetarian', allergies: 'peanuts', dislikes: 'mushrooms',
    ingredients: 'rice, eggs, spinach', days: 3, mealsPerDay: 3, cookingTime: 'Under 30 minutes',
  };
  r = await api('/ai/meal-plan', { method: 'POST', headers: auth, body: JSON.stringify(form) });
  check('generate plan', r.status === 200 && r.body.plan.days.length === 3, JSON.stringify(r.body).slice(0, 200));
  const plan = r.body.plan;
  const allMeals = plan.days.flatMap((d) => d.meals);
  check('each day has 3 meals', plan.days.every((d) => d.meals.length === 3));
  check('no peanuts in plan', !JSON.stringify(allMeals).toLowerCase().includes('peanut'), allMeals.map(m=>m.title).join(','));
  check('no mushrooms in plan', !JSON.stringify(allMeals).toLowerCase().includes('mushroom'));
  // Vegetarian excludes meat and fish, but still allows eggs and dairy.
  const meatFish = ['chicken', 'beef', 'pork', 'bacon', 'salmon', 'tuna', 'cod', 'mackerel', 'fish', 'shrimp', 'lamb', 'turkey'];
  const vegBad = allMeals.filter((m) => meatFish.some((k) => m.title.toLowerCase().includes(k)));
  check('vegetarian rules respected', vegBad.length === 0, vegBad.map((m) => m.title).join(','));
  check('mode reported', r.body.mode === 'demo' || r.body.mode === 'ai', r.body.mode);

  console.log('\n== VALIDATION ==');
  r = await api('/ai/meal-plan', { method: 'POST', headers: auth, body: JSON.stringify({ goal: '', dietary: '', days: 99, mealsPerDay: 0 }) });
  check('required fields validated', r.status === 400 && r.body.errors.goal && r.body.errors.days && r.body.errors.mealsPerDay, JSON.stringify(r.body));

  r = await api('/ai/meal-plan', { method: 'POST', body: JSON.stringify(form) });
  check('generate requires login', r.status === 401);

  console.log('\n== 5 MEALS + SNACK ==');
  r = await api('/ai/meal-plan', { method: 'POST', headers: auth, body: JSON.stringify({ ...form, mealsPerDay: 5, days: 2 }) });
  const p5 = r.body.plan;
  check('5 meals per day', p5.days[0].meals.length === 5, String(p5.days[0].meals.length));
  check('snacks present', p5.days[0].meals.some((m) => m.slot.startsWith('snack')), p5.days[0].meals.map(m=>m.slot).join(','));

  console.log('\n== GROCERY LIST ==');
  r = await api('/ai/grocery-list', { method: 'POST', headers: auth, body: JSON.stringify({ plan }) });
  check('grocery list generated', r.status === 200 && Array.isArray(r.body.grocery.categories) && r.body.grocery.categories.length > 0, JSON.stringify(r.body).slice(0, 200));
  const cats = r.body.grocery.categories.map((c) => c.category);
  check('known categories only', cats.every((c) => ['Produce','Grains','Protein','Dairy','Other'].includes(c)), cats.join(','));
  console.log('        ' + r.body.grocery.categories.map((c) => c.category + '(' + c.items.length + ')').join(', '));

  r = await api('/ai/grocery-list', { method: 'POST', headers: auth, body: JSON.stringify({ plan: { days: [] } }) });
  check('grocery needs a plan', r.status === 400);

  console.log('\n== MEAL REPLACEMENT ==');
  r = await api('/ai/meal-replacement', { method: 'POST', headers: auth, body: JSON.stringify({ mealSlot: 'lunch', originalMeal: allMeals[1].title, request: 'vegetarian meal under 20 minutes' }) });
  check('replacement generated', r.status === 200 && r.body.replacement.title, JSON.stringify(r.body).slice(0, 200));
  console.log('        ' + r.body.replacement.title + ' (' + r.body.replacement.timeMinutes + 'm)');

  r = await api('/ai/meal-replacement', { method: 'POST', headers: auth, body: JSON.stringify({ request: '' }) });
  check('replacement validates request', r.status === 400 && r.body.errors.request, JSON.stringify(r.body));

  console.log('\n== SAVE / HISTORY ==');
  r = await api('/plans', { method: 'POST', headers: auth, body: JSON.stringify({ name: 'Student Week', plan, preferences: { ...form, allergies: ['peanuts'], dislikes: ['mushrooms'], ingredients: ['rice','eggs','spinach'] } }) });
  check('save plan', r.status === 201 && r.body.plan.id > 0, JSON.stringify(r.body).slice(0, 200));
  const savedId = r.body.plan.id;
  const grocery = r.body.grocery || { categories: r.body.grocery };

  r = await api('/plans', { method: 'POST', headers: auth, body: JSON.stringify({ plan: { days: [] }, preferences: {} }) });
  check('save rejects empty plan', r.status === 400);

  r = await api('/plans', { headers: auth });
  check('list plans', r.status === 200 && r.body.plans.length === 1, JSON.stringify(r.body).slice(0, 200));

  r = await api('/plans/' + savedId, { headers: auth });
  check('get plan by id', r.status === 200 && r.body.plan.name === 'Student Week');
  check('saved plan keeps structure', r.body.plan.plan.days.length === 3);

  r = await api('/plans/999999', { headers: auth });
  check('missing plan returns 404', r.status === 404);

  r = await api('/plans', { method: 'POST', headers: auth, body: JSON.stringify({ name: 'Second', plan, preferences: { goal: 'Build muscle', dietary: 'High protein', days: 3, allergies: [], dislikes: [], ingredients: [] } }) });
  check('save second plan', r.status === 201);

  console.log('\n== CROSS-USER ISOLATION ==');
  const otherEmail = 'other' + Date.now() + '@example.com';
  let ro = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Other', email: otherEmail, password: 'secret123' }) });
  const otherCookie = ro.cookie.split(';')[0];
  ro = await api('/plans/' + savedId, { headers: { Cookie: otherCookie } });
  check('other user cannot read my plan', ro.status === 404, JSON.stringify(ro.body));
  ro = await api('/plans', { headers: { Cookie: otherCookie } });
  check('other user sees empty history', ro.status === 200 && ro.body.plans.length === 0, JSON.stringify(ro.body).slice(0,150));

  console.log('\n== LOGOUT ==');
  r = await api('/auth/logout', { method: 'POST', headers: auth });
  check('logout succeeds', r.status === 200 && /nutriplan_token=;/.test(r.cookie || ''), r.cookie);

  console.log('\n== HEALTH / OPTIONS / 404 ==');
  r = await api('/health');
  check('health endpoint', r.status === 200 && r.body.status === 'ok');
  r = await api('/ai/status');
  check('ai status endpoint', r.status === 200 && r.body.ai.mode, JSON.stringify(r.body));
  r = await api('/plans/options', { headers: auth });
  check('options endpoint', r.status === 200 && r.body.options.goals.length > 0);
  r = await api('/does-not-exist', { headers: auth });
  check('unknown route 404 json', r.status === 404 && r.body.success === false);

  console.log('\n== NO STACK TRACES ==');
  r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: 'x'.repeat(500) }) });
  const leak = /\bat\s+\w+\s*\(|\.js:\d+|Error:|node_modules/.test(JSON.stringify(r.body));
  check('no stack trace leaked', !leak && r.status < 500, JSON.stringify(r.body).slice(0,150));

  console.log('\n--------------------------------------');
  console.log('PASS: ' + pass + '   FAIL: ' + fail);
  console.log('--------------------------------------');
  process.exit(fail > 0 ? 1 : 0);
})();
