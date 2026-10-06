/**
 * A very small fetch wrapper around the NutriPlan AI API.
 *
 * Every call sends the auth cookie, and every non-2xx response is converted into
 * a readable error object the pages can show directly. Network problems become a
 * friendly "could not reach the server" message rather than a raw exception.
 */

async function request(path, { method = 'GET', body } = {}) {
  let response;

  try {
    response = await fetch(`/api${path}`, {
      method,
      // The auth token lives in an httpOnly cookie, so credentials are required.
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw {
      message: 'We could not reach the NutriPlan AI server. Please check it is running and try again.',
      errors: null,
      status: 0,
    };
  }

  // 204 has no body; everything else should be JSON.
  if (response.status === 204) return { success: true };

  let data = null;
  try {
    data = await response.json();
  } catch {
    throw {
      message: 'The server sent an unexpected response. Please try again.',
      errors: null,
      status: response.status,
    };
  }

  if (!response.ok || data.success === false) {
    throw {
      message: data.message || 'Something went wrong. Please try again.',
      errors: data.errors || null,
      status: response.status,
    };
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // AI
  aiStatus: () => request('/ai/status'),
  generateMealPlan: (form) => request('/ai/meal-plan', { method: 'POST', body: form }),
  generateGroceryList: (plan) => request('/ai/grocery-list', { method: 'POST', body: { plan } }),
  generateReplacement: (payload) => request('/ai/meal-replacement', { method: 'POST', body: payload }),

  // Saved plans
  planOptions: () => request('/plans/options'),
  savePlan: (payload) => request('/plans', { method: 'POST', body: payload }),
  listPlans: () => request('/plans'),
  getPlan: (id) => request(`/plans/${id}`),
  deletePlan: (id) => request(`/plans/${id}`, { method: 'DELETE' }),
};
