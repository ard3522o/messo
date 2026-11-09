export const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner'];

export const MEAL_META = {
  breakfast: { label: 'Breakfast', emoji: '🌅', time: '7:30 – 9:30 AM', color: 'amber' },
  lunch: { label: 'Lunch', emoji: '☀️', time: '12:30 – 2:30 PM', color: 'brand' },
  snacks: { label: 'Snacks', emoji: '🍵', time: '4:30 – 6:00 PM', color: 'emerald' },
  dinner: { label: 'Dinner', emoji: '🌙', time: '7:30 – 9:30 PM', color: 'navy' },
};

export const HOSTELS = ['Ganga', 'Yamuna', 'Saraswati', 'Narmada', 'Godavari', 'Kaveri'];

export const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Metallurgy', 'Mathematics', 'Physics'];

export const COMPLAINT_CATEGORIES = ['Food Quality', 'Hygiene', 'Staff Behaviour', 'Menu', 'Other'];

export const COMPLAINT_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const COMPLAINT_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
];

export const PAYMENT_STATUSES = ['paid', 'pending', 'unpaid'];

export const INVENTORY_CATEGORIES = ['Grains', 'Vegetables', 'Dairy', 'Spices', 'Oil & Fats', 'Beverages', 'Other'];

export const UNITS = ['kg', 'litre', 'pieces', 'packets'];

export const FEEDBACK_TAGS = ['Taste', 'Quantity', 'Hygiene', 'Variety', 'Service'];

export const ROLE_LABELS = {
  student: 'Student',
  admin: 'Mess Admin',
  manager: 'Mess Manager',
};
