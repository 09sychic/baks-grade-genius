
import React, { useState, useEffect } from "react";
import GradingPeriod from "./GradingPeriod";
import { Calculator } from "lucide-react";
import { 
  calculatePeriodGrade, 
  calculateFinalGrade, 
  calculateGPE 
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

  // Calculated grades
  const [grades, setGrades] = useState({
    midterm: 0,
    finals: 0,
    finalGrade: 0,
    gpe: "N/A",
  });

  // Handle changes to midterm inputs
  const handleMidtermChange = (field: string, value: number | null, index?: number) => {
    setMidtermState((prev) => {
      if (index !== undefined && (field === "quizScores" || field === "quizMaxScores")) {
        const newArray = [...prev[field]];
        newArray[index] = value;
        return { ...prev, [field]: newArray };
      }
      return { ...prev, [field]: value };
    });
  };

  // Handle changes to finals inputs
  const handleFinalsChange = (field: string, value: number | null, index?: number) => {
    setFinalsState((prev) => {
      if (index !== undefined && (field === "quizScores" || field === "quizMaxScores")) {
        const newArray = [...prev[field]];
        newArray[index] = value;
        return { ...prev, [field]: newArray };
      }
      return { ...prev, [field]: value };
    });
  };

  // Calculate grades whenever inputs change
  useEffect(() => {
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
  }, [midtermState, finalsState]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-calc-dark-purple flex items-center justify-center gap-2">
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
          periodGrade={grades.midterm}
          onChange={handleMidtermChange}
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
          periodGrade={grades.finals}
          onChange={handleFinalsChange}
        />
      </div>

      {/* Final Results */}
      <div className="calculator-card mt-8">
        <div className="card-header bg-calc-dark-purple">Final Results</div>
        <div className="calculator-body grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grade-result">
            <h3>Final Grade</h3>
            <div className="grade-value text-2xl">{grades.finalGrade.toFixed(2)}</div>
          </div>
          <div className="grade-result">
            <h3>Grade Point Equivalent (GPE)</h3>
            <div className="grade-value text-2xl">{grades.gpe}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeCalculator;
