'use strict';

const ApiError = require('./ApiError');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Trim a value that may be missing entirely. */
function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/** Turn a comma or newline separated list into a clean array. */
function cleanList(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  return clean(value)
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Parse a whole number and fall back when it is not valid. */
function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Validate registration input and return cleaned values plus a map of
 * field-level error messages the frontend can display inline.
 */
function validateRegistration(body = {}) {
  const errors = {};
  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';

  if (!name) errors.name = 'Please enter your name.';
  else if (name.length > 80) errors.name = 'Your name must be 80 characters or fewer.';

  if (!email) errors.email = 'Please enter your email address.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Please enter a valid email address.';

  if (!password) errors.password = 'Please choose a password.';
  else if (password.length < 6)
    errors.password = 'Your password must be at least 6 characters long.';
  else if (password.length > 200)
    errors.password = 'Your password must be 200 characters or fewer.';

  return { errors, value: { name, email, password } };
}

/** Validate login input. */
function validateLogin(body = {}) {
  const errors = {};
  const email = clean(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email) errors.email = 'Please enter your email address.';
  if (!password) errors.password = 'Please enter your password.';

  return { errors, value: { email, password } };
}

const DIET_OPTIONS = [
  'No restrictions',
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Keto',
  'Low carb',
  'High protein',
  'Dairy free',
  'Gluten free',
];

const GOAL_OPTIONS = [
  'Lose weight',
  'Maintain weight',
  'Build muscle',
  'Save time and money',
  'Eat healthier',
  'Manage a busy schedule',
];

const TIME_OPTIONS = [
  'Under 15 minutes',
  'Under 30 minutes',
  'Under 45 minutes',
  'No limit',
];

/**
 * Validate the meal plan form. Returns cleaned values and field errors.
 */
function validateMealPlanForm(body = {}) {
  const errors = {};
  const days = toInt(body.days, 0);
  const mealsPerDay = toInt(body.mealsPerDay, 0);

  const goal = clean(body.goal);
  const dietary = clean(body.dietary);
  const cookingTime = clean(body.cookingTime) || 'Under 30 minutes';
  const allergies = cleanList(body.allergies);
  const dislikes = cleanList(body.dislikes);
  const ingredients = cleanList(body.ingredients);
  const notes = clean(body.notes).slice(0, 1000);

  if (!goal) errors.goal = 'Please choose a goal.';
  else if (!GOAL_OPTIONS.includes(goal)) errors.goal = 'Please choose a goal from the list.';

  if (!dietary) errors.dietary = 'Please choose a dietary preference.';
  else if (!DIET_OPTIONS.includes(dietary)) errors.dietary = 'Please choose a dietary preference from the list.';

  if (!Number.isFinite(days) || days < 1 || days > 14)
    errors.days = 'Number of days must be between 1 and 14.';
  if (!Number.isFinite(mealsPerDay) || mealsPerDay < 1 || mealsPerDay > 5)
    errors.mealsPerDay = 'Meals per day must be between 1 and 5.';

  if (!TIME_OPTIONS.includes(cookingTime))
    errors.cookingTime = 'Please choose a cooking time from the list.';

  if (allergies.length > 20) errors.allergies = 'Please list 20 allergies or fewer.';
  if (dislikes.length > 30) errors.dislikes = 'Please list 30 foods or fewer.';
  if (ingredients.length > 50) errors.ingredients = 'Please list 50 ingredients or fewer.';

  if (Object.keys(errors).length > 0) {
    throw ApiError.badRequest('Please check the highlighted fields and try again.', errors);
  }

  return {
    goal,
    dietary,
    allergies,
    dislikes,
    ingredients,
    days,
    mealsPerDay,
    cookingTime,
    notes,
  };
}

/** Validate the meal replacement request. */
function validateReplacement(body = {}) {
  const errors = {};
  const request = clean(body.request);
  const mealSlot = clean(body.mealSlot);
  const originalMeal = clean(body.originalMeal);

  if (!originalMeal) errors.originalMeal = 'The original meal is missing. Please generate a plan first.';
  if (!request) errors.request = 'Please describe what you want in the replacement meal.';
  else if (request.length > 300) errors.request = 'Please keep your request under 300 characters.';

  if (Object.keys(errors).length > 0) {
    throw ApiError.badRequest('Please check the highlighted fields and try again.', errors);
  }

  return { request, mealSlot, originalMeal };
}

module.exports = {
  clean,
  cleanList,
  toInt,
  validateRegistration,
  validateLogin,
  validateMealPlanForm,
  validateReplacement,
  DIET_OPTIONS,
  GOAL_OPTIONS,
  TIME_OPTIONS,
};
