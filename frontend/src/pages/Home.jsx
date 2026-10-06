import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DemoBanner } from '../components/UI';

const FEATURES = [
  {
    title: 'Tell us what you need',
    text: 'Your goal, dietary preference, allergies, disliked foods, the ingredients you already have, and how much time you want to spend cooking.',
  },
  {
    title: 'Get a plan in seconds',
    text: 'NutriPlan AI builds a day-by-day plan with breakfast, lunch, dinner and snacks that match everything you entered.',
  },
  {
    title: 'Shop without the guesswork',
    text: 'Turn any plan into a grocery list grouped into Produce, Grains, Protein, Dairy and Other.',
  },
  {
    title: 'Swap a meal any time',
    text: 'Not feeling a meal? Ask for a replacement in your own words, like "make it vegetarian and under 20 minutes".',
  },
];

const STEPS = [
  { step: '1', title: 'Create an account', text: 'Register with your name, email and a password. It takes less than a minute.' },
  { step: '2', title: 'Fill in the form', text: 'Choose your goal, diet, allergies and cooking time.' },
  { step: '3', title: 'Save and come back', text: 'Your plans are stored in your history so you can revisit them any time.' },
];

export default function Home() {
  const { user, aiStatus } = useAuth();

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__content">
            <p className="hero__eyebrow">Smart meal planning for students</p>
            <h1 className="hero__title">NutriPlan AI</h1>
            <p className="hero__text">
              Tell NutriPlan AI what you like to eat, what you need to avoid and how much time you
              have. It turns that into a simple, personalised meal plan with a matching grocery list.
            </p>

            <div className="hero__actions">
              {user ? (
                <Link to="/dashboard/plans/new" className="btn btn--primary btn--lg">
                  Create a meal plan
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn--primary btn--lg">
                    Get started free
                  </Link>
                  <Link to="/login" className="btn btn--outline btn--lg">
                    I already have an account
                  </Link>
                </>
              )}
            </div>

            <p className="hero__note">
              This is a meal planning and wellness app. It does not provide medical advice.
            </p>
          </div>

          <div className="hero__card" aria-hidden="true">
            <div className="hero__card-header">
              <span className="hero__card-dot" />
              <span className="hero__card-dot" />
              <span className="hero__card-dot" />
            </div>
            <div className="hero__card-body">
              <p className="hero__card-day">Day 1</p>
              <p className="hero__card-meal">
                <strong>Breakfast</strong> Overnight oats with banana
              </p>
              <p className="hero__card-meal">
                <strong>Lunch</strong> Chickpea and feta salad bowl
              </p>
              <p className="hero__card-meal">
                <strong>Dinner</strong> Spaghetti with tomato and basil sauce
              </p>
              <p className="hero__card-meal">
                <strong>Snack</strong> Apple and peanut butter
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <DemoBanner aiStatus={aiStatus} />

        <section className="section" aria-labelledby="features-heading">
          <h2 id="features-heading" className="section__title">
            What you can do
          </h2>
          <div className="grid grid--4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card">
                <h3 className="card__title">{feature.title}</h3>
                <p className="card__text">{feature.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="steps-heading">
          <h2 id="steps-heading" className="section__title">
            How it works
          </h2>
          <div className="grid grid--3">
            {STEPS.map((item) => (
              <div key={item.step} className="card card--step">
                <span className="step-badge" aria-hidden="true">
                  {item.step}
                </span>
                <h3 className="card__title">{item.title}</h3>
                <p className="card__text">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cta">
          <h2 className="cta__title">Ready to plan your week?</h2>
          <p className="cta__text">Create a plan and see how simple it is.</p>
          <Link
            to={user ? '/dashboard/plans/new' : '/register'}
            className="btn btn--primary btn--lg"
          >
            {user ? 'Create a meal plan' : 'Create your free account'}
          </Link>
        </section>
      </div>
    </>
  );
}
