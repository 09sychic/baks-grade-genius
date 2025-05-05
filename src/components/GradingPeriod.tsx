
import React from "react";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

interface GradingPeriodProps {
  periodName: string;
  quizNumbers: [number, number]; // e.g., [1, 2] for Midterm, [3, 4] for Finals
  quizScores: [number | null, number | null];
  quizMaxScores: [number | null, number | null];
  examScore: number | null;
  examMaxScore: number | null;
  attendance: number | null;
  problemSet: number | null;
  periodGrade: number;
  onChange: (
    field: string,
    value: number | null,
    index?: number
  ) => void;
  errors?: { [key: string]: string | null };
}

const GradingPeriod: React.FC<GradingPeriodProps> = ({
  periodName,
  quizNumbers,
  quizScores,
  quizMaxScores,
  examScore,
  examMaxScore,
  attendance,
  problemSet,
  periodGrade,
  onChange,
  errors = {},
}) => {
  // Helper function to handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    index?: number
  ) => {
    const value = e.target.value === "" ? null : parseFloat(e.target.value);
    onChange(field, value, index);
  };

  // Helper function to get color based on period grade
  const getGradeColor = (grade: number): string => {
    const roundedGrade = Math.round(grade);
    
    if (roundedGrade < 75) return "text-calc-red"; // Failed
    if (roundedGrade < 80) return "text-yellow-500"; // Passed but needs improvement
    if (roundedGrade < 90) return "text-orange-400"; // Good
    return "text-green-500"; // Excellent
  };

  return (
    <div className="calculator-card shadow-lg">
      <div className="card-header flex items-center justify-center">
        <h2 className="text-lg font-semibold">{periodName}</h2>
      </div>
      <div className="calculator-body space-y-5">
        {/* Quiz Inputs */}
        {[0, 1].map((i) => (
          <div key={`quiz-${quizNumbers[i]}`} className="input-group">
            <label htmlFor={`quiz${quizNumbers[i]}`} className="text-base font-medium text-gray-200">
              Quiz {quizNumbers[i]}
            </label>
            <div className="flex flex-col flex-1 w-full">
              <div className="input-pair">
                <div className="flex flex-col flex-1">
                  <Input
                    id={`quiz${quizNumbers[i]}`}
                    type="number"
                    min="0"
                    value={quizScores[i] === null ? "" : quizScores[i]}
                    onChange={(e) => handleInputChange(e, "quizScores", i)}
                    placeholder="Score"
                    className={`flex-1 h-11 rounded-md ${errors[`quizScores${i}`] ? "border-calc-red focus-visible:ring-calc-red" : "border-gray-600 focus-visible:ring-primary"}`}
                  />
                  {errors[`quizScores${i}`] && (
                    <div className="text-xs text-calc-red flex items-center mt-1">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors[`quizScores${i}`]}
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1">
                  <Input
                    type="number"
                    min="1"
                    value={quizMaxScores[i] === null ? "" : quizMaxScores[i]}
                    onChange={(e) => handleInputChange(e, "quizMaxScores", i)}
                    placeholder="Max (default 100)"
                    className={`flex-1 h-11 rounded-md ${errors[`quizMaxScores${i}`] ? "border-calc-red focus-visible:ring-calc-red" : "border-gray-600 focus-visible:ring-primary"}`}
                  />
                  {errors[`quizMaxScores${i}`] && (
                    <div className="text-xs text-calc-red flex items-center mt-1">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors[`quizMaxScores${i}`]}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Major Exam */}
        <div className="input-group">
          <label htmlFor={`exam-${periodName}`} className="text-base font-medium text-gray-200">
            Major Exam
          </label>
          <div className="flex flex-col flex-1 w-full">
            <div className="input-pair">
              <div className="flex flex-col flex-1">
                <Input
                  id={`exam-${periodName}`}
                  type="number"
                  min="0"
                  value={examScore === null ? "" : examScore}
                  onChange={(e) => handleInputChange(e, "examScore")}
                  placeholder="Score"
                  className={`flex-1 h-11 rounded-md ${errors.examScore ? "border-calc-red focus-visible:ring-calc-red" : "border-gray-600 focus-visible:ring-primary"}`}
                />
                {errors.examScore && (
                  <div className="text-xs text-calc-red flex items-center mt-1">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.examScore}
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-1">
                <Input
                  type="number"
                  min="1"
                  value={examMaxScore === null ? "" : examMaxScore}
                  onChange={(e) => handleInputChange(e, "examMaxScore")}
                  placeholder="Max (default 100)"
                  className={`flex-1 h-11 rounded-md ${errors.examMaxScore ? "border-calc-red focus-visible:ring-calc-red" : "border-gray-600 focus-visible:ring-primary"}`}
                />
                {errors.examMaxScore && (
                  <div className="text-xs text-calc-red flex items-center mt-1">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.examMaxScore}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Attendance */}
        <div className="input-group">
          <label htmlFor={`attendance-${periodName}`} className="text-base font-medium text-gray-200">
            Attendance
          </label>
          <div className="flex flex-col flex-1">
            <Input
              id={`attendance-${periodName}`}
              type="number"
              min="0"
              max="10"
              value={attendance === null ? "10" : attendance}
              onChange={(e) => handleInputChange(e, "attendance")}
              placeholder="Out of 10"
              className={`flex-1 h-11 rounded-md max-w-[140px] ${errors.attendance ? "border-calc-red focus-visible:ring-calc-red" : "border-gray-600 focus-visible:ring-primary"}`}
            />
            {errors.attendance && (
              <div className="text-xs text-calc-red flex items-center mt-1">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.attendance}
              </div>
            )}
          </div>
        </div>

        {/* Problem Set */}
        <div className="input-group">
          <label htmlFor={`problemSet-${periodName}`} className="text-base font-medium text-gray-200">
            Problem Set
          </label>
          <div className="flex flex-col flex-1">
            <Input
              id={`problemSet-${periodName}`}
              type="number"
              min="0"
              max="10"
              value={problemSet === null ? "10" : problemSet}
              onChange={(e) => handleInputChange(e, "problemSet")}
              placeholder="Out of 10"
              className={`flex-1 h-11 rounded-md max-w-[140px] ${errors.problemSet ? "border-calc-red focus-visible:ring-calc-red" : "border-gray-600 focus-visible:ring-primary"}`}
            />
            {errors.problemSet && (
              <div className="text-xs text-calc-red flex items-center mt-1">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.problemSet}
              </div>
            )}
          </div>
        </div>

        {/* Period Grade Display */}
        <div className="grade-result rounded-xl bg-gray-700/70 backdrop-blur-sm">
          <h3 className="text-calc-purple font-semibold text-lg">{periodName} Grade</h3>
          <div className={`grade-value text-2xl font-bold ${getGradeColor(periodGrade)}`}>
            {Math.round(periodGrade)} ({periodGrade.toFixed(2)})
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradingPeriod;
