
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
    message: ""
  };
  
  // Calculate how much this period needs to contribute to the final grade
  let requiredContribution: number;
  
  if (isFinals) {
    // For finals: target = midterm * 0.3 + finals * 0.7
    // So, finals = (target - midterm * 0.3) / 0.7
    requiredContribution = (targetGrade - (currentMidterm * 0.3)) / 0.7;
  } else {
    // For midterm: target = midterm * 0.3 + finals * 0.7 (assume finals = targetGrade for minimum required)
    // So, midterm = (target - targetGrade * 0.7) / 0.3
    requiredContribution = (targetGrade - (targetGrade * 0.7)) / 0.3;
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
  
  // Find missing quiz scores
  const missingQuizIndices = periodState.quizScores.map((score, index) => 
    score === null ? index : -1).filter(index => index !== -1);
  
  // Check if exam score is missing
  const isExamMissing = periodState.examScore === null;
  
  // No missing fields, return early
  if (missingQuizIndices.length === 0 && !isExamMissing) {
    return {
      neededScores: {},
      isPossible: true,
      message: "All fields are filled."
    };
  }
  
  // Calculate total weight of missing components
  const quizWeight = 0.35; // Total quiz weight
  const examWeight = 0.45; // Exam weight
  
  let totalMissingWeight = 0;
  if (missingQuizIndices.length > 0) {
    // If all quizzes are missing, full quiz weight is missing
    // If some quizzes are missing, calculate proportional missing weight
    const missingQuizProportion = missingQuizIndices.length / periodState.quizScores.length;
    totalMissingWeight += quizWeight * missingQuizProportion;
  }
  
  if (isExamMissing) {
    totalMissingWeight += examWeight;
  }
  
  // If there are missing components, distribute the needed additional contribution
  if (totalMissingWeight > 0) {
    // Process missing quizzes
    if (missingQuizIndices.length > 0) {
      const quizProportion = (quizWeight / totalMissingWeight) * additionalNeeded;
      const perQuizAdditionalNeeded = quizProportion / missingQuizIndices.length;
      
      missingQuizIndices.forEach(index => {
        const maxScore = periodState.quizMaxScores[index] || 100;
        
        // Calculate required raw score percentage before adjustment formula
        // Formula used: ((score * 0.5) + 50) * 0.35 * (1/quizCount)
        // So, solve for score: score = (requiredPercentage / (0.35 * (1/quizCount) * 0.5) - 50) * 2
        
        // Since the quiz contributes requiredPercentage to the overall grade:
        const quizAdjustedContribution = perQuizAdditionalNeeded / (quizWeight / periodState.quizScores.length);
        const rawPercentage = ((quizAdjustedContribution - 50) * 2);
        
        // Convert percentage to actual score
        let neededScore = (rawPercentage / 100) * maxScore;
        
        // Clamp the score to be within realistic bounds
        neededScore = Math.min(maxScore, Math.max(0, neededScore));
        neededScore = Math.round(neededScore * 10) / 10; // Round to 1 decimal place
        
        const quizNumber = isFinals ? index + 3 : index + 1; // Quiz 3/4 for finals, 1/2 for midterm
        
        if (neededScore >= maxScore) {
          result.neededScores[`Quiz ${quizNumber}`] = `Max score is ${maxScore}, may not be enough`;
          result.isPossible = false;
        } else if (neededScore <= 0) {
          result.neededScores[`Quiz ${quizNumber}`] = `Any score will work`;
        } else {
          result.neededScores[`Quiz ${quizNumber}`] = `Need ${neededScore} out of ${maxScore}`;
        }
      });
    }
    
    // Process missing exam
    if (isExamMissing) {
      const examProportion = (examWeight / totalMissingWeight) * additionalNeeded;
      const maxScore = periodState.examMaxScore || 100;
      
      // Calculate required raw score percentage before adjustment formula
      // Formula: ((score * 0.5) + 50) * 0.45 = examProportion
      // Solve for score: score = (examProportion / 0.45 / 0.5 - 50) * 2
      const examAdjustedContribution = examProportion / examWeight;
      const rawPercentage = ((examAdjustedContribution - 50) * 2);
      
      // Convert percentage to actual score
      let neededScore = (rawPercentage / 100) * maxScore;
      
      // Clamp the score
      neededScore = Math.min(maxScore, Math.max(0, neededScore));
      neededScore = Math.round(neededScore * 10) / 10; // Round to 1 decimal place
      
      if (neededScore >= maxScore) {
        result.neededScores["Major Exam"] = `Max score is ${maxScore}, may not be enough`;
        result.isPossible = false;
      } else if (neededScore <= 0) {
        result.neededScores["Major Exam"] = `Any score will work`;
      } else {
        result.neededScores["Major Exam"] = `Need ${neededScore} out of ${maxScore}`;
      }
    }
    
    // Set a message based on the possibility
    if (!result.isPossible) {
      result.message = "Some required scores exceed maximum possible scores.";
    } else if (Object.keys(result.neededScores).length > 0) {
      result.message = "Here are the scores you need to reach the target grade.";
    }
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
