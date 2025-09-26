// webview-ui/src/types.ts

export interface Suggestion {
  id: string;
  model_name: string;
  category: string;
  description: string;
  line_number: number;
  suggestion: string;
}

export type FilterType = 'All' | 'Repair' | 'Performance' | 'Advance';

export interface AIReviewDetail {
    category: string;
    line_number: number;
    description: string;
    details?: string;
    suggestion: string;
}

export interface AIReview {
    details?: AIReviewDetail[];
    panels?: AIReviewDetail[];
}

export interface InspectionResult {
    model_name: string;
    review?: AIReview;
    error?: string;
}