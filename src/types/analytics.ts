export interface AnalyticsSummary {
  active_users: number;
  sessions: number;
  unique_users: number;
  top_articles: Array<{
    detail_id: number;
    views: number;
    avg_duration_seconds: number;
  }>;
  top_sections: Array<{
    section_id: number;
    views: number;
    avg_duration_seconds: number;
  }>;
  actions: Record<string, number>;
  notification_opens: number;
  new_registrations: number;
}

export interface AnalyticsQueryResponse<T> {
  message: string;
  data: {
    table: string;
    filters: any;
    pagination: {
      mode: string;
      page: number;
      per_page: number;
      total: number;
      total_pages: number;
      returned: number;
      has_next: boolean;
      has_prev: boolean;
    };
    order_by: string;
    order_dir: string;
    items: T[];
  };
}

// Modelos Base (simplificados)
export interface ArticleView {
  id: string;
  detail_id: string;
  duration_seconds: number;
  entered_at: string;
  exited_at: string;
}

export interface SectionView {
  id: string;
  section_id: string;
  nav_key: string;
  duration_seconds: number;
}

export interface ActionEvent {
  id: string;
  action_type: string;
  detail_id: string;
  occurred_at: string;
}

export interface SessionData {
  id: string;
  duration_seconds: number;
  started_at: string;
}
