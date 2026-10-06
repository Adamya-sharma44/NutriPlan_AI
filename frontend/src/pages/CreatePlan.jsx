import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Alert, FieldError, Loading } from '../components/UI';
import MealPlanView, { GroceryList } from '../components/MealPlanView';

// Fallback option lists, used if the /api/plans/options call is unavailable.
const FALLBACK_OPTIONS = {
  goals: [
    'Lose weight',
    'Maintain weight',
    'Build muscle',
    'Save time and money',
    'Eat healthier',
    'Manage a busy schedule',
  ],
  diets: [
    'No restrictions',
    'Vegetarian',
    'Vegan',
    'Pescatarian',
    'Keto',
    'Low carb',
    'High protein',
    'Dairy free',
    'Gluten free',
  ],
  cookingTimes: ['Under 15 minutes', 'Under 30 minutes', 'Under 45 minutes', 'No limit'],
};

const INITIAL_FORM = {
  goal: '',
  dietary: '',
  allergies: '',
  dislikes: '',
  ingredients: '',
  days: 3,
  mealsPerDay: 3,
  cookingTime: 'Under 30 minutes',
  notes: '',
};

/** One labelled form control, so every field gets consistent markup. */
function Field({ id, label, hint, error, children }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

/**
 * The meal plan form.
 *
 * It does three things when submitted, in order:
 *   1. asks the AI service to generate a plan
 *   2. lets the user build a grocery list
 *   3. lets the user save the plan to their history
 */
export default function CreatePlan() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [options, setOptions] = useState(FALLBACK_OPTIONS);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState(null);
  const [planMeta, setPlanMeta] = useState(null); // { form, mode }
  const [grocery, setGrocery] = useState(null);

  // Load the dropdown options from the backend so both sides stay in sync.
  useEffect(() => {
    let active = true;
    api
      .planOptions()
      .then((data) => active && setOptions(data.options))
      .catch(() => {
        /* the fallback lists above keep the form usable */
      });
    return () => {
      active = false;
    };
  }, []);

  function update(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  /** Required-field checks with friendly wording. */
  function validate() {
    const next = {};
    if (!form.goal) next.goal = 'Please choose a goal.';
    if (!form.dietary) next.dietary = 'Please choose a dietary preference.';

    const days = Number(form.days);
    if (!Number.isFinite(days) || days < 1 || days > 14) next.days = 'Choose between 1 and 14 days.';

    const meals = Number(form.mealsPerDay);
    if (!Number.isFinite(meals) || meals < 1 || meals > 5)
      next.mealsPerDay = 'Choose between 1 and 5 meals per day.';

    if (form.allergies.length > 300) next.allergies = 'Please keep this under 300 characters.';
    if (form.dislikes.length > 300) next.dislikes = 'Please keep this under 300 characters.';

    return next;
  }

  async function handleGenerate(event) {
    event.preventDefault();
    setMessage('');

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setMessage('Please check the highlighted fields and try again.');
      return;
    }

    setGenerating(true);
    setPlan(null);
    setGrocery(null);
    try {
      const data = await api.generateMealPlan({
        goal: form.goal,
        dietary: form.dietary,
        allergies: form.allergies,
        dislikes: form.dislikes,
        ingredients: form.ingredients,
        days: Number(form.days),
        mealsPerDay: Number(form.mealsPerDay),
        cookingTime: form.cookingTime,
        notes: form.notes,
      });

      setPlan(data.plan);
      setPlanMeta({ form: data.form, mode: data.mode });
      setMessage(data.message);
    } catch (error) {
      setErrors(error.errors || {});
      setMessage(error.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleGrocery() {
    if (!plan) return;
    try {
      const data = await api.generateGroceryList(plan);
      setGrocery(data.grocery);
    } catch (error) {
      setMessage(error.message);
    }
  }

  /** Swap an AI-generated replacement into the plan held on this page. */
  function handleMealReplaced(mealKey, replacement) {
    setPlan((current) => {
      if (!current) return current;
      return {
        ...current,
        days: current.days.map((day) => ({
          ...day,
          meals: day.meals.map((meal) =>
            meal.key === mealKey
              ? { ...meal, title: replacement.title, description: replacement.description, timeMinutes: replacement.timeMinutes, ingredients: replacement.ingredients }
              : meal
          ),
        })),
      };
    });
  }

  async function handleSave() {
    if (!plan || !planMeta) return;
    setSaving(true);
    try {
      const { form: savedForm } = planMeta;
      await api.savePlan({
        name: `${savedForm.dietary} · ${savedForm.days} day${savedForm.days === 1 ? '' : 's'}`,
        plan,
        grocery,
        preferences: savedForm,
      });
      setMessage('Meal plan saved. You can find it under My Meal Plans.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Create a meal plan</h1>
          <p className="page__subtitle">
            Tell us about your preferences and NutriPlan AI will build a plan around them.
          </p>
        </div>
      </div>

      <div className="planner">
        <form className="card planner__form" onSubmit={handleGenerate} noValidate>
          <h2 className="section__title section__title--sm">Your preferences</h2>

          {message && (
            <Alert
              type={errors && Object.keys(errors).length > 0 ? 'error' : 'success'}
              onDismiss={() => setMessage('')}
            >
              {message}
            </Alert>
          )}

          <Field id="goal" label="Goal" error={errors.goal} hint="What are you planning towards?">
            <select
              id="goal"
              className="input"
              value={form.goal}
              onChange={update('goal')}
              aria-invalid={Boolean(errors.goal)}
              aria-describedby={errors.goal ? 'goal-error' : 'goal-hint'}
            >
              <option value="">Choose a goal…</option>
              {options.goals.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </Field>

          <Field id="dietary" label="Dietary preference" error={errors.dietary}>
            <select
              id="dietary"
              className="input"
              value={form.dietary}
              onChange={update('dietary')}
              aria-invalid={Boolean(errors.dietary)}
              aria-describedby={errors.dietary ? 'dietary-error' : undefined}
            >
              <option value="">Choose a diet…</option>
              {options.diets.map((diet) => (
                <option key={diet} value={diet}>
                  {diet}
                </option>
              ))}
            </select>
          </Field>

          <Field
            id="allergies"
            label="Allergies"
            error={errors.allergies}
            hint="Separate with commas. These are completely excluded from your plan."
          >
            <input
              id="allergies"
              className="input"
              type="text"
              placeholder="e.g. peanuts, shellfish"
              value={form.allergies}
              onChange={update('allergies')}
              aria-invalid={Boolean(errors.allergies)}
              aria-describedby={errors.allergies ? 'allergies-error' : 'allergies-hint'}
            />
          </Field>

          <Field
            id="dislikes"
            label="Foods you dislike"
            error={errors.dislikes}
            hint="Separate with commas. We will avoid these too."
          >
            <input
              id="dislikes"
              className="input"
              type="text"
              placeholder="e.g. mushrooms, olives"
              value={form.dislikes}
              onChange={update('dislikes')}
              aria-invalid={Boolean(errors.dislikes)}
              aria-describedby={errors.dislikes ? 'dislikes-error' : 'dislikes-hint'}
            />
          </Field>

          <Field
            id="ingredients"
            label="Ingredients you already have"
            hint="Comma separated. We will use as many of these as we can."
          >
            <textarea
              id="ingredients"
              className="input textarea"
              rows={3}
              placeholder="e.g. rice, eggs, spinach, chicken breast"
              value={form.ingredients}
              onChange={update('ingredients')}
              aria-describedby="ingredients-hint"
            />
          </Field>

          <div className="field-row">
            <Field id="days" label="Number of days" error={errors.days}>
              <input
                id="days"
                className="input"
                type="number"
                min="1"
                max="14"
                value={form.days}
                onChange={update('days')}
                aria-invalid={Boolean(errors.days)}
                aria-describedby={errors.days ? 'days-error' : undefined}
              />
            </Field>

            <Field id="mealsPerDay" label="Meals per day" error={errors.mealsPerDay}>
              <input
                id="mealsPerDay"
                className="input"
                type="number"
                min="1"
                max="5"
                value={form.mealsPerDay}
                onChange={update('mealsPerDay')}
                aria-invalid={Boolean(errors.mealsPerDay)}
                aria-describedby={errors.mealsPerDay ? 'mealsPerDay-error' : undefined}
              />
            </Field>
          </div>

          <Field id="cookingTime" label="Preferred cooking time" error={errors.cookingTime}>
            <select
              id="cookingTime"
              className="input"
              value={form.cookingTime}
              onChange={update('cookingTime')}
              aria-invalid={Boolean(errors.cookingTime)}
              aria-describedby={errors.cookingTime ? 'cookingTime-error' : undefined}
            >
              {options.cookingTimes.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </Field>

          <Field id="notes" label="Anything else? (optional)">
            <textarea
              id="notes"
              className="input textarea"
              rows={3}
              placeholder="e.g. I do not like fish on Mondays"
              value={form.notes}
              onChange={update('notes')}
            />
          </Field>

          <button type="submit" className="btn btn--primary btn--block" disabled={generating}>
            {generating ? 'Generating your plan…' : 'Generate meal plan'}
          </button>
        </form>

        <div className="planner__result">
          {generating ? (
            <div className="card">
              <Loading label="Building your meal plan, this can take a few seconds…" />
            </div>
          ) : plan ? (
            <>
              {planMeta?.mode === 'demo' && (
                <div className="card">
                  <p className="tag tag--info tag--block">
                    Generated with the built-in demo planner. Add an <code>AI_API_KEY</code> to
                    <code> backend/.env</code> for live AI results.
                  </p>
                </div>
              )}

              <MealPlanView
                plan={plan}
                form={planMeta?.form}
                onGenerateGrocery={handleGrocery}
                onMealReplaced={handleMealReplaced}
              />

              {grocery && <GroceryList grocery={grocery} />}

              <div className="card save-card">
                <h2 className="save-card__title">Happy with this plan?</h2>
                <p className="muted">Save it to your account so you can come back to it later.</p>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save this meal plan'}
                </button>
              </div>
            </>
          ) : (
            <div className="card placeholder">
              <h2 className="placeholder__title">Your plan will appear here</h2>
              <p className="muted">
                Fill in the form and select <strong>Generate meal plan</strong>. You will get a
                day-by-day plan with breakfast, lunch, dinner and snacks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
