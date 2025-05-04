
// Calculate adjusted quiz score
export const calculateAdjustedQuiz = (scores: number[], maxScores: number[]): number => {
  // If any score or max is missing or zero, return 0
  if (!scores.length || scores.some(score => score === null || score === undefined) || 
      !maxScores.length || maxScores.some(max => max === 0)) {
    return 0;
  }

  // Calculate percentage for each quiz
  const percentages = scores.map((score, index) => (score / maxScores[index]) * 100);
  
  // Calculate average
  const average = percentages.reduce((sum, percent) => sum + percent, 0) / percentages.length;
  
  // Apply formula: (avg * 0.65 + 50) * 0.35
  return (average * 0.65 + 50) * 0.35;
};

// Calculate adjusted exam score
export const calculateAdjustedExam = (score: number, maxScore: number): number => {
  if (score === null || score === undefined || maxScore === 0) {
    return 0;
  }
  
  // Convert to percentage
  const percentage = (score / maxScore) * 100;
  
  // Apply formula: (score * 0.75 + 50) * 0.45
  return (percentage * 0.75 + 50) * 0.45;
};

// Calculate the period grade (midterm or finals)
export const calculatePeriodGrade = (
  quizScores: number[], 
  quizMaxScores: number[], 
  examScore: number,
  examMaxScore: number,
  attendance: number,
  problemSet: number
): number => {
  const adjustedQuiz = calculateAdjustedQuiz(quizScores, quizMaxScores);
  const adjustedExam = calculateAdjustedExam(examScore, examMaxScore);
  
  // Add attendance and problem set directly
  return adjustedQuiz + adjustedExam + attendance + problemSet;
};

// Calculate final grade
export const calculateFinalGrade = (midterm: number, finals: number): number => {
  return midterm * 0.30 + finals * 0.70;
};

// Calculate GPE
export const calculateGPE = (finalGrade: number): string => {
  if (finalGrade < 75) return "5.00";
  
  if (finalGrade >= 99) return "1.00";
  if (finalGrade >= 96) return "1.25";
  if (finalGrade >= 93) return "1.50";
  if (finalGrade >= 90) return "1.75";
  if (finalGrade >= 87) return "2.00";
  if (finalGrade >= 84) return "2.25";
  if (finalGrade >= 81) return "2.50";
  if (finalGrade >= 78) return "2.75";
  if (finalGrade >= 75) return "3.00";
  
  return "5.00"; // Fallback
};
