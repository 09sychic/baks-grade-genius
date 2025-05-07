
// Calculate GPE based on the fixed grading scale
export const calculateGPE = (finalGrade: number): string => {
  // Round to the nearest whole number for evaluation
  const roundedGrade = Math.round(finalGrade);
  
  if (roundedGrade < 75) return "5.00";
  
  if (roundedGrade >= 99) return "1.00";
  if (roundedGrade >= 96) return "1.25";
  if (roundedGrade >= 93) return "1.50";
  if (roundedGrade >= 90) return "1.75";
  if (roundedGrade >= 87) return "2.00";
  if (roundedGrade >= 84) return "2.25";
  if (roundedGrade >= 81) return "2.50";
  if (roundedGrade >= 78) return "2.75";
  if (roundedGrade >= 75) return "3.00";
  
  return "5.00"; // Fallback
};

// Get color based on grade
export const getGradeColor = (finalGrade: number): string => {
  const roundedGrade = Math.round(finalGrade);
  
  if (roundedGrade < 75) return "text-calc-red"; // Failed
  if (roundedGrade < 80) return "text-yellow-500"; // Passed but needs improvement
  if (roundedGrade < 90) return "text-orange-400"; // Good
  return "text-green-500"; // Excellent
};

// Format final grade with detailed precision in parentheses
export const formatFinalGrade = (finalGrade: number): string => {
  const roundedGrade = Math.round(finalGrade);
  return `${roundedGrade} (${finalGrade.toFixed(2)})`;
};
