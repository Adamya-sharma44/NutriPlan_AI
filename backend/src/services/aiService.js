'use strict';

/**
 * AI SERVICE
 * ---------------------------------------------------------------------------
 * This is the ONLY file that talks to an external AI provider. It supports any
 * OpenAI-compatible chat-completions endpoint (OpenAI, Groq, OpenRouter, a
 * local Ollama server, etc.) through AI_BASE_URL + AI_API_KEY + AI_MODEL.
 *
 * DESIGN RULE: the real integration and the demo fallback are completely
 * separate functions. `isRealAiEnabled()` reports which one will be used, and
 * every response includes `mode: "ai" | "demo"` so the UI can be honest about
 * it. If the real call fails for any reason we fall back to demo mode rather
 * than showing the user a broken page.
 *
 * Note: this service produces everyday meal suggestions only. It is not a
 * medical service and the prompts forbid medical or dietary-treatment claims.
 */

const config = require('../config');
const demo = require('./demoPlanner');
const { slotLabel } = require('./demoPlanner');

/** True when a real API key is configured and the provider is enabled. */
function isRealAiEnabled() {
  return config.ai.provider === 'openai' && Boolean(config.ai.apiKey) && !config.ai.demoMode;
}

/** Report why demo mode is active, so the user sees a clear explanation. */
function demoReason() {
  if (config.ai.demoMode) return 'Demo mode was turned on with AI_DEMO_MODE=true in the .env file.';
  if (config.ai.provider !== 'openai') return `AI provider "${config.ai.provider}" is not enabled.`;
  if (!config.ai.apiKey) return 'No AI_API_KEY is configured, so NutriPlan AI is running in demo mode.';
  return 'Demo mode is active.';
}

const SAFETY_RULES = `
Important rules for your answer:
- This is everyday meal planning for a student or general user. Never make medical, clinical, nutritional-therapy, or disease-treatment claims. Do not suggest that a food cures, prevents or treats any health condition.
- Do not give calorie counts, macro numbers, or nutritional prescriptions.
- If a request involves an allergy, treat that ingredient as strictly excluded and do not mention it as an alternative.
- Keep every meal description to one short, friendly sentence.
`.trim();

/** Build the user message describing exactly what the user asked for. */
function buildPlanPrompt(form) {
  const lines = [
    `Create a ${form.days}-day meal plan with ${form.mealsPerDay} meal(s) per day.`,
    `Goal: ${form.goal}.`,
    `Dietary preference: ${form.dietary}.`,
    `Cooking time per meal: ${form.cookingTime}.`,
    `Allergies to exclude completely: ${form.allergies.length ? form.allergies.join(', ') : 'none'}.`,
    `Foods the user dislikes: ${form.dislikes.length ? form.dislikes.join(', ') : 'none'}.`,
    `Ingredients the user already has: ${form.ingredients.length ? form.ingredients.join(', ') : 'none'}.`,
  ];
  if (form.notes) lines.push(`Additional notes from the user: ${form.notes}`);
  else lines.push('The user did not add any extra notes.');

  lines.push(
    'Prefer using the ingredients the user already has where they fit the dietary preference and allergies.'
  );

  return lines.join('\n');
}

const PLAN_SCHEMA = `{
  "summary": "one short sentence describing the plan",
  "days": [
    {
      "day": 1,
      "dayName": "Monday",
      "meals": [
        {
          "slot": "breakfast",
          "title": "short meal name",
          "description": "one friendly sentence",
          "timeMinutes": 10,
          "ingredients": [{ "name": "Rolled oats", "category": "Grains" }]
        }
      ]
    }
  ]
}`;

const GROCERY_SCHEMA = `{
  "categories": [
    { "category": "Produce", "items": ["Banana", "Tomatoes"] }
  ]
}`;

/**
 * Call an OpenAI-compatible chat completions endpoint.
 * Uses the global fetch available in Node 18+, so no extra HTTP library is needed.
 */
async function callChatApi(systemPrompt, userPrompt) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.ai.timeoutMs);

  try {
    const response = await fetch(`${config.ai.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.ai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.ai.model,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      // Include the upstream status in the log only — never in the user message.
      const detail = await response.text().catch(() => '');
      throw new Error(`AI provider responded ${response.status}: ${detail.slice(0, 300)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI provider returned an empty response.');

    return JSON.parse(content);
  } finally {
    clearTimeout(timer);
  }
}

/** The five grocery categories the application groups items into. */
const CATEGORIES = ['Produce', 'Grains', 'Protein', 'Dairy', 'Other'];

/**
 * Force the AI response into the exact shape the frontend expects.
 * Being strict here means a slightly odd model response can never break the UI.
 */
function normalisePlan(parsed, form) {
  if (!parsed || !Array.isArray(parsed.days) || parsed.days.length === 0) {
    throw new Error('AI response did not contain any days.');
  }

  const slots = form.mealsPerDay >= 3 ? ['breakfast', 'lunch', 'dinner'] : form.mealsPerDay === 2 ? ['lunch', 'dinner'] : ['lunch'];
  if (form.mealsPerDay >= 4) slots.splice(1, 0, 'snack');

  const days = [];
  for (let d = 0; d < form.days; d += 1) {
    const source = parsed.days[d] || {};
    const sourceMeals = Array.isArray(source.meals) ? source.meals : [];

    const meals = slots.map((slot, index) => {
      const meal = sourceMeals[index] || sourceMeals.find((m) => m.slot === slot) || {};
      const title = String(meal.title || 'Simple meal').slice(0, 120);
      const description = String(meal.description || meal.title || 'A simple, balanced meal.').slice(0, 300);
      const timeMinutes = Number.isFinite(Number(meal.timeMinutes)) ? Number(meal.timeMinutes) : 30;

      const ingredients = (Array.isArray(meal.ingredients) ? meal.ingredients : [])
        .map((ingredient) => ({
          name: String(ingredient.name || ingredient).slice(0, 80),
          category: CATEGORIES.includes(ingredient.category) ? ingredient.category : 'Other',
        }))
        .filter((ingredient) => ingredient.name)
        .slice(0, 12);

      return {
        slot,
        title,
        description,
        timeMinutes,
        ingredients,
        key: `d${d}-${slot}-${title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };
    });

    days.push({
      day: d + 1,
      dayName: String(source.dayName || `Day ${d + 1}`).slice(0, 30),
      meals,
    });
  }

  return { mode: 'ai', summary: String(parsed.summary || '').slice(0, 300), days };
}

/** Normalise an AI grocery list into the five known categories. */
function normaliseGrocery(parsed) {
  const buckets = new Map(CATEGORIES.map((category) => [category, new Set()]));

  (Array.isArray(parsed?.categories) ? parsed.categories : []).forEach((group) => {
    const category = CATEGORIES.includes(group.category) ? group.category : 'Other';
    (Array.isArray(group.items) ? group.items : []).forEach((item) => {
      const name = String(item).trim();
      if (name) buckets.get(category).add(name);
    });
  });

  return [...buckets.entries()]
    .filter(([, items]) => items.size > 0)
    .map(([category, items]) => ({ category, items: [...items].sort() }));
}

/**
 * Build the ingredient prompt used for grocery list generation.
 * It is derived from the plan itself so the list always matches the meals.
 */
function buildGroceryPrompt(plan) {
  const lines = plan.days.map((day) => {
    const meals = day.meals
      .map((meal) => `${slotLabel(meal.slot)}: ${meal.title} (${meal.ingredients.map((i) => i.name).join(', ')})`)
      .join(' | ');
    return `Day ${day.day}: ${meals}`;
  });

  return `Here is a meal plan:\n${lines.join('\n')}\n\nBuild a shopping list. Combine duplicates, remove anything repeated.`;
}

/**
 * GENERATE A MEAL PLAN
 * Tries the real AI service first; falls back to the local demo planner.
 */
async function generateMealPlan(form) {
  if (isRealAiEnabled()) {
    try {
      const systemPrompt =
        `You are NutriPlan AI, a friendly meal-planning assistant. ` +
        `You reply with valid JSON only, no markdown fences and no commentary. ` +
        `Return this exact structure: ${PLAN_SCHEMA}. ` +
        `Slot names must be one of: breakfast, snack, lunch, dinner. ` +
        `Each day must have exactly the requested number of meals. ` +
        SAFETY_RULES;

      const parsed = await callChatApi(systemPrompt, buildPlanPrompt(form));
      const plan = normalisePlan(parsed, form);

      // The demo summary builder produces a consistent subtitle either way.
      return { ...plan, summary: plan.summary || demo.buildSummary(form, plan) };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[ai] Meal plan generation fell back to demo mode:', error.message);
    }
  }

  const plan = demo.generateDemoPlan(form);
  return { ...plan, summary: demo.buildSummary(form, plan) };
}

/** GENERATE A GROCERY LIST from an existing plan. */
async function generateGroceryList(plan) {
  if (isRealAiEnabled()) {
    try {
      const systemPrompt =
        `You are NutriPlan AI. You reply with valid JSON only, no markdown fences. ` +
        `Group shopping items into exactly these categories: ${CATEGORIES.join(', ')}. ` +
        `Return this exact structure: ${GROCERY_SCHEMA}. ` +
        `Combine duplicates and keep the list practical for one shopping trip. ` +
        SAFETY_RULES;

      const parsed = await callChatApi(systemPrompt, buildGroceryPrompt(plan));
      const categories = normaliseGrocery(parsed);
      if (categories.length > 0) return { mode: 'ai', categories };
      throw new Error('AI returned an empty grocery list.');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[ai] Grocery list fell back to demo mode:', error.message);
    }
  }

  return { mode: 'demo', categories: demo.buildDemoGrocery(plan) };
}

/** GENERATE A REPLACEMENT MEAL. */
async function generateReplacement({ request, mealSlot, originalMeal, form }) {
  if (isRealAiEnabled()) {
    try {
      const systemPrompt =
        `You are NutriPlan AI, a friendly meal-planning assistant. You reply with valid JSON only. ` +
        `Suggest one replacement meal as: { "title": "...", "description": "...", "timeMinutes": 10, ` +
        `"ingredients": [{ "name": "...", "category": "Produce|Grains|Protein|Dairy|Other" }] }. ` +
        `The replacement must follow the user's allergies and dietary preference. ` +
        SAFETY_RULES;

      const userPrompt =
        `The user is replacing the ${slotLabel(mealSlot || 'lunch')} "${originalMeal}". ` +
        `Their request: ${request}.` +
        (form ? ` Dietary preference: ${form.dietary}. Allergies: ${form.allergies?.join(', ') || 'none'}.` : '');

      const parsed = await callChatApi(systemPrompt, userPrompt);
      const ingredients = (Array.isArray(parsed?.ingredients) ? parsed.ingredients : [])
        .map((ingredient) => ({
          name: String(ingredient.name || ingredient).slice(0, 80),
          category: CATEGORIES.includes(ingredient.category) ? ingredient.category : 'Other',
        }))
        .filter((ingredient) => ingredient.name);

      return {
        mode: 'ai',
        title: String(parsed?.title || 'Replacement meal').slice(0, 120),
        description: String(parsed?.description || 'A simple alternative meal.').slice(0, 300),
        timeMinutes: Number.isFinite(Number(parsed?.timeMinutes)) ? Number(parsed.timeMinutes) : 20,
        ingredients,
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[ai] Meal replacement fell back to demo mode:', error.message);
    }
  }

  return { mode: 'demo', ...demo.buildDemoReplacement({ request, originalMeal }) };
}

/** Expose status so the frontend can show a "demo mode" banner. */
function getStatus() {
  return {
    mode: isRealAiEnabled() ? 'ai' : 'demo',
    model: isRealAiEnabled() ? config.ai.model : 'Built-in demo planner',
    reason: isRealAiEnabled() ? null : demoReason(),
  };
}

module.exports = {
  isRealAiEnabled,
  getStatus,
  generateMealPlan,
  generateGroceryList,
  generateReplacement,
};
