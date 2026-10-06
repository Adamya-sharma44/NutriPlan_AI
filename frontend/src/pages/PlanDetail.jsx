import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Alert, Loading } from '../components/UI';
import MealPlanView, { GroceryList } from '../components/MealPlanView';

/** Read a saved plan and display it, with the option to delete it. */
export default function PlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await api.getPlan(id);
        if (active) setPlan(data.plan);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  async function handleDelete() {
    if (!window.confirm('Delete this meal plan? This cannot be undone.')) return;

    setDeleting(true);
    try {
      await api.deletePlan(id);
      navigate('/dashboard/plans', { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  if (loading) return <Loading label="Loading this meal plan…" />;

  if (error || !plan) {
    return (
      <div className="container page">
        <Alert type="error">{error || 'That meal plan could not be found.'}</Alert>
        <Link to="/dashboard/plans" className="btn btn--secondary">
          Back to my meal plans
        </Link>
      </div>
    );
  }

  const preferences = plan.preferences || {};

  return (
    <div className="container page">
      <div className="page__header">
        <div>
          <Link to="/dashboard/plans" className="back-link">
            &larr; Back to my meal plans
          </Link>
          <h1 className="page__title">{plan.name}</h1>
          <p className="page__subtitle">
            Saved on {new Date(`${String(plan.createdAt).replace(' ', 'T')}Z`).toLocaleDateString()}
            {preferences.goal ? ` · Goal: ${preferences.goal}` : ''}
          </p>
        </div>
        <button
          type="button"
          className="btn btn--danger"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? 'Deleting…' : 'Delete plan'}
        </button>
      </div>

      {message && <Alert type="info">{message}</Alert>}

      <MealPlanView plan={plan.plan} form={preferences} />
      {plan.grocery && <GroceryList grocery={plan.grocery} />}
    </div>
  );
}
