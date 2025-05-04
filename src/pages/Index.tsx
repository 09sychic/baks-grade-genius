
import React from "react";
import GradeCalculator from "@/components/GradeCalculator";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-calc-soft-purple p-4 md:p-8">
      <div className="container mx-auto">
        <GradeCalculator />
        <footer className="text-center text-sm text-calc-neutral-gray mt-8 pb-4">
          © 2025 Calculus ni Baks | A handy professor-grade calculator
        </footer>
      </div>
    </div>
  );
};

export default Index;
