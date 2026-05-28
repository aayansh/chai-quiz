// Chai Quiz — 15 kid-friendly trivia questions
// Correct answer position is rotated so it's not always the first option.
// Each question: {q, options:[{label, correct?}], fact}

window.CHAI_QUIZ = [
  {
    // correct: B
    q: 'What does the word "chai" mean?',
    icon: 'cup',
    options: [
      { label: 'Milk' },
      { label: 'Tea', correct: true },
      { label: 'Sugar' },
      { label: 'Spice' },
    ],
    fact: '"Chai" literally means tea — so "chai tea" is really "tea tea"!',
  },
  {
    // correct: D
    q: 'Which country is masala chai from?',
    icon: 'cup',
    options: [
      { label: 'Italy' },
      { label: 'Japan' },
      { label: 'Mexico' },
      { label: 'India', correct: true },
    ],
    fact: 'Masala chai was born in India, where families have brewed it for centuries.',
  },
  {
    // correct: C
    q: 'Tea leaves come from which plant?',
    icon: 'leaf',
    options: [
      { label: 'A coffee bush' },
      { label: 'A rose bush' },
      { label: 'The tea plant (Camellia sinensis)', correct: true },
      { label: 'A mint vine' },
    ],
    fact: 'Black, green, oolong and white tea all come from the same plant!',
  },
  {
    // correct: A
    q: 'Which spice gives masala chai its warm, cozy smell?',
    icon: 'cardamom',
    options: [
      { label: 'Cardamom', correct: true },
      { label: 'Chocolate' },
      { label: 'Basil' },
      { label: 'Mustard' },
    ],
    fact: 'Cardamom pods are the secret heart of masala chai.',
  },
  {
    // correct: B
    q: 'What is added to make chai creamy?',
    icon: 'kettle',
    options: [
      { label: 'Lemon juice' },
      { label: 'Milk', correct: true },
      { label: 'Soda water' },
      { label: 'Olive oil' },
    ],
    fact: 'Indian chai is simmered with hot milk until it turns rich and creamy.',
  },
  {
    // correct: C
    q: 'Kashmiri "noon chai" is famous for being which color?',
    icon: 'cup',
    options: [
      { label: 'Blue' },
      { label: 'Green' },
      { label: 'Pink', correct: true },
      { label: 'Purple' },
    ],
    fact: 'Noon chai turns pink because of a tiny pinch of baking soda — magic chemistry!',
  },
  {
    // correct: A
    q: 'What does "kadak" chai mean?',
    icon: 'cup',
    options: [
      { label: 'Strong', correct: true },
      { label: 'Sweet' },
      { label: 'Icy cold' },
      { label: 'Tiny' },
    ],
    fact: 'Kadak chai is brewed extra long so it tastes bold and strong.',
  },
  {
    // correct: D
    q: 'Which one is NOT a chai spice?',
    icon: 'cardamom',
    options: [
      { label: 'Cardamom' },
      { label: 'Cinnamon' },
      { label: 'Ginger' },
      { label: 'Mustard', correct: true },
    ],
    fact: 'Mustard is for curry, not chai! Stick to cardamom, cinnamon, ginger and clove.',
  },
  {
    // correct: B
    q: 'What is often added to make chai sweet?',
    icon: 'biscuit',
    options: [
      { label: 'Salt' },
      { label: 'Sugar or jaggery', correct: true },
      { label: 'Pepper' },
      { label: 'Vinegar' },
    ],
    fact: 'Jaggery is a golden brown sugar made from sugarcane — it adds caramel-y sweetness.',
  },
  {
    // correct: C
    q: 'A "cutting chai" is...',
    icon: 'cup',
    options: [
      { label: 'A giant mug' },
      { label: 'A frozen drink' },
      { label: 'A small half-cup', correct: true },
      { label: 'A type of biscuit' },
    ],
    fact: 'Cutting chai is half a glass — perfect for a quick sip between school and play.',
  },
  {
    // correct: A
    q: 'Which spice gives chai a tiny kick of heat?',
    icon: 'cinnamon',
    options: [
      { label: 'Black pepper', correct: true },
      { label: 'Sugar' },
      { label: 'Mint' },
      { label: 'Lavender' },
    ],
    fact: 'A pinch of black pepper makes chai feel warm in your chest on cold days.',
  },
  {
    // correct: D
    q: "Chai's best snack buddy is usually...",
    icon: 'biscuit',
    options: [
      { label: 'Pizza' },
      { label: 'Sushi' },
      { label: 'A burger' },
      { label: 'A biscuit', correct: true },
    ],
    fact: 'Parle-G, rusks, Marie biscuits — perfect dunkers!',
  },
  {
    // correct: B
    q: 'Star anise is shaped like a...',
    icon: 'star-anise',
    options: [
      { label: 'Heart' },
      { label: 'Star', correct: true },
      { label: 'Square' },
      { label: 'Cloud' },
    ],
    fact: 'Star anise has 8 little points and tastes a bit like liquorice.',
  },
  {
    // correct: A
    q: 'Chai is usually served...',
    icon: 'kettle',
    options: [
      { label: 'Steaming hot', correct: true },
      { label: 'Frozen solid' },
      { label: 'Lukewarm' },
      { label: 'Packed with ice' },
    ],
    fact: 'A hot cup of chai warms you from your toes up to your nose!',
  },
  {
    // correct: C
    q: "Which animal's milk is most often used in Indian chai?",
    icon: 'kettle',
    options: [
      { label: 'Goat' },
      { label: 'Horse' },
      { label: 'Cow or buffalo', correct: true },
      { label: 'Cat' },
    ],
    fact: 'Buffalo milk is extra rich and creamy — many chaiwallahs swear by it.',
  },
];

// Score -> chai personality result
window.CHAI_RESULTS = [
  {
    min: 13,
    title: 'Kadak Chai Master',
    blurb: "Wow! You're brewed strong and full of flavour. A true chai champion.",
    badge: 'KADAK',
    swatch: '#3d2818',
  },
  {
    min: 9,
    title: 'Masala Chai',
    blurb: 'Well-spiced and well-rounded. You know your cardamom from your clove.',
    badge: 'MASALA',
    swatch: '#c44d27',
  },
  {
    min: 5,
    title: 'Cutting Chai',
    blurb: 'Small but mighty! Half a cup of know-how with room to grow.',
    badge: 'CUTTING',
    swatch: '#d98c4a',
  },
  {
    min: 0,
    title: 'Warm Milk',
    blurb: 'Gentle and sweet — keep sipping and learning. The kettle is on!',
    badge: 'STEEP',
    swatch: '#e8d4a8',
  },
];

window.getChaiResult = function (score) {
  return window.CHAI_RESULTS.find((r) => score >= r.min) || window.CHAI_RESULTS[window.CHAI_RESULTS.length - 1];
};
