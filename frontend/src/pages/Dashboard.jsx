import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert, EmptyState, Loading } from '../components/UI';

/** One row in the "My Meal Plans" list. */
function PlanRow({ plan }) {
  const preferences = plan.preferences || {};
  const dayCount = plan.plan?.days?.length || preferences.days || 0;

  return (
    <li className="plan-row">
      <div className="plan-row__info">
        <h3 className="plan-row__name">{plan.name}</h3>
        <p className="plan-row__meta">
          {preferences.dietary || 'No restrictions'} · {dayCount} day
          {dayCount === 1 ? '' : 's'}
          {preferences.goal ? ` · ${preferences.goal}` : ''}
        </p>
        <p className="plan-row__date">Created {formatDate(plan.createdAt)}</p>
      </div>
      <Link to={`/dashboard/plans/${plan.id}`} className="btn btn--secondary btn--sm">
        View
      </Link>
    </li>
  );
}

/** SQLite stores "YYYY-MM-DD HH:MM:SS" in UTC; make it readable and local. */
function formatDate(value) {
  if (!value) return 'an unknown date';
  const date = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return 'an unknown date';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Dashboard() {
  const { user } = useAuth();
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
          <h1 className="page__title">Welcome, {user.name.split(' ')[0]}</h1>
          <p className="page__subtitle">
            Create a new meal plan or open one you have saved before.
          </p>
        </div>
        <Link to="/dashboard/plans/new" className="btn btn--primary">
          Create Meal Plan
        </Link>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <section className="section" aria-labelledby="plans-heading">
        <h2 id="plans-heading" className="section__title">
          My Meal Plans
        </h2>

        {loading ? (
          <Loading label="Loading your meal plans…" />
        ) : error ? null : plans.length === 0 ? (
          <EmptyState title="No meal plans yet">
            Once you generate a plan and save it, it will appear here so you can come back to it.
          </EmptyState>
        ) : (
          <ul className="plan-list">
            {plans.map((plan) => (
              <PlanRow key={plan.id} plan={plan} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
