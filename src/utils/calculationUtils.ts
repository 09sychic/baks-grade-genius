
// Calculate adjusted quiz score
export const calculateAdjustedQuiz = (scores: number[], maxScores: number[]): number => {
  // If any score or max is missing or zero, return 0
  if (!scores.length || scores.some(score => score === null || score === undefined) || 
      !maxScores.length || maxScores.some(max => max === 0)) {
    return 0;
  }

  // Calculate percentage for each quiz (out of 100)
  const percentages = scores.map((score, index) => (score / maxScores[index]) * 100);
  
  // Calculate average percentage
  const average = percentages.reduce((sum, percent) => sum + percent, 0) / percentages.length;
  
  // Apply formula: ((score * 0.5) + 50) * 0.35
  return ((average * 0.5) + 50) * 0.35;
};

// Calculate adjusted exam score
export const calculateAdjustedExam = (score: number, maxScore: number): number => {
  if (score === null || score === undefined || maxScore === 0) {
    return 0;
  }
  
  // Convert to percentage (out of 100)
  const percentage = (score / maxScore) * 100;
  
  // Apply formula: ((score * 0.5) + 50) * 0.45
  return ((percentage * 0.5) + 50) * 0.45;
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
  
  // Convert attendance and problem set to percentage (out of 100) before adding
  const attendancePercentage = attendance / 10 * 100;
  const problemSetPercentage = problemSet / 10 * 100;
  
  return adjustedQuiz + adjustedExam + (attendancePercentage * 0.10) + (problemSetPercentage * 0.10);
};

// Calculate final grade
export const calculateFinalGrade = (midterm: number, finals: number): number => {
  return midterm * 0.30 + finals * 0.70;
};

// Natural rounding function (rounds to nearest whole number, .5 rounds up)
export const naturalRound = (num: number): number => {
  return Math.round(num);
};

// Calculate scores needed to reach a 75 final grade
export const calculatePointsNeeded = (
  currentMidterm: number, 
  currentFinals: number,
  targetGrade: number = 75
): { 
  midtermNeeded: number | null, 
  finalsNeeded: number | null,
  isPossible: boolean
} => {
  // If both midterm and finals are valid, calculate how much more is needed
  if (currentMidterm > 0 && currentFinals === 0) {
    // Calculate how many points needed in finals
    // target = midterm * 0.3 + finalsNeeded * 0.7
    // finalsNeeded = (target - midterm * 0.3) / 0.7
    const finalsNeeded = (targetGrade - currentMidterm * 0.3) / 0.7;
    return {
      midtermNeeded: null,
      finalsNeeded: finalsNeeded > 100 ? null : finalsNeeded,
      isPossible: finalsNeeded <= 100
    };
  } else if (currentMidterm === 0 && currentFinals > 0) {
    // Calculate how many points needed in midterm
    // target = midtermNeeded * 0.3 + finals * 0.7
    // midtermNeeded = (target - finals * 0.7) / 0.3
    const midtermNeeded = (targetGrade - currentFinals * 0.7) / 0.3;
    return {
      midtermNeeded: midtermNeeded > 100 ? null : midtermNeeded,
      finalsNeeded: null,
      isPossible: midtermNeeded <= 100
    };
  } else if (currentMidterm > 0 && currentFinals > 0) {
    // Both are already completed, check if they reach the target
    const currentFinalGrade = calculateFinalGrade(currentMidterm, currentFinals);
    return {
      midtermNeeded: null,
      finalsNeeded: null,
      isPossible: currentFinalGrade >= targetGrade
    };
  }
  
  // Default case: if both are empty, calculate minimum scores needed for both
  // assuming equal performance in both (as a starting point)
  
  // If target = midterm * 0.3 + finals * 0.7 = 75
  // and if midterm = finals = x (equal performance)
  // then 75 = x * 0.3 + x * 0.7 = x
  // so x = 75
  
  return {
    midtermNeeded: 75,
    finalsNeeded: 75,
    isPossible: true
  };
};

// Calculate GPE based on the fixed grading scale
export const calculateGPE = (finalGrade: number): string => {
  // Round to the nearest whole number for evaluation
  const roundedGrade = naturalRound(finalGrade);
  
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
  const roundedGrade = naturalRound(finalGrade);
  
  if (roundedGrade < 75) return "text-calc-red"; // Failed
  if (roundedGrade < 80) return "text-yellow-500"; // Passed but needs improvement
  if (roundedGrade < 90) return "text-orange-400"; // Good
  return "text-green-500"; // Excellent
};

// Format final grade with detailed precision in parentheses
export const formatFinalGrade = (finalGrade: number): string => {
  const roundedGrade = naturalRound(finalGrade);
  return `${roundedGrade} (${finalGrade.toFixed(2)})`;
};
