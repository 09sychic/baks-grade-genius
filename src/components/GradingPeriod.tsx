
import React from "react";
import { Input } from "@/components/ui/input";

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

  return (
    <div className="calculator-card">
      <div className="card-header">{periodName}</div>
      <div className="calculator-body">
        {/* Quiz Inputs */}
        {[0, 1].map((i) => (
          <div key={`quiz-${quizNumbers[i]}`} className="input-group">
            <label htmlFor={`quiz${quizNumbers[i]}`}>Quiz {quizNumbers[i]}</label>
            <div className="input-pair">
              <Input
                id={`quiz${quizNumbers[i]}`}
                type="number"
                min="0"
                value={quizScores[i] === null ? "" : quizScores[i]}
                onChange={(e) => handleInputChange(e, "quizScores", i)}
                placeholder="Score"
                className="flex-1"
              />
              <Input
                type="number"
                min="1"
                value={quizMaxScores[i] === null ? "" : quizMaxScores[i]}
                onChange={(e) => handleInputChange(e, "quizMaxScores", i)}
                placeholder="Max (default 100)"
                className="flex-1"
              />
            </div>
          </div>
        ))}

        {/* Major Exam */}
        <div className="input-group">
          <label htmlFor={`exam-${periodName}`}>Major Exam</label>
          <div className="input-pair">
            <Input
              id={`exam-${periodName}`}
              type="number"
              min="0"
              value={examScore === null ? "" : examScore}
              onChange={(e) => handleInputChange(e, "examScore")}
              placeholder="Score"
              className="flex-1"
            />
            <Input
              type="number"
              min="1"
              value={examMaxScore === null ? "" : examMaxScore}
              onChange={(e) => handleInputChange(e, "examMaxScore")}
              placeholder="Max (default 100)"
              className="flex-1"
            />
          </div>
        </div>

        {/* Attendance */}
        <div className="input-group">
          <label htmlFor={`attendance-${periodName}`}>Attendance</label>
          <Input
            id={`attendance-${periodName}`}
            type="number"
            min="0"
            max="10"
            value={attendance === null ? "" : attendance}
            onChange={(e) => handleInputChange(e, "attendance")}
            placeholder="Out of 10"
            className="flex-1"
          />
        </div>

        {/* Problem Set */}
        <div className="input-group">
          <label htmlFor={`problemSet-${periodName}`}>Problem Set</label>
          <Input
            id={`problemSet-${periodName}`}
            type="number"
            min="0"
            max="10"
            value={problemSet === null ? "" : problemSet}
            onChange={(e) => handleInputChange(e, "problemSet")}
            placeholder="Out of 10"
            className="flex-1"
          />
        </div>

        {/* Period Grade Display */}
        <div className="grade-result">
          <h3>{periodName} Grade</h3>
          <div className="grade-value">
            {periodGrade.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradingPeriod;
