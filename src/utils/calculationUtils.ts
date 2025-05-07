
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

// Helper function to calculate the needed scores for missing quiz and exam values
export const calculateNeededScores = (
  periodState: {
    quizScores: (number | null)[];
    quizMaxScores: (number | null)[];
    examScore: number | null;
    examMaxScore: number | null;
    attendance: number | null;
    problemSet: number | null;
  },
  isFinals: boolean,
  currentMidterm: number,
  targetGrade: number = 75
): {
  neededScores: { [key: string]: string };
  isPossible: boolean;
  message?: string;
} => {
  // Default attendance and problem set to full scores if missing
  const attendance = periodState.attendance || 10;
  const problemSet = periodState.problemSet || 10;
  
  // Initialize result object
  const result = {
    neededScores: {} as { [key: string]: string },
    isPossible: true,
    message: ""
  };
  
  // Calculate how much this period needs to contribute to the final grade
  let requiredContribution: number;
  
  if (isFinals) {
    // For finals: target = midterm * 0.3 + finals * 0.7
    // So, finals = (target - midterm * 0.3) / 0.7
    requiredContribution = (targetGrade - (currentMidterm * 0.3)) / 0.7;
  } else {
    // For midterm: target = midterm * 0.3 + finals * 0.7 (assume finals = 100 for now)
    // So, midterm = (target - 70) / 0.3
    const assumedFinals = 100; // Optimistic assumption
    requiredContribution = (targetGrade - (assumedFinals * 0.7)) / 0.3;
  }
  
  // Check if it's mathematically possible
  if (requiredContribution > 100) {
    return {
      neededScores: {},
      isPossible: false,
      message: isFinals 
        ? "Even with perfect finals scores, you can't reach the target grade."
        : "Even with perfect midterm scores, you'd need excellent finals to reach the target."
    };
  }
  
  // Calculate what we already have from filled fields
  const filledQuizScores = periodState.quizScores.filter((score): score is number => 
    score !== null && score !== undefined);
  const filledQuizMaxScores = periodState.quizMaxScores.filter((max): max is number => 
    max !== null && max !== undefined);
  
  // Current contribution from quizzes (if any are filled)
  let currentQuizContribution = 0;
  if (filledQuizScores.length > 0) {
    currentQuizContribution = calculateAdjustedQuiz(filledQuizScores, filledQuizMaxScores);
  }
  
  // Current contribution from exam (if filled)
  let currentExamContribution = 0;
  if (periodState.examScore !== null && periodState.examMaxScore !== null) {
    currentExamContribution = calculateAdjustedExam(periodState.examScore, periodState.examMaxScore);
  }
  
  // Current contribution from attendance and problem set
  const attendanceContribution = (attendance / 10 * 100) * 0.10;
  const problemSetContribution = (problemSet / 10 * 100) * 0.10;
  
  // Total current contribution
  const currentTotalContribution = currentQuizContribution + currentExamContribution + 
                                 attendanceContribution + problemSetContribution;
  
  // Calculate what more we need
  const additionalNeeded = Math.max(0, requiredContribution - currentTotalContribution);
  
  // Check missing quiz scores
  const missingQuizIndices = periodState.quizScores.map((score, index) => 
    score === null ? index : -1).filter(index => index !== -1);
  
  // Check if exam score is missing
  const isExamMissing = periodState.examScore === null;
  
  // Calculate needed scores based on what's missing
  if (missingQuizIndices.length > 0 && !isExamMissing) {
    // Only quizzes are missing
    const quizWeight = 0.35; // Quiz weight in period grade
    const neededQuizPercentage = (additionalNeeded / quizWeight);
    
    // This needs to be distributed across all missing quizzes
    const perQuizPercentage = neededQuizPercentage * 2; // Double it since formula is (score*0.5)+50
    
    missingQuizIndices.forEach(index => {
      const maxScore = periodState.quizMaxScores[index] || 100;
      const neededScore = (perQuizPercentage / 100) * maxScore;
      const quizNumber = isFinals ? index + 3 : index + 1; // Quiz 3/4 for finals, 1/2 for midterm
      
      result.neededScores[`Quiz ${quizNumber}`] = `Need ${Math.ceil(neededScore)} out of ${maxScore}`;
    });
  } 
  else if (isExamMissing && missingQuizIndices.length === 0) {
    // Only exam is missing
    const examWeight = 0.45; // Exam weight in period grade
    const neededExamPercentage = (additionalNeeded / examWeight);
    
    // Calculate actual score needed based on formula: ((score * 0.5) + 50)
    const rawExamPercentage = (neededExamPercentage - 50) * 2;
    const maxScore = periodState.examMaxScore || 100;
    const neededScore = (rawExamPercentage / 100) * maxScore;
    
    result.neededScores["Major Exam"] = `Need ${Math.ceil(neededScore)} out of ${maxScore}`;
  }
  else if (missingQuizIndices.length > 0 && isExamMissing) {
    // Both quizzes and exam are missing - distribute proportionally
    // Assume equal distribution among missing components for simplicity
    const quizWeight = 0.35; // Quiz weight
    const examWeight = 0.45; // Exam weight
    const totalMissingWeight = quizWeight + examWeight;
    
    // Distribute proportionally
    const quizPortion = (quizWeight / totalMissingWeight) * additionalNeeded;
    const examPortion = (examWeight / totalMissingWeight) * additionalNeeded;
    
    // Calculate for quizzes
    const quizPercentageNeeded = (quizPortion / quizWeight);
    const perQuizPercentage = quizPercentageNeeded * 2; // Double it since formula is (score*0.5)+50
    
    missingQuizIndices.forEach(index => {
      const maxScore = periodState.quizMaxScores[index] || 100;
      const neededScore = (perQuizPercentage / 100) * maxScore;
      const quizNumber = isFinals ? index + 3 : index + 1; // Quiz 3/4 for finals, 1/2 for midterm
      
      result.neededScores[`Quiz ${quizNumber}`] = `Need ${Math.ceil(neededScore)} out of ${maxScore}`;
    });
    
    // Calculate for exam
    const examPercentageNeeded = (examPortion / examWeight);
    const rawExamPercentage = (examPercentageNeeded - 50) * 2;
    const maxScore = periodState.examMaxScore || 100;
    const neededScore = (rawExamPercentage / 100) * maxScore;
    
    result.neededScores["Major Exam"] = `Need ${Math.ceil(neededScore)} out of ${maxScore}`;
  }
  
  // Check if any needed scores exceed max scores
  let allPossible = true;
  for (const [key, value] of Object.entries(result.neededScores)) {
    const [needed, max] = value.split(' out of ').map(v => parseInt(v.match(/\d+/)?.[0] || "0"));
    if (needed > max) {
      allPossible = false;
      break;
    }
  }
  
  result.isPossible = allPossible;
  if (!allPossible) {
    result.message = "Some required scores exceed maximum possible scores.";
  }
  
  return result;
};

// Calculate scores needed to reach a 75 final grade
export const calculatePointsNeeded = (
  midtermState: {
    quizScores: (number | null)[];
    quizMaxScores: (number | null)[];
    examScore: number | null;
    examMaxScore: number | null;
    attendance: number | null;
    problemSet: number | null;
  },
  finalsState: {
    quizScores: (number | null)[];
    quizMaxScores: (number | null)[];
    examScore: number | null;
    examMaxScore: number | null;
    attendance: number | null;
    problemSet: number | null;
  },
  currentMidtermGrade: number,
  currentFinalsGrade: number,
  targetGrade: number = 75
): {
  neededScores: { [key: string]: string };
  isPossible: boolean;
  message?: string;
} => {
  // Check if midterm is incomplete
  const isMidtermComplete = midtermState.quizScores.every(score => score !== null) && 
                           midtermState.examScore !== null;
                           
  // Check if finals is incomplete
  const isFinalsComplete = finalsState.quizScores.every(score => score !== null) && 
                          finalsState.examScore !== null;
  
  // If both periods are complete, return appropriate message
  if (isMidtermComplete && isFinalsComplete) {
    const finalGrade = calculateFinalGrade(currentMidtermGrade, currentFinalsGrade);
    return {
      neededScores: {},
      isPossible: finalGrade >= targetGrade,
      message: finalGrade >= targetGrade 
        ? "All fields are filled and you've reached the target grade!"
        : `All fields are filled but you've only reached ${finalGrade.toFixed(2)}%.`
    };
  }
  
  // If midterm is incomplete, calculate needed scores for midterm
  if (!isMidtermComplete) {
    return calculateNeededScores(midtermState, false, currentFinalsGrade, targetGrade);
  }
  
  // If finals is incomplete, calculate needed scores for finals
  if (!isFinalsComplete) {
    return calculateNeededScores(finalsState, true, currentMidtermGrade, targetGrade);
  }
  
  // Default fallback (should never reach here)
  return {
    neededScores: {},
    isPossible: true,
    message: "No missing fields detected."
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
