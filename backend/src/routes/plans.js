'use strict';

/**
 * Saved meal plan storage.
 *   POST   /api/plans            save a generated plan
 *   GET    /api/plans            list the signed-in user's plans (history)
 *   GET    /api/plans/:id        load one plan
 *   DELETE /api/plans/:id        remove a plan
 *   GET    /api/plans/options    dropdown values for the meal plan form
 */

const express = require('express');
const { all, get, run, parseJson } = require('../db/helpers');
const ApiError = require('../middleware/ApiError');
const { requireAuth } = require('../middleware/auth');
const { clean, DIET_OPTIONS, GOAL_OPTIONS, TIME_OPTIONS } = require('../middleware/validate');

const router = express.Router();

/** Convert a database row into the object the frontend consumes. */
function toPlanDto(row) {
  return {
    id: row.id,
    name: row.name,
    goal: row.goal,
    preferences: parseJson(row.preferences),
    plan: parseJson(row.plan),
    grocery: parseJson(row.grocery),
    createdAt: row.created_at,
  };
}

/** Build a short automatic plan name, e.g. "Vegetarian · 7 days". */
function defaultPlanName(form) {
  return `${form.dietary} · ${form.days} day${form.days === 1 ? '' : 's'}`;
}

// GET /api/plans/options — keeps the form's dropdowns in sync with the backend.
router.get('/options', requireAuth, (req, res) => {
  res.json({
    success: true,
    options: {
      goals: GOAL_OPTIONS,
      diets: DIET_OPTIONS,
      cookingTimes: TIME_OPTIONS,
      maxDays: 14,
      maxMealsPerDay: 5,
    },
  });
});

// POST /api/plans — save a generated plan
router.post('/', requireAuth, (req, res, next) => {
  try {
    const name = clean(req.body?.name);
    const plan = req.body?.plan;
    const preferences = req.body?.preferences;

    if (!plan || !Array.isArray(plan.days) || plan.days.length === 0) {
      throw ApiError.badRequest('There is no meal plan to save. Please generate a plan first.');
    }
    if (!preferences || typeof preferences !== 'object') {
      throw ApiError.badRequest('Meal plan preferences are missing. Please generate a plan first.');
    }

    const form = {
      goal: clean(preferences.goal) || null,
      dietary: clean(preferences.dietary) || 'No restrictions',
      days: Number(preferences.days) || plan.days.length,
    };

    const result = run(
      `INSERT INTO meal_plans (user_id, name, goal, preferences, plan, grocery)
       VALUES (@userId, @name, @goal, @preferences, @plan, @grocery)`,
      {
        userId: req.user.id,
        name: name || defaultPlanName(form),
        goal: form.goal,
        preferences: JSON.stringify(preferences),
        plan: JSON.stringify(plan),
        grocery: req.body.grocery ? JSON.stringify(req.body.grocery) : null,
      }
    );

    const row = get('SELECT * FROM meal_plans WHERE id = @id', { id: result.lastInsertRowid });
    res.status(201).json({ success: true, message: 'Meal plan saved.', plan: toPlanDto(row) });
  } catch (err) {
    next(err);
  }
});

// GET /api/plans — meal plan history, newest first
router.get('/', requireAuth, (req, res) => {
  const rows = all(
    'SELECT * FROM meal_plans WHERE user_id = @userId ORDER BY datetime(created_at) DESC, id DESC',
    { userId: req.user.id }
  );
  res.json({ success: true, plans: rows.map(toPlanDto) });
});

// GET /api/plans/:id
router.get('/:id', requireAuth, (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) throw ApiError.notFound('That meal plan could not be found.');

    // The user_id check means one user can never read another user's plan.
    const row = get('SELECT * FROM meal_plans WHERE id = @id AND user_id = @userId', {
      id,
      userId: req.user.id,
    });
    if (!row) throw ApiError.notFound('That meal plan could not be found.');

    res.json({ success: true, plan: toPlanDto(row) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/plans/:id
router.delete('/:id', requireAuth, (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) throw ApiError.notFound('That meal plan could not be found.');

    const result = run('DELETE FROM meal_plans WHERE id = @id AND user_id = @userId', {
      id,
      userId: req.user.id,
    });
    if (result.changes === 0) throw ApiError.notFound('That meal plan could not be found.');

    res.json({ success: true, message: 'Meal plan deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
