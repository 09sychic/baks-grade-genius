
import { calculateAdjustedQuiz, calculateAdjustedExam } from './basicCalculations';

// Helper type for period state
export type PeriodState = {
  quizScores: (number | null)[];
  quizMaxScores: (number | null)[];
  examScore: number | null;
  examMaxScore: number | null;
  attendance: number | null;
  problemSet: number | null;
};

// Helper function to calculate the needed scores for missing quiz and exam values
export const calculateNeededScores = (
  periodState: PeriodState,
  isFinals: boolean,
  currentMidterm: number,
  targetGrade: number = 75
): {
  neededScores: { [key: string]: string };
  isPossible: boolean;
  message: string;
} => {
  // Default attendance and problem set to full scores if missing
  const attendance = periodState.attendance || 10;
  const problemSet = periodState.problemSet || 10;
  
  // Initialize result object
  const result = {
    neededScores: {} as { [key: string]: string },
    isPossible: true,
    message: "Here are the scores you need to reach the target grade."
  };
  
  // Calculate how much this period needs to contribute to the final grade
  let requiredContribution: number;
  
  if (isFinals) {
    // For finals: target = midterm * 0.3 + finals * 0.7
    requiredContribution = (targetGrade - (currentMidterm * 0.3)) / 0.7;
  } else {
    // For midterm: target = midterm * 0.3 + finals * 0.7 (assume finals = 100 for now)
    const assumedFinals = 100; // Optimistic assumption
    requiredContribution = (targetGrade - (assumedFinals * 0.7)) / 0.3;
  }
  
  // Check if it's mathematically possible to reach target with perfect scores
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
  let currentQuizContribution = 0;
  let currentExamContribution = 0;
  
  // Identify missing quiz and exam fields
  const missingQuizIndices: number[] = [];
  periodState.quizScores.forEach((score, index) => {
    if (score === null || score === undefined) {
      missingQuizIndices.push(index);
    }
  });
  
  const isExamMissing = periodState.examScore === null;
  
  // Calculate current quiz contribution if any scores are present
  const filledQuizScores = periodState.quizScores.filter((score, index) => 
    !missingQuizIndices.includes(index) && score !== null);
  
  const filledQuizMaxScores = periodState.quizMaxScores.filter((max, index) => 
    !missingQuizIndices.includes(index) && max !== null);
  
  if (filledQuizScores.length > 0) {
    currentQuizContribution = calculateAdjustedQuiz(filledQuizScores, filledQuizMaxScores);
  }
  
  // Calculate current exam contribution if present
  if (!isExamMissing && periodState.examScore !== null && periodState.examMaxScore !== null) {
    currentExamContribution = calculateAdjustedExam(periodState.examScore, periodState.examMaxScore);
  }
  
  // Calculate attendance and problem set contributions
  const attendanceContribution = (attendance / 10 * 100) * 0.10;
  const problemSetContribution = (problemSet / 10 * 100) * 0.10;
  
  // Calculate total current contribution
  const currentTotalContribution = currentQuizContribution + currentExamContribution +
                                attendanceContribution + problemSetContribution;
  
  // Calculate additional points needed
  const additionalNeeded = Math.max(0, requiredContribution - currentTotalContribution);
  
  // Only proceed if we need additional points and have missing fields
  if (additionalNeeded <= 0) {
    return {
      neededScores: {},
      isPossible: true,
      message: "You're already on track to reach your target grade!"
    };
  }
  
  // If no missing fields, we can't make suggestions
  if (missingQuizIndices.length === 0 && !isExamMissing) {
    return {
      neededScores: {},
      isPossible: true,
      message: "All fields are filled. No score suggestions needed."
    };
  }
  
  // Calculate the total weight of missing components
  const quizWeight = 0.35; // Quiz weight in period grade
  const examWeight = 0.45; // Exam weight in period grade
  
  // Calculate per-quiz weight (distribute quiz weight evenly)
  const perQuizWeight = quizWeight / periodState.quizScores.length;
  
  // Calculate the total weight of all missing components
  let totalMissingWeight = isExamMissing ? examWeight : 0;
  totalMissingWeight += missingQuizIndices.length * perQuizWeight;
  
  // If no missing weight (shouldn't happen), return early
  if (totalMissingWeight === 0) {
    return {
      neededScores: {},
      isPossible: true,
      message: "No missing components detected."
    };
  }
  
  // Flag to track if any score exceeds maximum
  let anyScoreExceedsMax = false;
  
  // Calculate needed scores for missing quizzes
  if (missingQuizIndices.length > 0) {
    // Calculate the portion of additional needed points allocated to all missing quizzes
    const quizPortionWeight = (missingQuizIndices.length * perQuizWeight) / totalMissingWeight;
    const quizPortionNeeded = additionalNeeded * quizPortionWeight;
    
    // Calculate per-quiz portion (distribute evenly among missing quizzes)
    const perQuizPortionNeeded = quizPortionNeeded / missingQuizIndices.length;
    const perQuizNeededPercentage = (perQuizPortionNeeded / perQuizWeight) * 100;
    
    // Calculate the raw score needed for each missing quiz (before formula adjustment)
    // Formula is: ((score * 0.5) + 50), so we solve for score:
    // perQuizNeededPercentage = ((score * 0.5) + 50)
    // score = (perQuizNeededPercentage - 50) * 2
    const rawQuizPercentage = (perQuizNeededPercentage - 50) * 2;
    
    // Calculate for each missing quiz
    missingQuizIndices.forEach(index => {
      const maxScore = periodState.quizMaxScores[index] || 100;
      const neededScore = (rawQuizPercentage / 100) * maxScore;
      const quizNumber = isFinals ? index + 3 : index + 1; // Quiz 3/4 for finals, 1/2 for midterm
      
      // Clamp score between 0 and max
      const clampedScore = Math.min(Math.max(0, Math.ceil(neededScore)), maxScore);
      
      // Check if score exceeds max or is negative
      if (neededScore > maxScore) {
        anyScoreExceedsMax = true;
        result.neededScores[`Quiz ${quizNumber}`] = 
          `Max score is ${maxScore}, not enough to reach ${targetGrade}%`;
      } else if (neededScore < 0) {
        // If negative, no need to show - already satisfied
        result.neededScores[`Quiz ${quizNumber}`] = 
          `Already satisfied with other scores`;
      } else {
        result.neededScores[`Quiz ${quizNumber}`] = 
          `Need ${clampedScore} out of ${maxScore}`;
      }
    });
  }
  
  // Calculate needed score for missing exam
  if (isExamMissing) {
    // Calculate the portion of additional needed points allocated to exam
    const examPortionWeight = examWeight / totalMissingWeight;
    const examPortionNeeded = additionalNeeded * examPortionWeight;
    
    // Calculate percentage needed for exam
    const examNeededPercentage = (examPortionNeeded / examWeight) * 100;
    
    // Apply formula adjustment: ((score * 0.5) + 50)
    const rawExamPercentage = (examNeededPercentage - 50) * 2;
    
    // Calculate actual score needed
    const maxScore = periodState.examMaxScore || 100;
    const neededScore = (rawExamPercentage / 100) * maxScore;
    
    // Clamp score between 0 and max
    const clampedScore = Math.min(Math.max(0, Math.ceil(neededScore)), maxScore);
    
    // Check if score exceeds max or is negative
    if (neededScore > maxScore) {
      anyScoreExceedsMax = true;
      result.neededScores["Major Exam"] = 
        `Max score is ${maxScore}, not enough to reach ${targetGrade}%`;
    } else if (neededScore < 0) {
      // If negative, no need to show - already satisfied
      result.neededScores["Major Exam"] = 
        `Already satisfied with other scores`;
    } else {
      result.neededScores["Major Exam"] = 
        `Need ${clampedScore} out of ${maxScore}`;
    }
  }
  
  // Update possibility flag and message
  if (anyScoreExceedsMax) {
    result.isPossible = false;
    result.message = "Some required scores exceed maximum possible scores. You may need to improve other components.";
  }
  
  return result;
};

// Calculate scores needed to reach a 75 final grade
export const calculatePointsNeeded = (
  midtermState: PeriodState,
  finalsState: PeriodState,
  currentMidtermGrade: number,
  currentFinalsGrade: number,
  targetGrade: number = 75
): {
  neededScores: { [key: string]: string };
  isPossible: boolean;
  message: string;
} => {
  // Check if midterm is incomplete
  const isMidtermComplete = midtermState.quizScores.every(score => score !== null) && 
                           midtermState.examScore !== null;
                           
  // Check if finals is incomplete
  const isFinalsComplete = finalsState.quizScores.every(score => score !== null) && 
                          finalsState.examScore !== null;
  
  // If both periods are complete, return appropriate message
  if (isMidtermComplete && isFinalsComplete) {
    const finalGrade = currentMidtermGrade * 0.30 + currentFinalsGrade * 0.70;
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
