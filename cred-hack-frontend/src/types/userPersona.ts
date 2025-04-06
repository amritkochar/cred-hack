/**
 * User Persona related types
 */

// Investment goal object
export interface InvestmentGoal {
  id?: string;
  name: string;
  description?: string;
  targetAmount?: number;
  targetDate?: string;
  priority?: string;
  progress?: number;
  // Add other properties as needed
}

// Spending pattern object
export interface SpendingPattern {
  monthly_avg_spend?: number;
  monthly_savings_rate?: number;
  monthly_avg_categories?: Record<string, number>;
  monthly_avg_surplus?: number;
  monthly_avg_income?: number;
  // Add other properties as needed
}

// Financial summary object
export interface FinancialSummary {
  monthly_historic?: Record<string, {
    income?: number;
    surplus?: number;
    spends?: number;
  }>;
  total_cumulative?: {
    income?: number;
    spends?: number;
    categories?: Record<string, number>;
    surplus?: number;
  };
  // Add other properties as needed
}

// User persona object
export interface UserPersona {
  risk_profile: string;
  investment_goals: InvestmentGoal[];
  spending_pattern: SpendingPattern;
  financial_summary: FinancialSummary;
  personal_context: string[];
}
