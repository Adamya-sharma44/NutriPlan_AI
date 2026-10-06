import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Alert, EmptyState, Loading } from '../components/UI';

function formatDate(value) {
  if (!value) return 'an unknown date';
  const date = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return 'an unknown date';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Build a one-line summary of a saved plan for the history list. */
function summarise(plan) {
  const preferences = plan.preferences || {};
  const days = plan.plan?.days?.length || preferences.days || 0;
  const meals = plan.plan?.days?.[0]?.meals?.length || preferences.mealsPerDay || 0;

  return [
    `${days} day${days === 1 ? '' : 's'}`,
    `${meals} meal${meals === 1 ? '' : 's'} per day`,
    preferences.dietary,
    preferences.cookingTime,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Meal plan history: every plan the signed-in user has saved. */
export default function History() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await api.listPlans();
        if (active) setPlans(data.plans);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="container page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Meal plan history</h1>
          <p className="page__subtitle">Every plan you have saved, newest first.</p>
        </div>
        <Link to="/dashboard/plans/new" className="btn btn--primary">
          Create Meal Plan
        </Link>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <Loading label="Loading your history…" />
      ) : plans.length === 0 ? (
        <EmptyState title="Nothing saved yet">
          Generate a plan and save it, and it will show up here.
        </EmptyState>
      ) : (
        <div className="grid grid--2">
          {plans.map((plan) => (
            <article key={plan.id} className="card history-card">
              <h2 className="history-card__name">{plan.name}</h2>
              <p className="history-card__date">Created {formatDate(plan.createdAt)}</p>
              <p className="history-card__summary">{summarise(plan)}</p>
              {plan.goal && <p className="muted">Goal: {plan.goal}</p>}
              <Link to={`/dashboard/plans/${plan.id}`} className="btn btn--secondary btn--sm">
                View plan
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
