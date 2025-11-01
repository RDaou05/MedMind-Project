// Common medications database for autocomplete
export const COMMON_MEDICATIONS = [
  // Pain Relief
  'Acetaminophen', 'Ibuprofen', 'Aspirin', 'Naproxen', 'Tramadol', 'Codeine',
  
  // Antibiotics
  'Amoxicillin', 'Azithromycin', 'Ciprofloxacin', 'Doxycycline', 'Penicillin', 'Cephalexin',
  
  // Heart & Blood Pressure
  'Lisinopril', 'Amlodipine', 'Metoprolol', 'Losartan', 'Atenolol', 'Hydrochlorothiazide',
  'Warfarin', 'Clopidogrel', 'Atorvastatin', 'Simvastatin',
  
  // Diabetes
  'Metformin', 'Insulin', 'Glipizide', 'Glyburide', 'Pioglitazone', 'Sitagliptin',
  
  // Mental Health
  'Sertraline', 'Fluoxetine', 'Escitalopram', 'Paroxetine', 'Venlafaxine', 'Bupropion',
  'Lorazepam', 'Alprazolam', 'Clonazepam', 'Diazepam',
  
  // Respiratory
  'Albuterol', 'Prednisone', 'Montelukast', 'Fluticasone', 'Budesonide',
  
  // Gastrointestinal
  'Omeprazole', 'Pantoprazole', 'Ranitidine', 'Simethicone', 'Loperamide',
  
  // Vitamins & Supplements
  'Vitamin D', 'Vitamin B12', 'Vitamin C', 'Multivitamin', 'Calcium', 'Iron',
  'Folic Acid', 'Omega-3', 'Probiotics',
  
  // Thyroid
  'Levothyroxine', 'Liothyronine', 'Methimazole',
  
  // Allergy
  'Cetirizine', 'Loratadine', 'Diphenhydramine', 'Fexofenadine',
  
  // Sleep
  'Melatonin', 'Zolpidem', 'Eszopiclone', 'Trazodone',
  
  // Birth Control
  'Ethinyl Estradiol', 'Levonorgestrel', 'Norethindrone',
  
  // Eye Care
  'Latanoprost', 'Timolol', 'Brimonidine',
  
  // Skin
  'Hydrocortisone', 'Tretinoin', 'Clindamycin', 'Benzoyl Peroxide'
];

export const searchMedications = (query) => {
  if (!query || query.length < 2) return [];
  
  const lowercaseQuery = query.toLowerCase();
  return COMMON_MEDICATIONS
    .filter(med => med.toLowerCase().includes(lowercaseQuery))
    .sort((a, b) => {
      // Prioritize medications that start with the query
      const aStarts = a.toLowerCase().startsWith(lowercaseQuery);
      const bStarts = b.toLowerCase().startsWith(lowercaseQuery);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return a.localeCompare(b);
    })
    .slice(0, 10); // Limit to 10 results
};