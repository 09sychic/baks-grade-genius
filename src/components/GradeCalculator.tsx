
import React, { useState, useEffect } from "react";
import GradingPeriod from "./GradingPeriod";
import { Calculator, AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  calculatePeriodGrade, 
  calculateFinalGrade, 
  calculateGPE,
  getGradeColor,
  formatFinalGrade,
  hasValidationErrors
} from "@/utils/calculationUtils";

const GradeCalculator: React.FC = () => {
  // Midterm state
  const [midtermState, setMidtermState] = useState({
    quizScores: [null, null] as [number | null, number | null],
    quizMaxScores: [100, 100] as [number | null, number | null],
    examScore: null as number | null,
    examMaxScore: 100 as number | null,
    attendance: null as number | null,
    problemSet: null as number | null,
  });

  // Finals state
  const [finalsState, setFinalsState] = useState({
    quizScores: [null, null] as [number | null, number | null],
    quizMaxScores: [100, 100] as [number | null, number | null],
    examScore: null as number | null,
    examMaxScore: 100 as number | null,
    attendance: null as number | null,
    problemSet: null as number | null,
  });

  // Validation state
  const [errors, setErrors] = useState<{
    midterm: { [key: string]: string | null },
    finals: { [key: string]: string | null }
  }>({
    midterm: {},
    finals: {}
  });

  // Form submission status
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Calculated grades
  const [grades, setGrades] = useState({
    midterm: 0,
    finals: 0,
    finalGrade: 0,
    gpe: "N/A",
  });

  // Validate inputs
  const validateInput = (value: number | null, field: string, max: number = 100): string | null => {
    if (value === null) return null;
    if (isNaN(Number(value))) return "Must be a number";
    if (value < 0) return "Cannot be negative";
    if (field.includes("attendance") || field.includes("problemSet")) {
      if (value > 10) return "Maximum is 10";
    } else if (value > max) {
      return `Maximum is ${max}`;
    }
    return null;
  };

  // Handle changes to midterm inputs with validation
  const handleMidtermChange = (field: string, value: number | null, index?: number) => {
    // Reset form submission status when user makes changes
    if (formSubmitted) setFormSubmitted(false);
    
    // Validate the input
    let error: string | null = null;
    let maxValue = 100;
    
    if (field === "quizScores" && index !== undefined) {
      maxValue = midtermState.quizMaxScores[index] || 100;
    } else if (field === "examScore") {
      maxValue = midtermState.examMaxScore || 100;
    }
    
    error = validateInput(value, field, maxValue);
    
    // Update errors state
    setErrors(prev => ({
      ...prev,
      midterm: {
        ...prev.midterm,
        [index !== undefined ? `${field}${index}` : field]: error
      }
    }));
    
    // Update the state
    setMidtermState((prev) => {
      if (index !== undefined && (field === "quizScores" || field === "quizMaxScores")) {
        const newArray = [...prev[field]];
        newArray[index] = value;
        return { ...prev, [field]: newArray };
      }
      return { ...prev, [field]: value };
    });
  };

  // Handle changes to finals inputs with validation
  const handleFinalsChange = (field: string, value: number | null, index?: number) => {
    // Reset form submission status when user makes changes
    if (formSubmitted) setFormSubmitted(false);
    
    // Validate the input
    let error: string | null = null;
    let maxValue = 100;
    
    if (field === "quizScores" && index !== undefined) {
      maxValue = finalsState.quizMaxScores[index] || 100;
    } else if (field === "examScore") {
      maxValue = finalsState.examMaxScore || 100;
    }
    
    error = validateInput(value, field, maxValue);
    
    // Update errors state
    setErrors(prev => ({
      ...prev,
      finals: {
        ...prev.finals,
        [index !== undefined ? `${field}${index}` : field]: error
      }
    }));
    
    // Update the state
    setFinalsState((prev) => {
      if (index !== undefined && (field === "quizScores" || field === "quizMaxScores")) {
        const newArray = [...prev[field]];
        newArray[index] = value;
        return { ...prev, [field]: newArray };
      }
      return { ...prev, [field]: value };
    });
  };

  // Calculate grades whenever inputs change and there are no errors
  useEffect(() => {
    // Skip calculation if there are validation errors or form hasn't been submitted yet
    if (hasValidationErrors(errors.midterm) || hasValidationErrors(errors.finals) || !formSubmitted) {
      return;
    }

    // Calculate midterm grade
    const midtermGrade = calculatePeriodGrade(
      midtermState.quizScores.filter((score): score is number => score !== null),
      midtermState.quizMaxScores.filter((max): max is number => max !== null),
      midtermState.examScore || 0,
      midtermState.examMaxScore || 100,
      midtermState.attendance || 0,
      midtermState.problemSet || 0
    );

    // Calculate finals grade
    const finalsGrade = calculatePeriodGrade(
      finalsState.quizScores.filter((score): score is number => score !== null),
      finalsState.quizMaxScores.filter((max): max is number => max !== null),
      finalsState.examScore || 0,
      finalsState.examMaxScore || 100,
      finalsState.attendance || 0,
      finalsState.problemSet || 0
    );

    // Calculate final grade and GPE
    const finalGrade = calculateFinalGrade(midtermGrade, finalsGrade);
    const gpe = calculateGPE(finalGrade);

    setGrades({
      midterm: midtermGrade,
      finals: finalsGrade,
      finalGrade: finalGrade,
      gpe: gpe,
    });
  }, [midtermState, finalsState, errors, formSubmitted]);

  // Function to get grade color class
  const getColorClass = (grade: number) => {
    return getGradeColor(grade);
  };

  // Handle form submission
  const handleCalculate = () => {
    setFormSubmitted(true);

    // Validate all fields
    const midtermErrors: { [key: string]: string | null } = {};
    const finalsErrors: { [key: string]: string | null } = {};

    // Validate midterm quizzes
    midtermState.quizScores.forEach((score, index) => {
      const maxScore = midtermState.quizMaxScores[index] || 100;
      midtermErrors[`quizScores${index}`] = validateInput(score, 'quizScores', maxScore);
    });

    // Validate midterm quiz max scores
    midtermState.quizMaxScores.forEach((maxScore, index) => {
      midtermErrors[`quizMaxScores${index}`] = validateInput(maxScore, 'quizMaxScores');
    });

    // Validate other midterm fields
    midtermErrors.examScore = validateInput(midtermState.examScore, 'examScore', midtermState.examMaxScore || 100);
    midtermErrors.examMaxScore = validateInput(midtermState.examMaxScore, 'examMaxScore');
    midtermErrors.attendance = validateInput(midtermState.attendance, 'attendance', 10);
    midtermErrors.problemSet = validateInput(midtermState.problemSet, 'problemSet', 10);

    // Validate finals quizzes
    finalsState.quizScores.forEach((score, index) => {
      const maxScore = finalsState.quizMaxScores[index] || 100;
      finalsErrors[`quizScores${index}`] = validateInput(score, 'quizScores', maxScore);
    });

    // Validate finals quiz max scores
    finalsState.quizMaxScores.forEach((maxScore, index) => {
      finalsErrors[`quizMaxScores${index}`] = validateInput(maxScore, 'quizMaxScores');
    });

    // Validate other finals fields
    finalsErrors.examScore = validateInput(finalsState.examScore, 'examScore', finalsState.examMaxScore || 100);
    finalsErrors.examMaxScore = validateInput(finalsState.examMaxScore, 'examMaxScore');
    finalsErrors.attendance = validateInput(finalsState.attendance, 'attendance', 10);
    finalsErrors.problemSet = validateInput(finalsState.problemSet, 'problemSet', 10);

    // Update the errors state
    setErrors({
      midterm: midtermErrors,
      finals: finalsErrors,
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-calc-purple flex items-center justify-center gap-2">
          <Calculator className="h-8 w-8" />
          <span>Calculus ni Baks</span>
        </h1>
        <p className="text-calc-neutral-gray">
          Real-time grade calculator for Calculus students
        </p>
      </div>

      {/* Grading Periods */}
      <div className="space-y-6">
        <GradingPeriod
          periodName="Midterm"
          quizNumbers={[1, 2]}
          quizScores={midtermState.quizScores}
          quizMaxScores={midtermState.quizMaxScores}
          examScore={midtermState.examScore}
          examMaxScore={midtermState.examMaxScore}
          attendance={midtermState.attendance}
          problemSet={midtermState.problemSet}
          periodGrade={formSubmitted && !hasValidationErrors(errors.midterm) ? grades.midterm : 0}
          onChange={handleMidtermChange}
          errors={errors.midterm}
        />

        <GradingPeriod
          periodName="Finals"
          quizNumbers={[3, 4]}
          quizScores={finalsState.quizScores}
          quizMaxScores={finalsState.quizMaxScores}
          examScore={finalsState.examScore}
          examMaxScore={finalsState.examMaxScore}
          attendance={finalsState.attendance}
          problemSet={finalsState.problemSet}
          periodGrade={formSubmitted && !hasValidationErrors(errors.finals) ? grades.finals : 0}
          onChange={handleFinalsChange}
          errors={errors.finals}
        />
      </div>

      {/* Calculate Button */}
      <div className="mt-6 mb-8">
        <button 
          onClick={handleCalculate}
          className="w-full py-3 bg-calc-purple hover:bg-calc-dark-purple text-white font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Calculator className="h-5 w-5" />
          Calculate Grades
        </button>
        
        {formSubmitted && (hasValidationErrors(errors.midterm) || hasValidationErrors(errors.finals)) && (
          <Alert className="mt-4 border-calc-red bg-calc-red/10 text-calc-red">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please correct the errors before calculating grades
            </AlertDescription>
          </Alert>
        )}
        
        {formSubmitted && !hasValidationErrors(errors.midterm) && !hasValidationErrors(errors.finals) && (
          <Alert className="mt-4 border-green-500 bg-green-500/10 text-green-500">
            <Check className="h-4 w-4" />
            <AlertDescription>
              Grades calculated successfully
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Final Results */}
      <div className={`calculator-card mt-8 ${!formSubmitted || hasValidationErrors(errors.midterm) || hasValidationErrors(errors.finals) ? 'opacity-50' : ''}`}>
        <div className="card-header bg-calc-dark-purple">Final Results</div>
        <div className="calculator-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grade-result">
            <h3>Final Grade</h3>
            <div className={`grade-value text-2xl ${formSubmitted && !hasValidationErrors(errors.midterm) && !hasValidationErrors(errors.finals) ? getColorClass(grades.finalGrade) : 'text-gray-400'}`}>
              {formSubmitted && !hasValidationErrors(errors.midterm) && !hasValidationErrors(errors.finals) 
                ? formatFinalGrade(grades.finalGrade)
                : "N/A"}
            </div>
          </div>
          <div className="grade-result">
            <h3>Grade Point Equivalent (GPE)</h3>
            <div className={`grade-value text-2xl ${formSubmitted && !hasValidationErrors(errors.midterm) && !hasValidationErrors(errors.finals) ? getColorClass(grades.finalGrade) : 'text-gray-400'}`}>
              {formSubmitted && !hasValidationErrors(errors.midterm) && !hasValidationErrors(errors.finals) 
                ? grades.gpe
                : "N/A"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeCalculator;
