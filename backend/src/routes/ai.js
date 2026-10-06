'use strict';

/**
 * AI-powered endpoints. All of them require a signed-in user and all of them
 * fall back to the built-in demo planner when no AI API key is configured.
 *
 *   GET  /api/ai/status              is the app using the real AI service?
 *   POST /api/ai/meal-plan           generate a meal plan
 *   POST /api/ai/grocery-list        build a grocery list from a plan
 *   POST /api/ai/meal-replacement    replace a single meal
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const aiService = require('../services/aiService');
const ApiError = require('../middleware/ApiError');
const { requireAuth } = require('../middleware/auth');
const { validateMealPlanForm, validateReplacement } = require('../middleware/validate');

const router = express.Router();

// Generation is the most expensive operation, so it gets its own gentle limit.
const generationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'You have made a lot of requests. Please wait a moment and try again.' },
});

// GET /api/ai/status
router.get('/status', (req, res) => {
  res.json({ success: true, ai: aiService.getStatus() });
});

// POST /api/ai/meal-plan
router.post('/meal-plan', requireAuth, generationLimiter, async (req, res, next) => {
  try {
    const form = validateMealPlanForm(req.body);
    const plan = await aiService.generateMealPlan(form);

    res.json({
      success: true,
      message:
        plan.mode === 'ai'
          ? 'Your meal plan is ready.'
          : 'Your meal plan is ready (demo mode).',
      mode: plan.mode,
      form,
      plan: { summary: plan.summary, days: plan.days },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/grocery-list
router.post('/grocery-list', requireAuth, generationLimiter, async (req, res, next) => {
  try {
    const plan = req.body?.plan;
    if (!plan || !Array.isArray(plan.days) || plan.days.length === 0) {
      throw ApiError.badRequest('There is no meal plan yet. Please generate a plan first.');
    }

    const grocery = await aiService.generateGroceryList(plan);
    res.json({
      success: true,
      message: 'Your grocery list is ready.',
      mode: grocery.mode,
      grocery: { categories: grocery.categories },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/ai/meal-replacement
router.post('/meal-replacement', requireAuth, generationLimiter, async (req, res, next) => {
  try {
    const { request, mealSlot, originalMeal } = validateReplacement(req.body);
    // Preferences are optional here; when present they keep the swap on diet.
    const form = req.body?.form && typeof req.body.form === 'object' ? req.body.form : null;

    const replacement = await aiService.generateReplacement({ request, mealSlot, originalMeal, form });

    res.json({
      success: true,
      message: 'Here is a replacement meal you can try.',
      mode: replacement.mode,
      replacement: {
        title: replacement.title,
        description: replacement.description,
        timeMinutes: replacement.timeMinutes,
        ingredients: replacement.ingredients,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
