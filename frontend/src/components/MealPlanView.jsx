import { useState } from 'react';
import { api } from '../api/client';
import { FieldError, Loading } from './UI';

const SLOT_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  'snack 2': 'Afternoon Snack',
};

const SLOT_ORDER = ['breakfast', 'snack', 'snack 2', 'lunch', 'dinner'];

/** Sort meals into breakfast -> snack -> lunch -> dinner regardless of input order. */
function orderedMeals(meals) {
  return [...meals].sort(
    (a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot)
  );
}

/** Quick-pick suggestions so the replacement feature needs no typing. */
const QUICK_REQUESTS = [
  'A vegetarian option that takes under 20 minutes',
  'Something high in protein',
  'A cheaper meal using the same ingredients',
  'A dairy-free option',
];

/**
 * Renders a generated meal plan.
 *
 * The parent owns the plan data so a replacement can be swapped in and the same
 * component works for a freshly generated plan and a saved one.
 */
export default function MealPlanView({ plan, onMealReplaced, form, onGenerateGrocery }) {
  const [openSlot, setOpenSlot] = useState(null); // key of the meal being replaced
  const [request, setRequest] = useState('');
  const [replacement, setReplacement] = useState({});
  const [requestError, setRequestError] = useState('');
  const [busy, setBusy] = useState(false);
  const [groceryBusy, setGroceryBusy] = useState(false);

  async function handleReplace(meal) {
    const text = request.trim();
    if (!text) {
      setRequestError('Please describe the kind of meal you would like instead.');
      return;
    }

    setBusy(true);
    setRequestError('');
    try {
      const data = await api.generateReplacement({
        request: text,
        mealSlot: meal.slot,
        originalMeal: meal.title,
        form,
      });
      setReplacement((current) => ({ ...current, [meal.key]: data.replacement }));
      if (onMealReplaced) onMealReplaced(meal.key, data.replacement);
      setOpenSlot(null);
      setRequest('');
    } catch (error) {
      setRequestError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGrocery() {
    setGroceryBusy(true);
    try {
      await onGenerateGrocery();
    } finally {
      setGroceryBusy(false);
    }
  }

  if (!plan || !Array.isArray(plan.days)) return null;

  return (
    <section className="plan" aria-label="Your meal plan">
      <header className="plan__header">
        <div>
          <h2 className="plan__title">Your meal plan</h2>
          {plan.summary && <p className="plan__summary">{plan.summary}</p>}
        </div>
        {onGenerateGrocery && (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleGrocery}
            disabled={groceryBusy}
          >
            {groceryBusy ? 'Building list…' : 'Generate grocery list'}
          </button>
        )}
      </header>

      {plan.days.map((day) => (
        <article key={day.day} className="card day-card">
          <h3 className="day-card__title">
            Day {day.day}
            {day.dayName ? <span className="day-card__name"> · {day.dayName}</span> : null}
          </h3>

          <ul className="meal-list">
            {orderedMeals(day.meals).map((meal) => {
              const swap = replacement[meal.key];
              const shown = swap || meal;
              const isOpen = openSlot === meal.key;

              return (
                <li key={meal.key} className="meal">
                  <div className="meal__main">
                    <p className="meal__slot">{SLOT_LABELS[meal.slot] || 'Meal'}</p>
                    <p className="meal__title">{shown.title}</p>
                    <p className="meal__description">{shown.description}</p>
                    <p className="meal__meta">
                      <span className="tag">{shown.timeMinutes} min</span>
                      {swap && <span className="tag tag--info">Replaced</span>}
                    </p>

                    {Array.isArray(shown.ingredients) && shown.ingredients.length > 0 && (
                      <details className="meal__ingredients">
                        <summary>Ingredients ({shown.ingredients.length})</summary>
                        <ul>
                          {shown.ingredients.map((ingredient, index) => (
                            <li key={`${ingredient.name}-${index}`}>
                              {ingredient.name} <span className="muted">({ingredient.category})</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>

                  <div className="meal__actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      aria-expanded={isOpen}
                      onClick={() => {
                        setOpenSlot(isOpen ? null : meal.key);
                        setRequestError('');
                      }}
                    >
                      Replace
                    </button>

                    {isOpen && (
                      <form
                        className="replace-form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          handleReplace(meal);
                        }}
                      >
                        <label className="field__label" htmlFor={`request-${meal.key}`}>
                          What should the replacement be?
                        </label>
                        <input
                          id={`request-${meal.key}`}
                          className="input"
                          type="text"
                          value={request}
                          placeholder="e.g. a vegetarian meal under 20 minutes"
                          onChange={(event) => setRequest(event.target.value)}
                          aria-invalid={Boolean(requestError)}
                          aria-describedby={requestError ? `request-error-${meal.key}` : undefined}
                        />
                        <FieldError id={`request-error-${meal.key}`} message={requestError} />

                        <div className="replace-form__chips">
                          {QUICK_REQUESTS.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              className="chip"
                              onClick={() => setRequest(suggestion)}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>

                        <button type="submit" className="btn btn--primary btn--sm" disabled={busy}>
                          {busy ? 'Generating…' : 'Generate replacement'}
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </article>
      ))}
    </section>
  );
}

/** Grouped grocery list shown under a plan. */
export function GroceryList({ grocery }) {
  if (!grocery || !Array.isArray(grocery.categories) || grocery.categories.length === 0) return null;

  return (
    <section className="card grocery" aria-label="Grocery list">
      <h2 className="grocery__title">Grocery list</h2>
      <p className="muted grocery__hint">Everything you need for this plan, grouped to make shopping easier.</p>

      <div className="grocery__grid">
        {grocery.categories.map((group) => (
          <div key={group.category} className="grocery__group">
            <h3 className="grocery__category">{group.category}</h3>
            <ul className="grocery__items">
              {group.items.map((item) => (
                <li key={item}>
                  <label className="check">
                    <input type="checkbox" />
                    <span>{item}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export { SLOT_LABELS };

/** Loading state shown while the plan is being generated. */
export function PlanLoading() {
  return <Loading label="Building your meal plan, this can take a few seconds…" />;
}
