'use strict';

/**
 * DEMO MODE MEAL LIBRARY
 * ---------------------------------------------------------------------------
 * This is the local fallback used when no AI API key is configured (or when the
 * AI call fails). It contains simple, hand-written meal templates so the whole
 * application can be demonstrated end to end without any external service.
 *
 * Nothing here is medical advice. It is generic, everyday meal planning.
 *
 * Each meal has:
 *   title        – short name shown in the plan
 *   description  – one friendly sentence
 *   ingredients  – items with a grocery category, so the grocery list can be
 *                  grouped into Produce / Grains / Protein / Dairy / Other
 *   timeMinutes  – rough cooking time, used to respect the cooking-time filter
 *   diets        – which dietary preferences this meal is suitable for
 */

const item = (name, category) => ({ name, category });

const BREAKFASTS = [
  {
    title: 'Overnight oats with banana',
    description: 'Rolled oats soaked in milk overnight, topped with banana slices and a drizzle of honey.',
    ingredients: [
      item('Rolled oats', 'Grains'),
      item('Milk', 'Dairy'),
      item('Banana', 'Produce'),
      item('Honey', 'Other'),
    ],
    timeMinutes: 5,
    diets: ['Vegetarian', 'No restrictions', 'High protein'],
  },
  {
    title: 'Scrambled eggs on toast',
    description: 'Two scrambled eggs with chopped tomatoes and herbs, served on wholemeal toast.',
    ingredients: [
      item('Eggs', 'Protein'),
      item('Wholemeal bread', 'Grains'),
      item('Tomatoes', 'Produce'),
    ],
    timeMinutes: 10,
    diets: ['Vegetarian', 'No restrictions', 'Keto', 'Low carb', 'High protein'],
  },
  {
    title: 'Greek yoghurt berry bowl',
    description: 'Thick yoghurt with mixed berries, pumpkin seeds and a little honey.',
    ingredients: [
      item('Greek yoghurt', 'Dairy'),
      item('Mixed berries', 'Produce'),
      item('Pumpkin seeds', 'Other'),
      item('Honey', 'Other'),
    ],
    timeMinutes: 5,
    diets: ['Vegetarian', 'No restrictions', 'High protein', 'Gluten free'],
  },
  {
    title: 'Avocado and egg breakfast wrap',
    description: 'A soft tortilla filled with mashed avocado, scrambled egg and diced pepper.',
    ingredients: [
      item('Tortillas', 'Grains'),
      item('Avocado', 'Produce'),
      item('Eggs', 'Protein'),
      item('Bell pepper', 'Produce'),
    ],
    timeMinutes: 12,
    diets: ['Vegetarian', 'No restrictions', 'High protein', 'Gluten free'],
  },
  {
    title: 'Chickpea scramble',
    description: 'Crushed chickpeas tossed with onion, spinach and smoked paprika on toast.',
    ingredients: [
      item('Chickpeas', 'Protein'),
      item('Spinach', 'Produce'),
      item('Onion', 'Produce'),
      item('Wholemeal bread', 'Grains'),
    ],
    timeMinutes: 12,
    diets: ['Vegetarian', 'Vegan', 'No restrictions', 'Gluten free', 'High protein'],
  },
  {
    title: 'Breakfast porridge with apple',
    description: 'Oat porridge cooked in milk with grated apple, cinnamon and chopped walnuts.',
    ingredients: [
      item('Rolled oats', 'Grains'),
      item('Milk', 'Dairy'),
      item('Apple', 'Produce'),
      item('Walnuts', 'Other'),
    ],
    timeMinutes: 10,
    diets: ['Vegetarian', 'No restrictions'],
  },
  {
    title: 'Tofu scramble with black beans',
    description: 'C crumbled tofu cooked with black beans, tomatoes and paprika, served with toast.',
    ingredients: [
      item('Tofu', 'Protein'),
      item('Black beans', 'Protein'),
      item('Tomatoes', 'Produce'),
      item('Wholemeal bread', 'Grains'),
    ],
    timeMinutes: 15,
    diets: ['Vegetarian', 'Vegan', 'No restrictions', 'Dairy free', 'High protein'],
  },
  {
    title: 'Muesli with milk',
    description: 'A simple bowl of muesli with milk, a sliced banana and a handful of blueberries.',
    ingredients: [
      item('Muesli', 'Grains'),
      item('Milk', 'Dairy'),
      item('Banana', 'Produce'),
      item('Blueberries', 'Produce'),
    ],
    timeMinutes: 5,
    diets: ['Vegetarian', 'No restrictions'],
  },
  {
    title: 'Smoked salmon bagel',
    description: 'A toasted bagel topped with cream cheese, smoked salmon, red onion and dill.',
    ingredients: [
      item('Bagel', 'Grains'),
      item('Smoked salmon', 'Protein'),
      item('Cream cheese', 'Dairy'),
      item('Red onion', 'Produce'),
    ],
    timeMinutes: 8,
    diets: ['No restrictions', 'Pescatarian', 'High protein'],
  },
  {
    title: 'Cottage cheese with fruit',
    description: 'Cottage cheese with diced mango, a drizzle of honey and toasted seeds.',
    ingredients: [
      item('Cottage cheese', 'Dairy'),
      item('Mango', 'Produce'),
      item('Honey', 'Other'),
      item('Sunflower seeds', 'Other'),
    ],
    timeMinutes: 5,
    diets: ['Vegetarian', 'No restrictions', 'High protein', 'Gluten free'],
  },
];

const LUNCHES = [
  {
    title: 'Chicken and salad wrap',
    description: 'Sliced chicken breast with lettuce, tomato and light mayo rolled in a tortilla.',
    ingredients: [
      item('Chicken breast', 'Protein'),
      item('Tortillas', 'Grains'),
      item('Lettuce', 'Produce'),
      item('Tomatoes', 'Produce'),
      item('Mayonnaise', 'Other'),
    ],
    timeMinutes: 12,
    diets: ['No restrictions', 'High protein'],
  },
  {
    title: 'Chickpea and feta salad bowl',
    description: 'Chickpeas, cucumber, tomato and feta over mixed leaves with olive oil.',
    ingredients: [
      item('Chickpeas', 'Protein'),
      item('Feta', 'Dairy'),
      item('Cucumber', 'Produce'),
      item('Tomatoes', 'Produce'),
      item('Olive oil', 'Other'),
    ],
    timeMinutes: 10,
    diets: ['Vegetarian', 'No restrictions', 'Gluten free'],
  },
  {
    title: 'Tuna and sweet potato bowl',
    description: 'Tuna mixed with roasted sweet potato, green beans and a lemon dressing.',
    ingredients: [
      item('Tuna', 'Protein'),
      item('Sweet potato', 'Produce'),
      item('Green beans', 'Produce'),
      item('Olive oil', 'Other'),
    ],
    timeMinutes: 25,
    diets: ['No restrictions', 'Pescatarian', 'Dairy free', 'Gluten free'],
  },
  {
    title: 'Lentil and carrot soup',
    description: 'A hearty lentil soup with carrots and onion, served with a slice of bread.',
    ingredients: [
      item('Red lentils', 'Protein'),
      item('Carrots', 'Produce'),
      item('Onion', 'Produce'),
      item('Wholemeal bread', 'Grains'),
    ],
    timeMinutes: 30,
    diets: ['Vegetarian', 'Vegan', 'No restrictions', 'Dairy free'],
  },
  {
    title: 'Grilled halloumi and quinoa salad',
    description: 'Grilled halloumi with quinoa, cucumber, tomato and a lemon dressing.',
    ingredients: [
      item('Halloumi', 'Dairy'),
      item('Quinoa', 'Grains'),
      item('Cucumber', 'Produce'),
      item('Tomatoes', 'Produce'),
    ],
    timeMinutes: 20,
    diets: ['Vegetarian', 'No restrictions', 'Gluten free'],
  },
  {
    title: 'Peanut butter tofu rice bowl',
    description: 'Crisp tofu over rice with broccoli, carrots and a peanut dressing.',
    ingredients: [
      item('Tofu', 'Protein'),
      item('Rice', 'Grains'),
      item('Broccoli', 'Produce'),
      item('Carrots', 'Produce'),
      item('Peanut butter', 'Other'),
    ],
    timeMinutes: 20,
    diets: ['Vegetarian', 'Vegan', 'No restrictions', 'Dairy free', 'High protein'],
  },
  {
    title: 'Tuna melt sandwich',
    description: 'Tuna and sweetcorn mix with melted cheese in a toasted sandwich.',
    ingredients: [
      item('Tuna', 'Protein'),
      item('Bread', 'Grains'),
      item('Cheddar', 'Dairy'),
      item('Sweetcorn', 'Produce'),
    ],
    timeMinutes: 8,
    diets: ['No restrictions', 'Pescatarian'],
  },
  {
    title: 'Falafel pita pockets',
    description: 'Baked falafel with salad and tahini sauce in a wholemeal pita.',
    ingredients: [
      item('Falafel', 'Protein'),
      item('Wholemeal pitta', 'Grains'),
      item('Salad leaves', 'Produce'),
      item('Tahini', 'Other'),
    ],
    timeMinutes: 20,
    diets: ['Vegetarian', 'Vegan', 'No restrictions', 'Dairy free'],
  },
  {
    title: 'Mackerel and new potato salad',
    description: 'Mackerel with boiled new potatoes, green beans and a lemon dressing.',
    ingredients: [
      item('Mackerel', 'Protein'),
      item('New potatoes', 'Produce'),
      item('Green beans', 'Produce'),
      item('Olive oil', 'Other'),
    ],
    timeMinutes: 20,
    diets: ['No restrictions', 'Pescatarian', 'Dairy free', 'Gluten free'],
  },
  {
    title: 'Black bean and corn bowl',
    description: 'Black beans and corn over brown rice with salsa, avocado and lime.',
    ingredients: [
      item('Black beans', 'Protein'),
      item('Brown rice', 'Grains'),
      item('Sweetcorn', 'Produce'),
      item('Avocado', 'Produce'),
    ],
    timeMinutes: 15,
    diets: ['Vegetarian', 'Vegan', 'No restrictions', 'Dairy free', 'Gluten free'],
  },
];

const DINNERS = [
  {
    title: 'Spaghetti with tomato and basil sauce',
    description: 'A simple tomato and basil sauce over spaghetti with grated parmesan.',
    ingredients: [
      item('Spaghetti', 'Grains'),
      item('Tinned tomatoes', 'Other'),
      item('Parmesan', 'Dairy'),
      item('Fresh basil', 'Produce'),
    ],
    timeMinutes: 25,
    diets: ['Vegetarian', 'No restrictions'],
  },
  {
    title: 'Grilled salmon with roasted vegetables',
    description: 'Salmon fillet with roasted broccoli and carrots, drizzled with olive oil.',
    ingredients: [
      item('Salmon', 'Protein'),
      item('Broccoli', 'Produce'),
      item('Carrots', 'Produce'),
      item('Olive oil', 'Other'),
    ],
    timeMinutes: 25,
    diets: ['No restrictions', 'Pescatarian', 'Dairy free', 'Gluten free', 'High protein'],
  },
  {
    title: 'Chickpea and spinach curry',
    description: 'Chickpeas simmered with spinach, onion and mild curry spices, served with rice.',
    ingredients: [
      item('Chickpeas', 'Protein'),
      item('Spinach', 'Produce'),
      item('Rice', 'Grains'),
      item('Onion', 'Produce'),
    ],
    timeMinutes: 25,
    diets: ['Vegetarian', 'Vegan', 'No restrictions', 'Dairy free', 'Gluten free'],
  },
  {
    title: 'Chicken stir fry with noodles',
    description: 'Chicken strips stir fried with mixed vegetables and noodles in a soy sauce.',
    ingredients: [
      item('Chicken breast', 'Protein'),
      item('Egg noodles', 'Grains'),
      item('Mixed vegetables', 'Produce'),
      item('Soy sauce', 'Other'),
    ],
    timeMinutes: 20,
    diets: ['No restrictions', 'Dairy free'],
  },
  {
    title: 'Beef and vegetable stir fry',
    description: 'Lean beef strips with peppers, onions and rice, flavoured with garlic and soy.',
    ingredients: [
      item('Lean beef', 'Protein'),
      item('Bell pepper', 'Produce'),
      item('Rice', 'Grains'),
      item('Soy sauce', 'Other'),
    ],
    timeMinutes: 20,
    diets: ['No restrictions', 'Dairy free', 'High protein', 'Keto'],
  },
  {
    title: 'Vegetable lasagne',
    description: 'Layers of lasagne sheets with vegetable tomato sauce and béchamel.',
    ingredients: [
      item('Lasagne sheets', 'Grains'),
      item('Courgette', 'Produce'),
      item('Tinned tomatoes', 'Other'),
      item('Milk', 'Dairy'),
    ],
    timeMinutes: 45,
    diets: ['Vegetarian', 'No restrictions'],
  },
  {
    title: 'Vegetable stir fry with tofu',
    description: 'Crisp tofu and mixed vegetables stir fried in a light sesame sauce with rice.',
    ingredients: [
      item('Tofu', 'Protein'),
      item('Mixed vegetables', 'Produce'),
      item('Rice', 'Grains'),
      item('Sesame oil', 'Other'),
    ],
    timeMinutes: 20,
    diets: ['Vegetarian', 'Vegan', 'No restrictions', 'Dairy free'],
  },
  {
    title: 'Cauliflower and chickpea traybake',
    description: 'Cauliflower florets and chickpeas roasted with paprika, served with couscous.',
    ingredients: [
      item('Cauliflower', 'Produce'),
      item('Chickpeas', 'Protein'),
      item('Couscous', 'Grains'),
      item('Olive oil', 'Other'),
    ],
    timeMinutes: 35,
    diets: ['Vegetarian', 'Vegan', 'No restrictions', 'Dairy free'],
  },
  {
    title: 'Baked cod with potatoes',
    description: 'Cod fillet baked with lemon and herbs, served with boiled potatoes and peas.',
    ingredients: [
      item('Cod', 'Protein'),
      item('Potatoes', 'Produce'),
      item('Peas', 'Produce'),
      item('Olive oil', 'Other'),
    ],
    timeMinutes: 30,
    diets: ['No restrictions', 'Pescatarian', 'Dairy free', 'Gluten free'],
  },
  {
    title: 'Pasta bake with chicken and spinach',
    description: 'Pasta baked with chicken, spinach and tomato sauce topped with grated cheese.',
    ingredients: [
      item('Pasta', 'Grains'),
      item('Chicken breast', 'Protein'),
      item('Spinach', 'Produce'),
      item('Cheddar', 'Dairy'),
    ],
    timeMinutes: 40,
    diets: ['No restrictions', 'High protein'],
  },
  {
    title: 'Chilli with kidney beans and rice',
    description: 'A mild bean chilli with tomatoes and peppers, served over steamed rice.',
    ingredients: [
      item('Kidney beans', 'Protein'),
      item('Tinned tomatoes', 'Other'),
      item('Rice', 'Grains'),
      item('Bell pepper', 'Produce'),
    ],
    timeMinutes: 30,
    diets: ['Vegetarian', 'Vegan', 'No restrictions', 'Dairy free', 'Gluten free'],
  },
  {
    title: 'Egg fried rice with vegetables',
    description: 'Cooked rice tossed with egg, peas, carrots and spring onion in soy sauce.',
    ingredients: [
      item('Rice', 'Grains'),
      item('Eggs', 'Protein'),
      item('Peas', 'Produce'),
      item('Carrots', 'Produce'),
    ],
    timeMinutes: 15,
    diets: ['Vegetarian', 'No restrictions', 'Dairy free'],
  },
];

const SNACKS = [
  {
    title: 'Greek yoghurt with honey',
    description: 'A small pot of Greek yoghurt with a drizzle of honey.',
    ingredients: [item('Greek yoghurt', 'Dairy'), item('Honey', 'Other')],
    timeMinutes: 2,
    diets: ['Vegetarian', 'No restrictions', 'High protein', 'Gluten free'],
  },
  {
    title: 'Apple and peanut butter',
    description: 'Apple slices with peanut butter for a quick, filling snack.',
    ingredients: [item('Apple', 'Produce'), item('Peanut butter', 'Other')],
    timeMinutes: 2,
    diets: ['Vegetarian', 'No restrictions', 'Dairy free'],
  },
  {
    title: 'Carrot and cucumber sticks',
    description: 'Crunchy raw sticks with a small cup of hummus.',
    ingredients: [item('Carrots', 'Produce'), item('Cucumber', 'Produce'), item('Hummus', 'Other')],
    timeMinutes: 5,
    diets: ['Vegetarian', 'Vegan', 'No restrictions', 'Dairy free', 'Gluten free'],
  },
  {
    title: 'Handful of almonds and an orange',
    description: 'A small portion of almonds with a clementine.',
    ingredients: [item('Almonds', 'Other'), item('Clementine', 'Produce')],
    timeMinutes: 2,
    diets: ['Vegetarian', 'Vegan', 'No restrictions', 'Dairy free', 'Gluten free', 'Keto', 'Low carb'],
  },
  {
    title: 'Cottage cheese with tomatoes',
    description: 'Cottage cheese with a few cherry tomatoes on the side.',
    ingredients: [item('Cottage cheese', 'Dairy'), item('Cherry tomatoes', 'Produce')],
    timeMinutes: 5,
    diets: ['Vegetarian', 'No restrictions', 'High protein', 'Gluten free', 'Low carb'],
  },
  {
    title: 'Edamame with sea salt',
    description: 'A small bowl of lightly salted edamame beans.',
    ingredients: [item('Edamame', 'Protein')],
    timeMinutes: 5,
    diets: ['Vegetarian', 'Vegan', 'No restrictions', 'Dairy free', 'Gluten free', 'High protein'],
  },
  {
    title: 'Wholemeal crackers and cheese',
    description: 'A few wholemeal crackers with a slice of cheese.',
    ingredients: [item('Wholemeal crackers', 'Grains'), item('Cheddar', 'Dairy')],
    timeMinutes: 2,
    diets: ['Vegetarian', 'No restrictions'],
  },
  {
    title: 'Hummus and vegetable dip plate',
    description: 'Hummus served with pepper and cucumber for dipping.',
    ingredients: [item('Hummus', 'Other'), item('Bell pepper', 'Produce'), item('Cucumber', 'Produce')],
    timeMinutes: 5,
    diets: ['Vegetarian', 'Vegan', 'No restrictions', 'Dairy free', 'Gluten free'],
  },
];

// Used by the "replace this meal" feature in demo mode.
const REPLACEMENTS = [
  {
    title: 'Simple grilled protein and salad plate',
    description: 'A grilled protein fillet with mixed salad, boiled potatoes and a light dressing.',
    ingredients: [item('Salad leaves', 'Produce'), item('Potatoes', 'Produce')],
    timeMinutes: 15,
  },
  {
    title: 'Quick vegetable stir fry with rice',
    description: 'Mixed vegetables stir fried in a light sauce and served over steamed rice.',
    ingredients: [item('Mixed vegetables', 'Produce'), item('Rice', 'Grains')],
    timeMinutes: 15,
  },
  {
    title: 'Warm bean and vegetable bowl',
    description: 'Warm beans with roasted vegetables, served with a slice of wholemeal bread.',
    ingredients: [item('Black beans', 'Protein'), item('Mixed vegetables', 'Produce'), item('Wholemeal bread', 'Grains')],
    timeMinutes: 15,
  },
  {
    title: 'Baked potato with beans and salad',
    description: 'A baked potato topped with spiced beans, served with a side salad.',
    ingredients: [item('Potatoes', 'Produce'), item('Kidney beans', 'Protein'), item('Salad leaves', 'Produce')],
    timeMinutes: 25,
  },
];

module.exports = {
  BREAKFASTS,
  LUNCHES,
  DINNERS,
  SNACKS,
  REPLACEMENTS,
  item,
};
