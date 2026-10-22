export const LAUNCH_CITIES = [
  {
    name: 'Mumbai',
    state: 'Maharashtra',
    tagline: 'Sea breeze, Art Deco lanes and late-night vada pav.',
    accent: 'from-[#0f3d36] via-[#1f6f5c] to-[#8fb9a0]',
    neighbourhoods: ['Bandra West', 'Colaba', 'Powai', 'Juhu'],
  },
  {
    name: 'Bengaluru',
    state: 'Karnataka',
    tagline: 'Garden city cafes, tech campuses and cool evenings.',
    accent: 'from-[#223b4f] via-[#3f6f86] to-[#9fc3cf]',
    neighbourhoods: ['Koramangala', 'Indiranagar', 'Whitefield', 'Jayanagar'],
  },
  {
    name: 'Delhi',
    state: 'Delhi',
    tagline: 'Mughal gardens, wide avenues and winter sunshine.',
    accent: 'from-[#5a3320] via-[#a5572a] to-[#dda877]',
    neighbourhoods: ['Hauz Khas', 'Greater Kailash', 'Vasant Kunj', 'Lodhi Colony'],
  },
  {
    name: 'Gurugram',
    state: 'Haryana',
    tagline: 'Modern high-rises beside the Aravalli ridge.',
    accent: 'from-[#3b3550] via-[#655a83] to-[#b8aecf]',
    neighbourhoods: ['Cyber City', 'Golf Course Road', 'Sushant Lok', 'Sector 56'],
  },
  {
    name: 'Noida',
    state: 'Uttar Pradesh',
    tagline: 'Quiet sectors, river walks and expressway access.',
    accent: 'from-[#2f4a3d] via-[#557a63] to-[#a9c6b1]',
    neighbourhoods: ['Sector 150', 'Sector 18', 'Indirapuram', 'Greater Noida West'],
  },
  {
    name: 'Hyderabad',
    state: 'Telangana',
    tagline: 'Old-city biryani, hi-tech offices and Balcony sunsets.',
    accent: 'from-[#4d2b3f] via-[#8b5570] to-[#d5aebd]',
    neighbourhoods: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur'],
  },
] as const;

export const CITY_STATE_MAP: Record<string, string> = Object.fromEntries(
  LAUNCH_CITIES.map((city) => [city.name, city.state]),
);

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'independent_house', label: 'Independent house' },
  { value: 'villa', label: 'Villa' },
  { value: 'studio', label: 'Studio' },
  { value: 'penthouse', label: 'Penthouse' },
] as const;

export const PROPERTY_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPES.map((type) => [type.value, type.label]),
);

export const AMENITIES = [
  'Wi-Fi',
  'Air conditioning',
  'Kitchen',
  'Washing machine',
  'Dedicated workspace',
  'Free parking',
  'Balcony',
  'Lift',
  'Power backup',
  'Hot water',
  'Gym',
  'Swimming pool',
  'Pet friendly',
  'Wheelchair accessible',
] as const;

export const HOUSE_RULES = [
  'No smoking indoors',
  'No parties or events',
  'Quiet hours after 10 pm',
  'No unregistered guests',
  'Pets allowed with notice',
  'Remove shoes at the door',
  'Lock the main door when leaving',
] as const;

export const SCORE_FACTORS = [
  { key: 'condition', label: 'Condition & cleanliness', weight: 25, hint: 'Upkeep, hygiene and how well the home is presented.' },
  { key: 'location', label: 'Location & accessibility', weight: 25, hint: 'Transit, safety and convenience of the neighbourhood.' },
  { key: 'amenities', label: 'Amenities & comfort', weight: 20, hint: 'The practical comforts available during a stay.' },
  { key: 'space', label: 'Space & capacity', weight: 15, hint: 'Room to live comfortably for the listed guest count.' },
  { key: 'listing_quality', label: 'Listing evidence', weight: 15, hint: 'Completeness and verification of listing information.' },
] as const;

export const GRADE_COPY: Record<string, string> = {
  A: 'Exceptional — verified, complete and highly comfortable.',
  B: 'Strong — well kept with most comforts in place.',
  C: 'Solid — meets the essentials with some gaps.',
  D: 'Basic — limited evidence or comfort; review carefully.',
  E: 'Incomplete — evidence missing or standards unmet.',
};

export const CREDIT_PER_NIGHT = 1;

export const CANCELLATION_POLICY = [
  'Cancel more than 7 days before check-in: reserved credits are released in full.',
  'Cancel within 7 days: one night stays with the host as compensation and the rest returns to your wallet.',
  'Direct swaps require both members to agree to any change before dates are released.',
] as const;

export const CITIES = LAUNCH_CITIES.map((city) => city.name);

export const CITY_IMAGE_FALLBACKS: Record<string, string> = {
  Mumbai: 'from-[#0f3d36] via-[#1f6f5c] to-[#b7d2bf]',
  Bengaluru: 'from-[#223b4f] via-[#3f6f86] to-[#b9d5dd]',
  Delhi: 'from-[#5a3320] via-[#a5572a] to-[#e3bd93]',
  Gurugram: 'from-[#3b3550] via-[#655a83] to-[#c9c0dd]',
  Noida: 'from-[#2f4a3d] via-[#557a63] to-[#bcd4c4]',
  Hyderabad: 'from-[#4d2b3f] via-[#8b5570] to-[#e0bcc9]',
};
