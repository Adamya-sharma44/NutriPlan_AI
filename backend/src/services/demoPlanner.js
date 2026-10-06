'use strict';

/**
 * DEMO MODE PLAN BUILDER
 * ---------------------------------------------------------------------------
 * Turns the user's form input into a complete meal plan using the local meal
 * library. It is the fallback used when the real AI service is unavailable, so
 * the application is always fully demonstrable.
 *
 * It is kept intentionally simple: filter the library, rotate through the
 * matching meals, and fill the requested number of days and meals per day.
 */

const library = require('./mealLibrary');

// Cooking-time text -> maximum minutes allowed for a single meal.
const TIME_LIMITS = {
  'Under 15 minutes': 15,
  'Under 30 minutes': 30,
  'Under 45 minutes': 45,
  'No limit': Infinity,
};

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Flatten a meal's ingredients into a single lowercase string for filtering. */
function ingredientText(meal) {
  return [meal.title, meal.description, ...meal.ingredients.map((i) => i.name)]
    .join(' ')
    .toLowerCase();
}

/**
 * A meal is safe if it does not mention any allergy in its title,
 * description or ingredients. The check is a simple keyword match, which is
 * the right level of complexity for this project.
 */
function matchesAllergies(meal, allergies) {
  const text = ingredientText(meal);
  return !allergies.some((allergy) => text.includes(String(allergy).toLowerCase()));
}

/** A meal is acceptable if the user has not said they dislike anything in it. */
function matchesDislikes(meal, dislikes) {
  const text = ingredientText(meal);
  return !dislikes.some((dislike) => text.includes(String(dislike).toLowerCase()));
}

function matchesDiet(meal, dietary) {
  if (!dietary || dietary === 'No restrictions') return true;
  return meal.diets.includes(dietary);
}

/** Apply every filter in one place so each slot behaves consistently. */
function filterMeals(meals, { dietary, allergies, dislikes, timeLimit }) {
  const filtered = meals.filter(
    (meal) =>
      matchesDiet(meal, dietary) &&
      matchesAllergies(meal, allergies) &&
      matchesDislikes(meal, dislikes) &&
      meal.timeMinutes <= timeLimit
  );

  // The normal case: the filters left at least one suitable meal.
  if (filtered.length > 0) return filtered;

  // If the filters are too strict, relax the cooking-time limit before giving up
  // so the user still receives a usable plan.
  if (filtered.length === 0) {
    const relaxed = meals.filter(
      (meal) => matchesDiet(meal, dietary) && matchesAllergies(meal, allergies) && matchesDislikes(meal, dislikes)
    );
    if (relaxed.length > 0) return relaxed;
  }

  // Finally fall back to the whole category so a plan is never returned empty.
  return meals;
}

/** Copy a library meal into the shape the frontend renders. */
function toMeal(meal, slot, dayIndex) {
  return {
    slot,
    title: meal.title,
    description: meal.description,
    timeMinutes: meal.timeMinutes,
    // Ingredients drive the grocery list.
    ingredients: meal.ingredients.map((i) => ({ name: i.name, category: i.category })),
    // A stable key so React can track edits and replacement swaps.
    key: `d${dayIndex}-${slot}-${meal.title}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  };
}

/**
 * Build the slot order for the requested number of meals per day.
 * 1 -> just lunch, 2 -> lunch + dinner, 3 -> breakfast/lunch/dinner,
 * 4 and 5 add snacks around the main meals.
 */
function buildSlots(mealsPerDay) {
  if (mealsPerDay === 1) return ['lunch'];
  if (mealsPerDay === 2) return ['lunch', 'dinner'];
  if (mealsPerDay === 4) return ['breakfast', 'snack', 'lunch', 'dinner'];
  if (mealsPerDay === 5) return ['breakfast', 'snack', 'lunch', 'snack 2', 'dinner'];
  return ['breakfast', 'lunch', 'dinner'];
}

const SLOT_TITLE = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  'snack 2': 'Afternoon Snack',
};

/** Human-friendly label for a slot key. */
function slotLabel(slot) {
  return SLOT_TITLE[slot] || 'Meal';
}

/**
 * Generate a full plan in demo mode.
 * Returns the same object shape as the real AI service, so the frontend and
 * saved-plan records work identically in both modes.
 */
function generateDemoPlan(form) {
  const timeLimit = TIME_LIMITS[form.cookingTime] ?? Infinity;
  const filterInput = {
    dietary: form.dietary,
    allergies: form.allergies || [],
    dislikes: form.dislikes || [],
    timeLimit,
  };

  const breakfasts = filterMeals(library.BREAKFASTS, filterInput);
  const lunches = filterMeals(library.LUNCHES, filterInput);
  const dinners = filterMeals(library.DINNERS, filterInput);
  const snacks = filterMeals(library.SNACKS, filterInput);

  const slots = buildSlots(form.mealsPerDay);
  const counters = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
  const snackMeals = [...snacks, ...snacks]; // allows two snacks on a 5-meal day

  const days = [];
  for (let d = 0; d < form.days; d += 1) {
    const meals = slots.map((slot) => {
      const base = slot === 'snack' || slot === 'snack 2' ? 'snack' : slot;
      const pool = base === 'breakfast' ? breakfasts : base === 'lunch' ? lunches : base === 'dinner' ? dinners : snackMeals;
      const index = counters[base];
      counters[base] += 1;
      return toMeal(pool[index % pool.length], slot, d);
    });

    days.push({
      day: d + 1,
      dayName: DAY_NAMES[d % DAY_NAMES.length],
      meals,
    });
  }

  return {
    mode: 'demo',
    days,
  };
}

/** Build a short human-readable summary line for a plan. */
function buildSummary(form, plan) {
  const parts = [
    `${plan.days.length}-day plan`,
    form.dietary.toLowerCase(),
    `${form.mealsPerDay} meal${form.mealsPerDay === 1 ? '' : 's'} per day`,
    form.cookingTime.toLowerCase(),
  ];
  if (form.goal) parts.unshift(form.goal);
  return parts.join(' · ');
}

/** Build a demo grocery list from a generated plan. */
function buildDemoGrocery(plan) {
  const buckets = { Produce: new Set(), Grains: new Set(), Protein: new Set(), Dairy: new Set(), Other: new Set() };

  plan.days.forEach((day) => {
    day.meals.forEach((meal) => {
      (meal.ingredients || []).forEach((ingredient) => {
        const bucket = buckets[ingredient.category] || buckets.Other;
        bucket.add(ingredient.name);
      });
    });
  });

  return Object.entries(buckets)
    .filter(([, items]) => items.size > 0)
    .map(([category, items]) => ({ category, items: [...items].sort() }));
}

/** Build a demo replacement meal. */
function buildDemoReplacement({ request, originalMeal }) {
  // Rotate through the replacement library so repeated clicks feel varied.
  const seed = String(request || '').length + String(originalMeal || '').length;
  const template = library.REPLACEMENTS[seed % library.REPLACEMENTS.length];

  return {
    mode: 'demo',
    title: template.title,
    description: template.description,
    timeMinutes: template.timeMinutes,
    ingredients: template.ingredients.map((i) => ({ name: i.name, category: i.category })),
  };
}

module.exports = {
  generateDemoPlan,
  buildDemoGrocery,
  buildDemoReplacement,
  buildSummary,
  slotLabel,
};
