// OpenFDA API service for comprehensive medication database
const FDA_API_BASE = 'https://api.fda.gov/drug/label.json';

export const searchMedicationsAPI = async (query) => {
  if (!query || query.length < 2) return [];
  
  try {
    // Search FDA database for medications
    const searchQuery = encodeURIComponent(query.toLowerCase());
    const url = `${FDA_API_BASE}?search=openfda.brand_name:"${searchQuery}"&limit=20`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results) {
      const medications = data.results.map(result => {
        const brandName = result.openfda?.brand_name?.[0];
        const genericName = result.openfda?.generic_name?.[0];
        const manufacturer = result.openfda?.manufacturer_name?.[0];
        
        return {
          brandName: brandName || 'Unknown',
          genericName: genericName || 'Unknown',
          manufacturer: manufacturer || 'Unknown',
          displayName: brandName || genericName || 'Unknown'
        };
      });
      
      // Remove duplicates and sort
      const uniqueMeds = medications.filter((med, index, self) => 
        index === self.findIndex(m => m.displayName === med.displayName)
      );
      
      return uniqueMeds.sort((a, b) => {
        const aStarts = a.displayName.toLowerCase().startsWith(query.toLowerCase());
        const bStarts = b.displayName.toLowerCase().startsWith(query.toLowerCase());
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        return a.displayName.localeCompare(b.displayName);
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error searching FDA API:', error);
    // Fallback to local search if API fails
    return searchMedicationsLocal(query);
  }
};

// Fallback local search with expanded database
const EXPANDED_MEDICATIONS = [
  // Pain Relief & Anti-inflammatory
  'Acetaminophen', 'Tylenol', 'Ibuprofen', 'Advil', 'Motrin', 'Aspirin', 'Bayer', 'Naproxen', 'Aleve', 
  'Tramadol', 'Ultram', 'Codeine', 'Morphine', 'Oxycodone', 'OxyContin', 'Hydrocodone', 'Vicodin',
  'Celecoxib', 'Celebrex', 'Meloxicam', 'Mobic', 'Diclofenac', 'Voltaren',
  
  // Antibiotics
  'Amoxicillin', 'Amoxil', 'Azithromycin', 'Zithromax', 'Z-Pak', 'Ciprofloxacin', 'Cipro', 
  'Doxycycline', 'Vibramycin', 'Penicillin', 'Cephalexin', 'Keflex', 'Clindamycin', 'Cleocin',
  'Erythromycin', 'Clarithromycin', 'Biaxin', 'Levofloxacin', 'Levaquin', 'Metronidazole', 'Flagyl',
  
  // Cardiovascular
  'Lisinopril', 'Prinivil', 'Zestril', 'Amlodipine', 'Norvasc', 'Metoprolol', 'Lopressor', 'Toprol-XL',
  'Losartan', 'Cozaar', 'Atenolol', 'Tenormin', 'Hydrochlorothiazide', 'HCTZ', 'Furosemide', 'Lasix',
  'Warfarin', 'Coumadin', 'Clopidogrel', 'Plavix', 'Atorvastatin', 'Lipitor', 'Simvastatin', 'Zocor',
  'Rosuvastatin', 'Crestor', 'Pravastatin', 'Pravachol', 'Carvedilol', 'Coreg', 'Valsartan', 'Diovan',
  
  // Diabetes
  'Metformin', 'Glucophage', 'Insulin', 'Humalog', 'Novolog', 'Lantus', 'Glipizide', 'Glucotrol',
  'Glyburide', 'DiaBeta', 'Pioglitazone', 'Actos', 'Sitagliptin', 'Januvia', 'Glimepiride', 'Amaryl',
  
  // Mental Health
  'Sertraline', 'Zoloft', 'Fluoxetine', 'Prozac', 'Escitalopram', 'Lexapro', 'Paroxetine', 'Paxil',
  'Venlafaxine', 'Effexor', 'Bupropion', 'Wellbutrin', 'Citalopram', 'Celexa', 'Duloxetine', 'Cymbalta',
  'Lorazepam', 'Ativan', 'Alprazolam', 'Xanax', 'Clonazepam', 'Klonopin', 'Diazepam', 'Valium',
  'Quetiapine', 'Seroquel', 'Aripiprazole', 'Abilify', 'Risperidone', 'Risperdal',
  
  // Respiratory
  'Albuterol', 'ProAir', 'Ventolin', 'Prednisone', 'Deltasone', 'Montelukast', 'Singulair',
  'Fluticasone', 'Flonase', 'Budesonide', 'Pulmicort', 'Symbicort', 'Advair',
  
  // Gastrointestinal
  'Omeprazole', 'Prilosec', 'Pantoprazole', 'Protonix', 'Esomeprazole', 'Nexium',
  'Lansoprazole', 'Prevacid', 'Ranitidine', 'Zantac', 'Famotidine', 'Pepcid',
  
  // Thyroid
  'Levothyroxine', 'Synthroid', 'Levoxyl', 'Liothyronine', 'Cytomel', 'Methimazole', 'Tapazole',
  
  // Allergy
  'Cetirizine', 'Zyrtec', 'Loratadine', 'Claritin', 'Diphenhydramine', 'Benadryl',
  'Fexofenadine', 'Allegra', 'Desloratadine', 'Clarinex',
  
  // Sleep & Anxiety
  'Melatonin', 'Zolpidem', 'Ambien', 'Eszopiclone', 'Lunesta', 'Trazodone', 'Desyrel',
  
  // Vitamins & Supplements
  'Vitamin D', 'Vitamin D3', 'Vitamin B12', 'Cyanocobalamin', 'Vitamin C', 'Ascorbic Acid',
  'Multivitamin', 'Calcium', 'Iron', 'Ferrous Sulfate', 'Folic Acid', 'Omega-3', 'Fish Oil',
  'Probiotics', 'Biotin', 'Magnesium', 'Zinc', 'Potassium'
];

const searchMedicationsLocal = (query) => {
  const lowercaseQuery = query.toLowerCase();
  return EXPANDED_MEDICATIONS
    .filter(med => med.toLowerCase().includes(lowercaseQuery))
    .sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(lowercaseQuery);
      const bStarts = b.toLowerCase().startsWith(lowercaseQuery);
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      return a.localeCompare(b);
    })
    .slice(0, 15)
    .map(name => ({
      brandName: name,
      genericName: name,
      manufacturer: 'Various',
      displayName: name
    }));
};